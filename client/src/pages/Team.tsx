import { useState, useEffect } from 'react';
import { Mail, Phone, ShieldCheck, Target, Award, UserCheck, Plus, Edit2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { getInitials, formatCurrency } from '../utils/formatters';

export default function Team() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Representative',
    department: 'Sales',
    salesTarget: '300000',
    password: 'password123',
  });

  const fetchTeam = async () => {
    try {
      const res = await api.get('/team');
      setMembers(res.data.data || []);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const openAddModal = () => {
    setEditMember(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'Sales Representative',
      department: 'Sales',
      salesTarget: '300000',
      password: 'password123',
    });
    setModalOpen(true);
  };

  const openEditModal = (m: any) => {
    setEditMember(m);
    setForm({
      name: m.name,
      email: m.email,
      phone: m.phone || '',
      role: m.role,
      department: m.department || 'Sales',
      salesTarget: (m.salesTarget || 300000).toString(),
      password: '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and Email are required');
      return;
    }
    setSaving(true);
    try {
      if (editMember) {
        await api.put(`/team/${editMember._id}`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          department: form.department,
          salesTarget: Number(form.salesTarget),
        });
        toast.success('Team member profile updated');
      } else {
        await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password || 'password123',
          role: form.role,
          department: form.department,
          salesTarget: Number(form.salesTarget),
          phone: form.phone,
        });
        toast.success('New employee account created');
      }
      setModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Loading team members..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Arshith Boot Camp Staff & Mentors</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
              {members.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage advisor, mentor, instructor, and student support roles for Arshith Boot Camp
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          // Extract stats from backend aggregate object
          const stats = member.stats || {};
          const revenue = stats.revenue ?? member.revenue ?? 0;
          const leadCount = stats.leadCount ?? member.leadCount ?? 0;
          const dealCount = stats.dealCount ?? member.dealCount ?? 0;
          const target = member.salesTarget || 300000;
          const targetPct = Math.min(100, Math.round((revenue / target) * 100));

          return (
            <div key={member._id} className="card-hover p-6 flex flex-col justify-between bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{member.name}</h3>
                      <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{member.department || 'Sales Department'}</span>
                  </div>
                </div>

                {/* Quota Progress */}
                <div className="mt-5 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-brand-600" /> Enrollment Progress
                    </span>
                    <span className="text-slate-900">{targetPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        targetPct >= 70 ? 'bg-emerald-500' : targetPct >= 30 ? 'bg-brand-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${targetPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-semibold">
                    <span className="text-slate-900 font-bold">{formatCurrency(revenue)} Enrolled</span>
                    <span>Target: {formatCurrency(target)}</span>
                  </div>
                </div>
              </div>

              {/* Handled metrics row */}
              <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Learners Guided</span>
                  <p className="font-black text-slate-900 text-base mt-0.5">{leadCount}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Active Enrollments</span>
                  <p className="font-black text-slate-900 text-base mt-0.5">{dealCount}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMember ? `Edit ${editMember.name}` : 'Add New Team Member'}
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editMember ? 'Update Profile' : 'Create Account'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Rachel Green"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              placeholder="rachel@crmpro.com"
              required
            />
          </div>
          {!editMember && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="password123"
                required
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role / Permissions</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="select-field"
              >
                <option value="Sales Representative">Sales Representative</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="input-field"
                placeholder="Sales, Support, Executive"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
                placeholder="+91..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enrollment Target (₹)</label>
              <input
                type="number"
                value={form.salesTarget}
                onChange={(e) => setForm({ ...form, salesTarget: e.target.value })}
                className="input-field"
                placeholder="300000"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
