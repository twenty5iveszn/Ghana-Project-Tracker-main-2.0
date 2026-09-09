import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Flame, Check } from 'lucide-react';
import { ProjectVoteSummary, VoteType } from '../../../types/project';
import { useAuth } from '../../../lib/auth/AuthContext';

interface CivicVotingWidgetProps {
  projectId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CivicVotingWidget: React.FC<CivicVotingWidgetProps> = ({
  projectId,
  className = '',
  size = 'md',
}) => {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<ProjectVoteSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [votingAction, setVotingAction] = useState<VoteType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchVotes = () => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/projects/${projectId}/votes`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchVotes();
  }, [projectId, token]);

  const handleVote = async (type: VoteType) => {
    if (!user) {
      setErrorMsg('Please sign in as a citizen or officer to cast a community priority vote.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setVotingAction(type);
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote_type: type }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to record vote');
      }

      setSummary(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording vote');
    } finally {
      setLoading(false);
      setVotingAction(null);
    }
  };

  const isUpvoted = summary?.user_vote === 'UPVOTE';
  const isDownvoted = summary?.user_vote === 'DOWNVOTE';

  const isCompact = size === 'sm';

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Upvote button */}
        <button
          onClick={() => handleVote('UPVOTE')}
          disabled={loading}
          aria-label="Prioritize this project"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all shadow-sm ${
            isUpvoted
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${isUpvoted ? 'text-white fill-white' : 'text-slate-500'}`} />
          <span>Priority Upvote</span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              isUpvoted ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {summary ? summary.upvotes : '...'}
          </span>
        </button>

        {/* Downvote / Concern button */}
        <button
          onClick={() => handleVote('DOWNVOTE')}
          disabled={loading}
          aria-label="Express concern or deprioritize"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all shadow-sm ${
            isDownvoted
              ? 'bg-rose-600 text-white border-rose-700 shadow-rose-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <ThumbsDown className={`h-3.5 w-3.5 ${isDownvoted ? 'text-white fill-white' : 'text-slate-500'}`} />
          <span>Deprioritize</span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              isDownvoted ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {summary ? summary.downvotes : '...'}
          </span>
        </button>

        {/* Civic Priority Score Badge */}
        {summary && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <Flame className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
            <span>Civic Urgency:</span>
            <span className="font-mono font-black text-amber-950">{summary.priority_score}/100</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-[11px] font-medium text-rose-600 animate-fadeIn">{errorMsg}</p>
      )}
    </div>
  );
};
