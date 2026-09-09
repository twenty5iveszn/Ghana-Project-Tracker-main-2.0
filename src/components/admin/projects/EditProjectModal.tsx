import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert } from '../../ui/alert';
import { X, FileEdit, Building2, Calendar, Coins, Lock, CheckCircle2 } from 'lucide-react';
import { Project, Contractor, ProjectStatus, VerificationStatus } from '../../../types/project';
import { updateProjectSchema } from '../../../lib/validation/project';

interface EditProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  project,
  onClose,
  onSuccess,
}) => {
  const { profile, role, canAccessProject } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [actualCompletionDate, setActualCompletionDate] = useState('');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('PLANNED');
  const [progressPercentage, setProgressPercentage] = useState('0');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('PENDING');

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!isOpen || !project) return;

    setTitle(project.title);
    setDescription(project.description);
    setCategoryId(project.category_id);
    setLocationName(project.location_name);
    setLatitude(project.latitude.toString());
    setLongitude(project.longitude.toString());
    setContractorId(project.contractor_id || '');
    setBudget(project.budget.toString());
    setStartDate(project.start_date || '');
    setExpectedCompletionDate(project.expected_completion_date || '');
    setActualCompletionDate(project.actual_completion_date || '');
    setProjectStatus(project.project_status);
    setProgressPercentage(project.progress_percentage.toString());
    setVerificationStatus(project.verification_status);

    fetch('/api/geography/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      });

    fetch('/api/contractors')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setContractors(d.data);
      });
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const hasJurisdiction = canAccessProject(project.region_id, project.district_id);
  const canVerify = role === 'SUPER_ADMIN' || role === 'NATIONAL_MONITOR' || role === 'MODERATOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const parsedBudget = Number(budget);
    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);
    const parsedProgress = Number(progressPercentage);

    const updates = {
      title,
      description,
      category_id: categoryId,
      location_name: locationName,
      latitude: parsedLat,
      longitude: parsedLng,
      contractor_id: contractorId || null,
      budget: parsedBudget,
      start_date: startDate || null,
      expected_completion_date: expectedCompletionDate || null,
      actual_completion_date: actualCompletionDate || null,
      project_status: projectStatus,
      progress_percentage: parsedProgress,
      verification_status: canVerify ? verificationStatus : undefined,
    };

    const valResult = updateProjectSchema.safeParse(updates);
    if (!valResult.success) {
      setFieldErrors(valResult.error.flatten().fieldErrors);
      setErrorMsg('Some updated values are invalid. Please check the fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to update project');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Update error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Edit Infrastructure Project</h2>
                <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300">
                  {project.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-md">{project.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <Alert variant="error" title="Update Prohibited">
              {errorMsg}
            </Alert>
          )}

          {!hasJurisdiction && (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs flex items-center gap-2 text-rose-900">
              <Lock className="h-4 w-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">JBAC Restriction: </span>
                This project is located in {project.district?.name || project.district_id}, outside your
                assigned jurisdiction. Submitting changes will be rejected by the server.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Scope
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contractor</label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">-- Unassigned --</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Budget (GH₵)</label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location Name</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={projectStatus}
                onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="PLANNED">PLANNED</option>
                <option value="ONGOING">ONGOING</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ABANDONED">ABANDONED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Physical Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            {canVerify ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verification Status (Admin)
                </label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50/50"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verification Status
                </label>
                <div className="text-xs py-2 px-2.5 bg-slate-100 rounded-lg text-slate-600 font-medium">
                  {project.verification_status} (Requires Admin to modify)
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Date</label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Actual Date</label>
              <input
                type="date"
                value={actualCompletionDate}
                onChange={(e) => setActualCompletionDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !hasJurisdiction}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {submitting ? 'Saving Changes...' : 'Save & Record Audit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
