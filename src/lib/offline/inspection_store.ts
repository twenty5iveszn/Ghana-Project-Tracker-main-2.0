import { FieldInspection } from '../../types/project';

const DB_NAME = 'ghanabuild-field-v1';
const DB_VERSION = 1;
type StoreName = 'projects' | 'drafts' | 'media' | 'queue' | 'sync_errors';
export interface OfflineProject { id: string; title: string; slug: string; location_name: string; region_id: string; district_id: string; community_id?: string | null; category_id: string; contractor_name?: string; project_status: string; progress_percentage: number; expected_completion_date?: string | null; cached_at: string; }
export interface InspectionDraft { id: string; project_id: string; payload: Record<string, unknown>; status: 'LOCAL_DRAFT' | 'QUEUED' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED' | 'CONFLICT'; created_at: string; updated_at: string; last_error?: string; }
export interface OfflineMedia { id: string; inspection_id: string; blob: Blob; filename: string; mime_type: string; size: number; captured_at: string; latitude?: number | null; longitude?: number | null; upload_status: 'QUEUED' | 'UPLOADED' | 'FAILED'; retry_count: number; }
export interface SyncQueueItem { id: string; entity_type: 'FIELD_INSPECTION' | 'FIELD_EVIDENCE'; entity_id: string; operation: 'CREATE' | 'UPLOAD'; payload: Record<string, unknown>; status: 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CONFLICT'; retry_count: number; last_error?: string; created_at: string; next_retry_at: string; }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      ['projects', 'drafts', 'media', 'queue', 'sync_errors'].forEach((store) => { if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' }); });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putOffline<T extends { id: string }>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => { const transaction = db.transaction(storeName, 'readwrite'); transaction.objectStore(storeName).put(value); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
}

export async function listOffline<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => { const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll(); request.onsuccess = () => resolve(request.result as T[]); request.onerror = () => reject(request.error); });
}

export async function removeOffline(storeName: StoreName, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => { const transaction = db.transaction(storeName, 'readwrite'); transaction.objectStore(storeName).delete(id); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
}

export async function queueInspection(payload: Record<string, unknown>): Promise<SyncQueueItem> {
  const now = new Date().toISOString();
  const item: SyncQueueItem = { id: crypto.randomUUID(), entity_type: 'FIELD_INSPECTION', entity_id: String(payload.client_id), operation: 'CREATE', payload, status: 'QUEUED', retry_count: 0, created_at: now, next_retry_at: now };
  await putOffline('queue', item);
  return item;
}

export async function requestBackgroundSync(): Promise<void> {
  const registration = await navigator.serviceWorker?.ready;
  if (registration && 'sync' in registration) await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('ghanabuild-inspection-sync');
}

export async function syncInspectionQueue(onStatus?: (message: string) => void, token?: string | null): Promise<{ synced: number; failed: number }> {
  const queue = await listOffline<SyncQueueItem>('queue'); let synced = 0; let failed = 0;
  for (const item of queue.filter((entry) => entry.status === 'QUEUED' || entry.status === 'FAILED')) {
    if (new Date(item.next_retry_at) > new Date()) continue;
    item.status = 'PROCESSING'; await putOffline('queue', item); onStatus?.('Syncing field inspection...');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }; if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch('/api/inspections', { method: 'POST', headers, body: JSON.stringify(item.payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Sync failed');
      const media = (await listOffline<OfflineMedia>('media')).filter((file) => file.inspection_id === item.entity_id && file.upload_status !== 'UPLOADED');
      for (const file of media) {
        onStatus?.('Uploading inspection photo securely...');
        const authorization = await fetch('/api/evidence/upload-authorize', { method: 'POST', headers, body: JSON.stringify({ project_id: item.payload.project_id, inspection_id: result.data.id, client_evidence_id: file.id, mime_type: file.mime_type, size: file.size, filename: file.filename }) });
        const approved = await authorization.json();
        if (!authorization.ok) throw new Error(approved.error?.message || 'Photo upload authorization failed');
        if (!approved.data.already_confirmed) {
          const upload = await fetch(approved.data.signed_url, { method: 'PUT', headers: { 'Content-Type': file.mime_type }, body: file.blob });
          if (!upload.ok) throw new Error('Photo binary upload failed');
          const confirmation = await fetch('/api/evidence/confirm', { method: 'POST', headers, body: JSON.stringify({ evidence_id: approved.data.evidence_id, storage_path: approved.data.storage_path, project_id: item.payload.project_id, inspection_id: result.data.id, client_evidence_id: file.id, mime_type: file.mime_type, size: file.size, filename: file.filename, captured_at: file.captured_at, latitude: file.latitude, longitude: file.longitude }) });
          const confirmed = await confirmation.json(); if (!confirmation.ok) throw new Error(confirmed.error?.message || 'Photo metadata confirmation failed');
        }
        file.upload_status = 'UPLOADED'; await putOffline('media', file); await removeOffline('media', file.id);
      }
      item.status = 'SUCCESS'; await putOffline('queue', item); synced += 1; onStatus?.(result.duplicate ? 'Inspection already synchronized.' : 'Inspection synchronized.');
    } catch (error) {
      item.status = 'FAILED'; item.retry_count += 1; item.last_error = error instanceof Error ? error.message : 'Sync failed'; item.next_retry_at = new Date(Date.now() + Math.min(3600000, 1000 * 2 ** item.retry_count)).toISOString(); await putOffline('queue', item); failed += 1; onStatus?.('Upload failed. Your inspection is still safely stored on this device.');
    }
  }
  return { synced, failed };
}

export function validateCapturedImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Only image evidence is supported in offline capture.';
  if (file.size > 12 * 1024 * 1024) return 'This image is larger than 12 MB. Choose a smaller image.';
  return null;
}

export async function compressImage(file: File, maxDimension = 1800, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file); const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale); canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality));
}
