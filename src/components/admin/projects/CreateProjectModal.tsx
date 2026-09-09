import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert } from '../../ui/alert';
import {
  X,
  Plus,
  MapPin,
  Building2,
  Calendar,
  Coins,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import { RegionData, DistrictData, CommunityData } from '../../../types/geography';
import { Contractor, ProjectStatus } from '../../../types/project';
import { createProjectSchema } from '../../../lib/validation/project';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenContractorModal?: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenContractorModal,
}) => {
  const { profile, role } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('CAT-ROADS');
  const [regionId, setRegionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('5.6037');
  const [longitude, setLongitude] = useState('-0.1870');
  const [contractorId, setContractorId] = useState('');
  const [budget, setBudget] = useState('10000000');
  const [currency, setCurrency] = useState('GHS');
  const [startDate, setStartDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('PLANNED');
  const [progressPercentage, setProgressPercentage] = useState('0');

  // Metadata dropdowns state
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Initial load of regions, categories, contractors
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/geography/regions')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRegions(d.data);
      });

    fetch('/api/geography/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      });

    fetch('/api/contractors')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setContractors(d.data);
          if (d.data.length > 0 && !contractorId) {
            setContractorId(d.data[0].id);
          }
        }
      });

    // Auto-set jurisdiction defaults based on authenticated officer profile
    if (role === 'MMDCE_OFFICER' && profile?.district_id) {
      setDistrictId(profile.district_id);
      if (profile.region_id) setRegionId(profile.region_id);
    } else if (role === 'REGIONAL_OFFICER' && profile?.region_id) {
      setRegionId(profile.region_id);
    } else if (!regionId) {
      setRegionId('REG-GAR-01');
    }
  }, [isOpen, role, profile]);

  // When region changes, load dependent districts
  useEffect(() => {
    if (!regionId) return;

    fetch(`/api/geography/districts?region_id=${regionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setDistricts(d.data);
          // If MMDCE officer, preserve their district; else select first
          if (role === 'MMDCE_OFFICER' && profile?.district_id) {
            setDistrictId(profile.district_id);
          } else if (d.data.length > 0 && !d.data.some((dist: DistrictData) => dist.id === districtId)) {
            setDistrictId(d.data[0].id);
          }
        }
      });
  }, [regionId]);

  // When district changes, load dependent communities
  useEffect(() => {
    if (!districtId) return;

    fetch(`/api/geography/communities?district_id=${districtId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCommunities(d.data);
          if (d.data.length > 0) {
            setCommunityId(d.data[0].id);
          } else {
            setCommunityId('');
          }
        }
      });
  }, [districtId]);

  if (!isOpen) return null;

  const isMmdceLocked = role === 'MMDCE_OFFICER' && Boolean(profile?.district_id);
  const isRegionalLocked = role === 'REGIONAL_OFFICER' && Boolean(profile?.region_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const parsedBudget = Number(budget);
    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);
    const parsedProgress = Number(progressPercentage);

    const payload = {
      title,
      description,
      category_id: categoryId,
      region_id: regionId,
      district_id: districtId,
      community_id: communityId || null,
      location_name: locationName,
      latitude: parsedLat,
      longitude: parsedLng,
      contractor_id: contractorId || null,
      budget: parsedBudget,
      currency,
      start_date: startDate || null,
      expected_completion_date: expectedCompletionDate || null,
      project_status: projectStatus,
      progress_percentage: parsedProgress,
    };

    // Client-side schema check
    const valResult = createProjectSchema.safeParse(payload);
    if (!valResult.success) {
      setFieldErrors(valResult.error.flatten().fieldErrors);
      setErrorMsg('Please review the form. Some required values are invalid.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data?.error?.details) {
          setFieldErrors(data.error.details);
        }
        throw new Error(data?.error?.message || 'Failed to register project');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Server error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Register Public Infrastructure Project</h2>
              <p className="text-xs text-slate-300">
                Official registration for monitoring, budgeting, and civic transparency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <Alert variant="error" title="Registration Error">
              {errorMsg}
            </Alert>
          )}

          {/* Officer Jurisdiction Banner */}
          {(isMmdceLocked || isRegionalLocked) && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-center gap-2 text-amber-900">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Jurisdiction-Enforced Form: </span>
                {isMmdceLocked
                  ? `Your account is assigned to district ${profile?.district_id}. Cross-district registration is prevented by server-side JBAC.`
                  : `Your account is assigned to region ${profile?.region_id}. Cross-regional registration is prevented.`}
              </div>
            </div>
          )}

          {/* SECTION 1: Core Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              1. Project Identification
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Accra Outer Ring Road Dualization & Asphalt Overlay"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              {fieldErrors.title && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.title[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Scope of Works <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed technical description of engineering works, target deliverables, and community impact..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              {fieldErrors.description && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.description[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sector / Infrastructure Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 2: Geographic Hierarchy */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              2. Geographic Jurisdiction & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Region <span className="text-rose-500">*</span>
                </label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  disabled={isRegionalLocked || isMmdceLocked}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  District Assembly (MMDCE) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  disabled={isMmdceLocked}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local Community
                </label>
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- No specific community --</option>
                  {communities.map((comm) => (
                    <option key={comm.id} value={comm.id}>
                      {comm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Site Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Graphic Road / Adabraka Market Link"
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Latitude (-90 to 90) <span className="text-rose-500">*</span>
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Longitude (-180 to 180) <span className="text-rose-500">*</span>
                </label>
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
          </div>

          {/* SECTION 3: Contractor & Financial Budget */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-slate-400" />
                3. Financials & Contractor Assignment
              </span>
              {onOpenContractorModal && (
                <button
                  type="button"
                  onClick={onOpenContractorModal}
                  className="text-xs text-emerald-700 font-semibold hover:underline"
                >
                  + Add New Contractor
                </button>
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contractor Organization
                </label>
                <select
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Unassigned / Tender Stage --</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.registration_number || 'Registered'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Approved Budget (GHS) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">GH₵</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full text-xs pl-11 pr-3 py-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                {fieldErrors.budget && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.budget[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: Schedule & Progress */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              4. Execution Schedule & Milestone Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Commencement Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Delivery / Completion Date
                </label>
                <input
                  type="date"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Project Status
                </label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="PLANNED">PLANNED (Pre-construction / Mobilization)</option>
                  <option value="ONGOING">ONGOING (Active Site Execution)</option>
                  <option value="ON_HOLD">ON_HOLD (Temporarily Suspended)</option>
                  <option value="COMPLETED">COMPLETED (Handed Over / Commissioned)</option>
                  <option value="ABANDONED">ABANDONED (Halted without contractor)</option>
                  <option value="CANCELLED">CANCELLED (Contract Terminated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Verified Physical Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                />
                {fieldErrors.progress_percentage && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.progress_percentage[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
            >
              {submitting ? 'Registering...' : 'Register Project & Audit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
