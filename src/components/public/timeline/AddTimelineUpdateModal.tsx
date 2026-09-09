import React, { useState } from 'react';
import { ProjectStatus } from '../../../types/project';
import { Button } from '../../ui/button';
import {
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';

interface AddTimelineUpdateModalProps {
  isOpen: boolean;
  projectId: string;
  projectTitle: string;
  currentProgress: number;
  currentStatus: ProjectStatus;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTimelineUpdateModal: React.FC<AddTimelineUpdateModalProps> = ({
  isOpen,
  projectId,
  projectTitle,
  currentProgress,
  currentStatus,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(
    Math.min(100, currentProgress + 10)
  );
  const [status, setStatus] = useState<ProjectStatus>(currentStatus);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError('Milestone title is required.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a descriptive milestone update (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          progress_percentage: Number(progressPercentage),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to post milestone update');
      }

      setSuccessMessage('Official milestone update recorded successfully.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-700" />
              Add Official Milestone Update
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{projectTitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Milestone Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sub-base compaction completed & culvert headwalls erected"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Updated Progress Percentage: <span className="text-emerald-700 font-mono">{progressPercentage}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0%</span>
                <span>Current: {currentProgress}%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="PLANNED">Planned</option>
                <option value="ONGOING">Ongoing</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed & Handed Over</option>
                <option value="ABANDONED">Abandoned</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Technical Description & Field Work Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detail concrete pouring benchmarks, structural inspections, contractor equipment mobilized, challenges..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-bold"
            >
              <TrendingUp className="h-4 w-4" />
              {submitting ? 'Recording...' : 'Publish Milestone'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
