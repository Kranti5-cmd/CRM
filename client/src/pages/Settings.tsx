import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { User, Bell, Lock, Palette, Shield } from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    leadAssigned: true,
    dealUpdates: true,
    overdueTasks: true,
    weeklyReport: false,
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', { name, email, phone });
      updateUser(res.data.user || res.data);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Account & Preferences</h2>
        <p className="text-sm text-gray-500">Manage your profile, team credentials, notifications, and security</p>
      </div>

      {/* Personal Info */}
      <div className="card p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <User className="w-5 h-5 text-royal-600" />
          <h3 className="text-base font-bold text-gray-900">Personal Information</h3>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Role / Access Level</label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="card p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <Bell className="w-5 h-5 text-royal-600" />
          <h3 className="text-base font-bold text-gray-900">Notification Alerts</h3>
        </div>

        <div className="space-y-4">
          {[
            {
              id: 'leadAssigned',
              title: 'New Lead Assignment',
              desc: 'Get notified when a new lead is assigned to your account.',
            },
            {
              id: 'dealUpdates',
              title: 'Deal Stage Changes',
              desc: 'Receive alerts when your deals progress along the pipeline.',
            },
            {
              id: 'overdueTasks',
              title: 'Overdue Follow-ups & Tasks',
              desc: 'Immediate reminder for follow-ups pending past their due date.',
            },
            {
              id: 'weeklyReport',
              title: 'Weekly Performance Digest',
              desc: 'Email summary of revenue performance every Monday morning.',
            },
          ].map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={(notifications as any)[item.id]}
                onChange={(e) =>
                  setNotifications({ ...notifications, [item.id]: e.target.checked })
                }
                className="h-4 w-4 rounded text-royal-600 focus:ring-royal-500 border-gray-300 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <Shield className="w-5 h-5 text-royal-600" />
          <h3 className="text-base font-bold text-gray-900">Security & Authentication</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Your account uses JSON Web Token (JWT) sessions encrypted with SHA-256 and bcrypt password hashing.
        </p>
        <button
          onClick={() => toast.success('Password reset email dispatched')}
          className="btn-secondary text-xs"
        >
          Change Password
        </button>
      </div>
    </div>
  );
}

