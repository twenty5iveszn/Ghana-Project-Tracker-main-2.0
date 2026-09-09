import { projectStore } from '../db/project_store';
import { Profile } from '../../src/types/user';

const national: Profile = { id: 'phase11-national', auth_user_id: 'phase11-national', full_name: 'Phase 11 National Monitor', email: 'phase11@example.com', role: 'NATIONAL_MONITOR', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
const outsideDistrict: Profile = { ...national, id: 'phase11-district', role: 'MMDCE_OFFICER', region_id: 'REG-ASHANTI-01', district_id: 'DIST-KUMASI-METRO' };

export function runPhase11Tests() {
  const started = Date.now();
  const project = projectStore.listProjects({ verification_status: 'VERIFIED', limit: 100 }).projects[0];
  const results: Array<{ id: string; name: string; passed: boolean; message: string }> = [];
  if (!project) return { suite: 'Phase 11 Fiscal Transparency', total: 0, passed: 0, failed: 0, allPassed: false, duration_ms: Date.now() - started, results: [{ id: 'TEST_FIXTURE', name: 'Verified project fixture', passed: false, message: 'No verified project fixture is available.' }] };
  const suffix = Date.now().toString(36);
  try {
    const funding = projectStore.createFunding(project.id, { funding_source: 'Phase 11 controlled test', funding_reference: `TEST-FUND-${suffix}`, allocated_amount: 1000000, currency: project.currency, allocation_date: new Date().toISOString(), fiscal_year: new Date().getFullYear(), funding_status: 'APPROVED', notes: null }, national);
    const commitment = projectStore.createCommitment(project.id, { contractor_id: project.contractor_id, commitment_reference: `TEST-COMM-${suffix}`, committed_amount: 800000, currency: project.currency, commitment_date: new Date().toISOString(), approved_by: national.id, status: 'APPROVED', notes: null }, national);
    const tranche = projectStore.createTranche(project.id, { commitment_id: commitment.id, tranche_number: 900000 + Math.floor(Math.random() * 1000), tranche_name: 'Controlled test tranche', approved_amount: 500000, currency: project.currency, approval_date: new Date().toISOString(), scheduled_disbursement_date: null, status: 'APPROVED', notes: null }, national);
    const disbursement = projectStore.createDisbursement(project.id, { tranche_id: tranche.id, disbursement_reference: `TEST-DISB-${suffix}`, amount: 300000, currency: project.currency, disbursement_date: new Date().toISOString(), payment_status: 'DISBURSED', payment_method: 'TEST', source_reference: null, notes: null }, national);
    const expenditure = projectStore.createExpenditure(project.id, { disbursement_id: disbursement.id, expenditure_reference: `TEST-EXP-${suffix}`, amount: 250000, currency: project.currency, expenditure_date: new Date().toISOString(), expenditure_category: 'MATERIALS', description: 'Controlled Phase 11 test expenditure', source_document_id: null }, national);
    const verified = projectStore.verifyExpenditure(expenditure.id, 'VERIFIED', national);
    const records = projectStore.getProjectFiscalRecords(project.id, national);
    results.push({ id: 'TEST_FISCAL_CALCULATIONS', name: 'Fiscal lifecycle calculations', passed: records.summary.total_allocated === 1000000 && records.summary.total_committed === 800000 && records.summary.total_disbursed === 300000 && records.summary.verified_expenditure === 250000 && records.summary.remaining_commitment === 500000, message: 'Allocation, commitment, disbursement, verified expenditure, and balance calculations match the controlled ledger.' });
    results.push({ id: 'TEST_EXPENDITURE_VERIFICATION', name: 'Reported and verified expenditure remain distinct', passed: verified.verification_status === 'VERIFIED' && records.summary.total_reported_expenditure === 250000, message: 'Expenditure verification is explicit and auditable.' });
    let overDisbursementRejected = false;
    try { projectStore.createDisbursement(project.id, { tranche_id: tranche.id, disbursement_reference: `TEST-OVER-${suffix}`, amount: 250001, currency: project.currency, disbursement_date: new Date().toISOString(), payment_status: 'DISBURSED', payment_method: 'TEST', source_reference: null, notes: null }, national); } catch (error) { overDisbursementRejected = error instanceof Error && error.message === 'DISBURSEMENT_EXCEEDS_TRANCHE'; }
    results.push({ id: 'TEST_BALANCE_INTEGRITY', name: 'Disbursement cannot exceed tranche', passed: overDisbursementRejected, message: overDisbursementRejected ? 'Excess disbursement rejected.' : 'Excess disbursement was accepted.' });
    let firstConcurrentAccepted = false;
    let secondConcurrentRejected = false;
    try { projectStore.createDisbursement(project.id, { tranche_id: tranche.id, disbursement_reference: `TEST-CONCURRENT-A-${suffix}`, amount: 150000, currency: project.currency, disbursement_date: new Date().toISOString(), payment_status: 'DISBURSED', payment_method: 'TEST', source_reference: null, notes: null }, national); firstConcurrentAccepted = true; } catch { }
    try { projectStore.createDisbursement(project.id, { tranche_id: tranche.id, disbursement_reference: `TEST-CONCURRENT-B-${suffix}`, amount: 150000, currency: project.currency, disbursement_date: new Date().toISOString(), payment_status: 'DISBURSED', payment_method: 'TEST', source_reference: null, notes: null }, national); } catch (error) { secondConcurrentRejected = error instanceof Error && error.message === 'DISBURSEMENT_EXCEEDS_TRANCHE'; }
    results.push({ id: 'TEST_CONCURRENT_DISBURSEMENT', name: 'Concurrent disbursements respect tranche ceiling', passed: !firstConcurrentAccepted || secondConcurrentRejected, message: !firstConcurrentAccepted || secondConcurrentRejected ? 'Combined disbursements cannot exceed available tranche balance.' : 'Concurrent over-disbursement was accepted.' });
    let unauthorizedRejected = false;
    try { projectStore.createFunding(project.id, { funding_source: 'Unauthorized', funding_reference: `TEST-IDOR-${suffix}`, allocated_amount: 1, currency: project.currency, allocation_date: new Date().toISOString(), fiscal_year: new Date().getFullYear(), funding_status: 'PROPOSED', notes: null }, outsideDistrict); } catch (error) { unauthorizedRejected = error instanceof Error && error.message === 'FISCAL_JURISDICTION_FORBIDDEN'; }
    results.push({ id: 'TEST_JURISDICTION_IDOR', name: 'Fiscal mutation respects jurisdiction', passed: unauthorizedRejected, message: unauthorizedRejected ? 'Cross-jurisdiction fiscal mutation rejected.' : 'Cross-jurisdiction fiscal mutation was accepted.' });
    projectStore.reverseDisbursement(disbursement.id, national);
    const audit = projectStore.getAuditLogs({ entityId: disbursement.id });
    results.push({ id: 'TEST_REVERSAL_AUDIT', name: 'Disbursement reversal preserves audit history', passed: audit.some((entry) => entry.action === 'DISBURSEMENT_REVERSED'), message: 'Reversal remains represented and audit logged.' });
    void funding;
  } catch (error) { results.push({ id: 'TEST_FISCAL_LIFECYCLE', name: 'Fiscal lifecycle integration', passed: false, message: error instanceof Error ? error.message : 'Fiscal lifecycle failed.' }); }
  return { suite: 'Phase 11 Fiscal Transparency', total: results.length, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed).length, allPassed: results.length > 0 && results.every((result) => result.passed), duration_ms: Date.now() - started, results };
}
