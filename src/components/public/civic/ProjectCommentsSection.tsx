import React, { useState, useEffect } from 'react';
import { ProjectComment } from '../../../types/project';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  MessageSquare,
  Send,
  Shield,
  Trash2,
  Flag,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface ProjectCommentsSectionProps {
  projectId: string;
}

export const ProjectCommentsSection: React.FC<ProjectCommentsSectionProps> = ({ projectId }) => {
  const { user, profile, role, token } = useAuth();
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isModerator =
    role && ['SUPER_ADMIN', 'NATIONAL_MONITOR', 'MODERATOR', 'REGIONAL_OFFICER', 'MMDCE_OFFICER'].includes(role);

  const fetchComments = () => {
    setLoading(true);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/projects/${projectId}/comments`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComments(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComments();
  }, [projectId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in to post a community comment.');
      return;
    }

    if (content.trim().length < 3) {
      setErrorMsg('Comment must be at least 3 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit comment');
      }

      setContent('');
      if (data.data.status === 'FLAGGED') {
        setSuccessMsg('Your comment was submitted and flagged for automated civility review before display.');
      } else {
        setSuccessMsg('Your comment was published to the community forum.');
      }
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchComments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModerate = async (commentId: string, action: 'PUBLISH' | 'FLAG' | 'REMOVE') => {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to remove this comment?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'NATIONAL_MONITOR':
        return <Badge className="bg-purple-100 text-purple-900 border-purple-200 text-[10px]">National Monitor</Badge>;
      case 'REGIONAL_OFFICER':
        return <Badge className="bg-blue-100 text-blue-900 border-blue-200 text-[10px]">Regional RCC Officer</Badge>;
      case 'MMDCE_OFFICER':
        return <Badge className="bg-indigo-100 text-indigo-900 border-indigo-200 text-[10px]">MMDA Municipal Officer</Badge>;
      case 'COMMUNITY_OBSERVER':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px]">Civil Society Observer</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">Verified Citizen</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            Civic Discussion & Community Perspectives
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Public feedback, site testimonials, and direct engagement with project authorities.
          </p>
        </div>
      </div>

      {/* Post comment form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {user ? `Share observation as ${profile?.full_name || user.email}` : 'Join Civic Discussion'}
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              user
                ? 'Share constructive feedback regarding road safety, construction progress, or site conditions...'
                : 'Please sign in to post a community comment on this project.'
            }
            disabled={!user || submitting}
            maxLength={1000}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400">
            {content.length}/1000 characters • Civility guidelines strictly enforced
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={!user || submitting || content.trim().length < 3}
              variant="primary"
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Publishing...' : 'Post Civic Comment'}
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
        ) : comments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
            No comments posted yet. Be the first citizen to start the community discussion!
          </div>
        ) : (
          comments.map((comment) => {
            const canDelete =
              user && (user.id === comment.user_id || ['SUPER_ADMIN', 'MODERATOR'].includes(user.role));

            return (
              <div
                key={comment.id}
                className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900">{comment.user_name}</span>
                    {formatRoleBadge(comment.user_role)}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(comment.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {comment.status === 'FLAGGED' && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                        Under Moderation
                      </span>
                    )}

                    {isModerator && comment.status === 'FLAGGED' && (
                      <button
                        onClick={() => handleModerate(comment.id, 'PUBLISH')}
                        title="Approve comment"
                        className="p-1 rounded-md hover:bg-emerald-50 text-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {isModerator && comment.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleModerate(comment.id, 'FLAG')}
                        title="Flag comment"
                        className="p-1 rounded-md hover:bg-amber-50 text-amber-700"
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        title="Delete comment"
                        className="p-1 rounded-md hover:bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
