import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle2, MapPin } from 'lucide-react';

export function FieldInspectionsSummary({ projectId }: { projectId: string }) {
  const [inspections, setInspections] = useState<any[]>([]);
  useEffect(() => { fetch(`/api/projects/${projectId}/inspections`).then((response) => response.json()).then((result) => { if (result.success) setInspections(result.data); }); }, [projectId]);
  if (!inspections.length) return <div className="border border-dashed border-slate-300 rounded-2xl p-6 text-sm text-slate-500">No verified field inspections are publicly available for this project.</div>;
  return <div className="space-y-4">{inspections.map((inspection) => <article key={inspection.id} className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs uppercase tracking-wider text-emerald-700 font-bold">Verified field inspection</div><h3 className="font-black text-slate-900 mt-1">{new Date(inspection.inspection_date).toLocaleDateString('en-GH')} · {inspection.inspection_type}</h3></div><CheckCircle2 className="h-5 w-5 text-emerald-700" /></div><p className="text-sm text-slate-700 mt-3">{inspection.observations}</p><div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-4"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Observed progress: {inspection.observed_progress_percentage}%</span><span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" />{inspection.evidence_count} evidence item(s)</span></div></article>)}</div>;
}
