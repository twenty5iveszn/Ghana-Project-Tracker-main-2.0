import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert } from '../../ui/alert';
import {
  X,
  Plus,
  Building2,
  Search,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileEdit,
  CheckCircle2,
} from 'lucide-react';
import { Contractor } from '../../../types/project';
import { createContractorSchema } from '../../../lib/validation/project';

interface ContractorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContractorCreated?: (contractor: Contractor) => void;
}

export const ContractorManagementModal: React.FC<ContractorManagementModalProps> = ({
  isOpen,
  onClose,
  onContractorCreated,
}) => {
  const { role } = useAuth();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [regNum, setRegNum] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/contractors${q}`);
      const data = await res.json();
      if (data.success) {
        setContractors(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContractors();
    }
  }, [isOpen, search]);

  if (!isOpen) return null;

  const canManage = role === 'SUPER_ADMIN' || role === 'REGIONAL_OFFICER' || role === 'MMDCE_OFFICER';

  const resetForm = () => {
    setName('');
    setRegNum('');
    setEmail('');
    setPhone('');
    setAddress('');
    setWebsite('');
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleEditClick = (c: Contractor) => {
    setName(c.name);
    setRegNum(c.registration_number || '');
    setEmail(c.contact_email || '');
    setPhone(c.contact_phone || '');
    setAddress(c.address || '');
    setWebsite(c.website || '');
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name,
      registration_number: regNum || null,
      contact_email: email || null,
      contact_phone: phone || null,
      address: address || null,
      website: website || null,
    };

    const val = createContractorSchema.safeParse(payload);
    if (!val.success) {
      setFormError('Invalid contractor details. Please check email or website formatting.');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/contractors/${editingId}` : '/api/contractors';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to save contractor');
      }

      if (onContractorCreated && !editingId) {
        onContractorCreated(data.data);
      }

      resetForm();
      fetchContractors();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving contractor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">GhanaBuild Contractor Registry</h2>
              <p className="text-xs text-slate-300">
                Normalized registry of certified civil, electrical, and structural contractors
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

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contractors..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs gap-1.5 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {showForm ? 'Cancel Entry' : 'Register New Contractor'}
            </Button>
          )}
        </div>

        {/* Form Drawer (if open) */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="p-5 bg-emerald-50/50 border-b border-emerald-200 space-y-3 text-xs"
          >
            <div className="font-bold text-emerald-950 flex items-center justify-between">
              <span>{editingId ? 'Edit Contractor Details' : 'Register New Certified Contractor'}</span>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contractor Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Consar Limited Ghana"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Registrar-General Reg Number
                </label>
                <input
                  type="text"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  placeholder="e.g. CS-GH-2012-0044"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contracts@firm.com"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 30 200 0000"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://firm.com"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Office Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. No. 14 Graphic Road, South Industrial Area, Accra"
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Contractor' : 'Register Contractor'}
              </Button>
            </div>
          </form>
        )}

        {/* Contractors List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading contractors...</div>
          ) : contractors.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              No contractors match your search query.
            </div>
          ) : (
            contractors.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                    {c.registration_number && (
                      <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {c.registration_number}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                    {c.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {c.address}
                      </span>
                    )}
                    {c.contact_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {c.contact_phone}
                      </span>
                    )}
                    {c.contact_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {c.contact_email}
                      </span>
                    )}
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-emerald-700 hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>

                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(c)}
                    className="text-xs shrink-0 gap-1"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>{contractors.length} contractors registered</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
