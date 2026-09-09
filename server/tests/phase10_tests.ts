import { projectStore } from '../db/project_store';
import { Profile } from '../../src/types/user';

const national: Profile = { id: 'phase10-national', auth_user_id: 'phase10-national', full_name: 'National Test Monitor', email: 'phase10@example.com', role: 'NATIONAL_MONITOR', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
const regional: Profile = { ...national, id: 'phase10-regional', role: 'REGIONAL_OFFICER', region_id: 'REG-ASHANTI-01' };
const district: Profile = { ...national, id: 'phase10-district', role: 'MMDCE_OFFICER', region_id: 'REG-GAR-01', district_id: 'DIST-ACCRA-METRO' };

export function runPhase10Tests() {
  const started = Date.now();
  const results = [
    (() => {
      const contractor = projectStore.listContractors()[0];
      const result = contractor ? projectStore.getContractorAccountability(contractor.id) : null;
      const passed = Boolean(result && result.scorecard.metrics.total_projects === result.projects.length && result.scorecard.overall_score !== undefined);
      return { id: 'TEST_SCORECARD_AGGREGATION', name: 'Scorecard uses associated project data', passed, message: passed ? 'Project counts and scorecard are calculated from the store.' : 'Scorecard aggregation mismatch.' };
    })(),
    (() => {
      const contractor = projectStore.listContractors()[0];
      const result = contractor ? projectStore.getContractorAccountability(contractor.id) : null;
      const passed = Boolean(result && result.scorecard.metrics.total_projects > 0 && result.scorecard.confidence_description.includes('projects'));
      return { id: 'TEST_DATA_SUFFICIENCY', name: 'Scorecard reports sample size and confidence', passed, message: passed ? 'Sample size and confidence are visible.' : 'Data sufficiency information missing.' };
    })(),
    (() => {
      const contractor = projectStore.listContractors()[0];
      const publicResult = contractor ? projectStore.getContractorAccountability(contractor.id) : null;
      const regionalResult = contractor ? projectStore.getContractorAccountability(contractor.id, { actor: regional, publicOnly: false }) : null;
      const districtResult = contractor ? projectStore.getContractorAccountability(contractor.id, { actor: district, publicOnly: false }) : null;
      const nationalResult = contractor ? projectStore.getContractorAccountability(contractor.id, { actor: national, publicOnly: false }) : null;
      const passed = Boolean(publicResult && regionalResult && districtResult && nationalResult && regionalResult.projects.length <= nationalResult.projects.length && districtResult.projects.length <= nationalResult.projects.length);
      return { id: 'TEST_JURISDICTION_SCOPE', name: 'Contractor analytics respects jurisdiction', passed, message: passed ? 'Regional and district scopes cannot expand beyond national scope.' : 'Jurisdiction scope widened unexpectedly.' };
    })(),
    (() => {
      const contractor = projectStore.listContractors()[0];
      const result = contractor ? projectStore.getContractorAccountability(contractor.id) : null;
      const passed = Boolean(result && result.scorecard.methodology.disclaimer.includes('not an official') && Object.values(result.scorecard.pillars).every((pillar) => pillar.weighted_score >= 0));
      return { id: 'TEST_TRANSPARENT_METHODOLOGY', name: 'Indicator methodology is explicit', passed, message: passed ? 'Disclaimer and normalized pillar contributions are present.' : 'Methodology transparency failed.' };
    })(),
  ];
  return { suite: 'Phase 10 Contractor Accountability', total: results.length, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed).length, allPassed: results.every((result) => result.passed), duration_ms: Date.now() - started, results };
}
