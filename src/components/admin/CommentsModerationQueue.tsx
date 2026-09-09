import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Flag,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const CommentsModerationQueue: React.FC = () => {
  const { profile, token } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchComments = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/admin/comments?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setComments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load comments queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [statusFilter, profile?.region_id, profile?.district_id]);

  const handleModerate = async (projectId: string, commentId: string, action: 'PUBLISHED' | 'FLAGGED' | 'REMOVED', reason?: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, reason }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, status: action } : c))
        );
      }
    } catch (err) {
      console.error('Failed to moderate comment:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Civic Comments & Discussion Moderation
            </h1>
            <Badge className="bg-amber-700 text-white font-mono text-xs">
              {comments.length} COMMENTS
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Enforce community civic standards, review flagged messages, and prevent inappropriate content.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchComments}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Discussions' },
            { id: 'FLAGGED', label: 'Flagged by Community' },
            { id: 'PUBLISHED', label: 'Published' },
            { id: 'REMOVED', label: 'Removed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchComments()}
              placeholder="Search comments by user, text, or project..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
            />
          </div>
          <Button size="sm" onClick={fetchComments} className="bg-slate-900 hover:bg-slate-800 text-xs">
            Filter
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
            Loading comments queue...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-white rounded-xl border border-slate-200">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No comments found</div>
            <p className="text-xs text-slate-500">No comments match the active filter criteria.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {comment.user_name || 'Community Citizen'}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">
                        {comment.user_role || 'CITIZEN'}
                      </Badge>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-xs text-slate-600 font-medium">
                        on <strong className="text-slate-800">{comment.project_title || 'Project'}</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      "{comment.content}"
                    </p>

                    <div className="text-[11px] text-slate-400">
                      Posted: {formatDate(comment.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold px-2.5 py-1 ${
                        comment.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : comment.status === 'FLAGGED'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-rose-50 text-rose-900 border-rose-300'
                      }`}
                    >
                      {comment.status}
                    </Badge>

                    {comment.status !== 'PUBLISHED' && (
                      <Button
                        size="sm"
                        onClick={() => handleModerate(comment.project_id, comment.id, 'PUBLISHED')}
                        className="text-xs h-7 px-2.5 bg-emerald-800 hover:bg-emerald-700 text-white"
                      >
                        Publish
                      </Button>
                    )}

                    {comment.status !== 'FLAGGED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModerate(comment.project_id, comment.id, 'FLAGGED')}
                        className="text-xs h-7 px-2 text-amber-700 hover:bg-amber-50"
                      >
                        Flag
                      </Button>
                    )}

                    {comment.status !== 'REMOVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModerate(comment.project_id, comment.id, 'REMOVED', 'Violates community guidelines')}
                        className="text-xs h-7 px-2 text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
