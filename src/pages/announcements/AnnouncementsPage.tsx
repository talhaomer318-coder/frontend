import React, { useState } from 'react';
import { Megaphone, Plus, Bell, Shield, User, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocalStore } from '../../services/api';
import { Announcement } from '../../types';

export const AnnouncementsPage: React.FC = () => {
  const { role, user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => LocalStore.getAnnouncements());
  const [showPostModal, setShowPostModal] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'admin' | 'hr' | 'employee'>('all');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const created = LocalStore.addAnnouncement({
      title,
      content,
      targetRole,
      priority,
      authorName: user?.name || 'Administrator',
      authorRole: role.toUpperCase(),
    });

    LocalStore.recordAudit({
      actorId: user?.id || 'admin',
      actorName: user?.name || 'Administrator',
      actorRole: role,
      action: 'CREATE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: created.id,
      details: `Broadcasted announcement '${title}' to audience '${targetRole}'`,
    });

    setAnnouncements(LocalStore.getAnnouncements());
    setShowPostModal(false);
    setTitle('');
    setContent('');
  };

  const priorityBadges: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600 border-slate-200',
    normal: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Organization Announcements</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast official notices, hackathon directives, and HR policy updates to scoped roles.
          </p>
        </div>

        {role !== 'employee' && (
          <button
            onClick={() => setShowPostModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map(ann => (
          <div
            key={ann.id}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${priorityBadges[ann.priority]}`}>
                  {ann.priority} Priority
                </span>
                <span className="text-xs font-bold text-slate-400 capitalize">
                  Target: {ann.targetRole === 'all' ? 'Entire Organization' : `${ann.targetRole} Only`}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{ann.createdAt}</span>
            </div>

            <h2 className="text-base font-extrabold text-slate-900">{ann.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-600">
                Posted by {ann.authorName} ({ann.authorRole})
              </span>
              <span className="flex items-center space-x-1 text-emerald-600 font-semibold text-[11px]">
                <Bell className="w-3.5 h-3.5" />
                <span>Delivered to Inboxes</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Create New Announcement</h3>
            <form onSubmit={handlePost} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Saylani Hackathon Schedule..."
                  className="w-full px-3 py-2 border rounded-lg font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">Entire Company</option>
                    <option value="employee">Employees Only</option>
                    <option value="hr">HR Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Announcement Body</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Type official communication..."
                  className="w-full px-3 py-2 border rounded-lg h-28"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
