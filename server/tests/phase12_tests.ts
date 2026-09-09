import { projectStore } from '../db/project_store';
import { Profile } from '../../src/types/user';

const national: Profile = { id: 'phase12-national', auth_user_id: 'phase12-national', full_name: 'Phase 12 National Monitor', email: 'phase12@example.com', role: 'NATIONAL_MONITOR', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
const unauthorized: Profile = { ...national, id: 'phase12-district', role: 'MMDCE_OFFICER', region_id: 'REG-ASHANTI-01', district_id: 'DIST-KUMASI-METRO' };

export function runPhase12Tests() {
  const started = Date.now();
  const project = projectStore.listProjects({ verification_status: 'VERIFIED', limit: 100 }).projects[0];
  const results: Array<{ id: string; name: string; passed: boolean; message: string }> = [];
  if (!project) return { suite: 'Phase 12 Offline Field Inspections', total: 1, passed: 0, failed: 1, allPassed: false, duration_ms: Date.now() - started, results: [{ id: 'TEST_FIXTURE', name: 'Verified project fixture', passed: false, message: 'No verified project fixture available.' }] };
  const suffix = Date.now().toString(36);
  const payload = { client_id: `phase12-client-${suffix}`, inspection_reference: `PHASE12-${suffix}`, inspection_date: new Date().toISOString(), inspection_type: 'PROGRESS' as const, observed_status: 'ONGOING' as const, observed_progress_percentage: 55, observations: 'Controlled field inspection observation.', issues_found: ['DELAYED_WORK' as const], safety_observations: null, environmental_observations: null, latitude: project.latitude, longitude: project.longitude, gps_accuracy: 8, captured_at: new Date().toISOString(), device_timestamp: new Date().toISOString() };
  try {
    const first = projectStore.createFieldInspection(project.id, payload, national);
    const replay = projectStore.createFieldInspection(project.id, payload, national);
    results.push({ id: 'TEST_IDEMPOTENT_SYNC', name: 'Inspection replay is idempotent', passed: !first.duplicate && replay.duplicate && first.inspection.id === replay.inspection.id, message: 'Retrying the same client operation does not create a duplicate.' });
    results.push({ id: 'TEST_GPS_DISTANCE', name: 'GPS distance and metadata are recorded', passed: first.inspection.distance_from_project_meters === 0 && first.inspection.gps_accuracy === 8, message: 'WGS-84 coordinates are retained and distance is computed server-side.' });
    let forbidden = false;
    try { projectStore.createFieldInspection(project.id, { ...payload, client_id: `${payload.client_id}-idor`, inspection_reference: `${payload.inspection_reference}-IDOR` }, unauthorized); } catch (error) { forbidden = error instanceof Error && error.message === 'INSPECTION_JURISDICTION_FORBIDDEN'; }
    results.push({ id: 'TEST_INSPECTION_IDOR', name: 'Inspection jurisdiction is enforced', passed: forbidden, message: forbidden ? 'Cross-district inspection capture rejected.' : 'Cross-district inspection capture was accepted.' });
    const reviewed = projectStore.reviewFieldInspection(first.inspection.id, 'VERIFIED', 'Reviewed in controlled test.', national);
    const publicRecords = projectStore.getPublicInspectionSummaries(project.id);
    results.push({ id: 'TEST_REVIEW_VISIBILITY', name: 'Only verified inspections are public', passed: reviewed.verification_status === 'VERIFIED' && publicRecords.some((record) => record.id === first.inspection.id), message: 'Review status controls public inspection visibility.' });
    const audit = projectStore.getAuditLogs({ entityId: first.inspection.id });
    results.push({ id: 'TEST_INSPECTION_AUDIT', name: 'Inspection sync and review are audited', passed: audit.some((record) => record.action === 'FIELD_INSPECTION_SYNCED') && audit.some((record) => record.action === 'FIELD_INSPECTION_VERIFIED'), message: 'Synchronization and review actions are append-only audit events.' });
  } catch (error) { results.push({ id: 'TEST_INSPECTION_LIFECYCLE', name: 'Inspection lifecycle', passed: false, message: error instanceof Error ? error.message : 'Inspection lifecycle failed.' }); }
  return { suite: 'Phase 12 Offline Field Inspections', total: results.length, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed).length, allPassed: results.length > 0 && results.every((result) => result.passed), duration_ms: Date.now() - started, results };
}
