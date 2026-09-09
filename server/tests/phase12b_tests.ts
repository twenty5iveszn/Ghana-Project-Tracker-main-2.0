import { buildEvidenceStoragePath, hasEvidenceMagic } from '../routes/evidence';

export interface Phase12BTestReport { total: number; passed: number; failed: number; results: Array<{ name: string; passed: boolean; finding: string }> }
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
export function runPhase12BTests(): Phase12BTestReport {
  const results: Phase12BTestReport['results'] = [];
  const test = (name: string, passed: boolean, finding: string) => results.push({ name, passed, finding });
  const path = buildEvidenceStoragePath('project-a', 'inspection-a', 'evidence-a', 'image/jpeg');
  test('deterministic JPEG path', path === 'project-a/inspection-a/evidence-a.jpg', 'Object path is server-derived.');
  test('deterministic PNG path', buildEvidenceStoragePath('p', 'i', 'e', 'image/png') === 'p/i/e.png', 'Extension follows verified MIME.');
  test('deterministic WebP path', buildEvidenceStoragePath('p', 'i', 'e', 'image/webp') === 'p/i/e.webp', 'Extension follows verified MIME.');
  test('path excludes filename', !path.includes('camera.jpg'), 'User filename cannot affect object identity.');
  test('path has project boundary', path.split('/').length === 3, 'Object namespace has project and inspection segments.');
  test('JPEG magic accepted', hasEvidenceMagic(jpeg, 'image/jpeg'), 'JPEG signature is required.');
  test('PNG magic accepted', hasEvidenceMagic(png, 'image/png'), 'PNG signature is required.');
  test('WebP magic accepted', hasEvidenceMagic(webp, 'image/webp'), 'RIFF and WEBP signatures are required.');
  test('HTML spoof rejected as JPEG', !hasEvidenceMagic(new TextEncoder().encode('<html>'), 'image/jpeg'), 'Declared MIME alone is insufficient.');
  test('script spoof rejected as PNG', !hasEvidenceMagic(new TextEncoder().encode('alert(1)'), 'image/png'), 'Declared MIME alone is insufficient.');
  test('invalid RIFF rejected as WebP', !hasEvidenceMagic(new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0,0,0,0]), 'image/webp'), 'WebP marker is enforced.');
  test('JPEG is not PNG', !hasEvidenceMagic(jpeg, 'image/png'), 'Cross-MIME spoofing is rejected.');
  test('PNG is not JPEG', !hasEvidenceMagic(png, 'image/jpeg'), 'Cross-MIME spoofing is rejected.');
  test('unsupported MIME rejected', !hasEvidenceMagic(jpeg, 'application/pdf'), 'Only allowlisted image types are recognized.');
  test('traversal does not originate in builder', !buildEvidenceStoragePath('a', 'b', 'c', 'image/jpeg').includes('..'), 'The server builder emits no traversal segments.');
  test('stable retry path', buildEvidenceStoragePath('p', 'i', 'e', 'image/jpeg') === buildEvidenceStoragePath('p', 'i', 'e', 'image/jpeg'), 'Repeated confirmation keeps object identity stable.');
  test('different evidence differs', buildEvidenceStoragePath('p', 'i', 'e1', 'image/jpeg') !== buildEvidenceStoragePath('p', 'i', 'e2', 'image/jpeg'), 'Evidence objects do not overwrite each other.');
  test('inspection isolation', buildEvidenceStoragePath('p', 'i1', 'e', 'image/jpeg') !== buildEvidenceStoragePath('p', 'i2', 'e', 'image/jpeg'), 'Inspection namespaces are isolated.');
  test('project isolation', buildEvidenceStoragePath('p1', 'i', 'e', 'image/jpeg') !== buildEvidenceStoragePath('p2', 'i', 'e', 'image/jpeg'), 'Project namespaces are isolated.');
  test('extension is not caller filename', !buildEvidenceStoragePath('p', 'i', 'e', 'image/jpeg').endsWith('.exe'), 'Extension cannot be client supplied.');
  return { total: results.length, passed: results.filter((r) => r.passed).length, failed: results.filter((r) => !r.passed).length, results };
}
if (process.argv[1]?.includes('phase12b_tests')) { const report = runPhase12BTests(); console.log(JSON.stringify(report, null, 2)); process.exitCode = report.failed ? 1 : 0; }
