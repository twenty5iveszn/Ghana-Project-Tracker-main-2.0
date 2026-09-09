import React, { useState, useEffect } from 'react';
import { Project } from '../../../types/project';
import { ProjectCard } from '../ProjectCard';
import { Layers } from 'lucide-react';

interface RelatedProjectsSectionProps {
  projectId: string;
  onNavigate: (path: string) => void;
}

export const RelatedProjectsSection: React.FC<RelatedProjectsSectionProps> = ({
  projectId,
  onNavigate,
}) => {
  const [related, setRelated] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/related?limit=3`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch related projects');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setRelated(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading || related.length === 0) return null;

  return (
    <div className="space-y-4 pt-6 border-t border-slate-200">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-700" />
          Related Verified Projects in this Jurisdiction & Sector
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Other gazetted infrastructure developments sharing regional proximity or sector objectives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {related.map((project) => (
          <ProjectCard key={project.id} project={project} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};
