import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Mail, Phone, Building2, Calendar, IndianRupee, Clock } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatCurrency, formatRelativeTime } from '../utils/formatters';
import type { Lead, Activity } from '../types';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLead = useCallback(async () => {
    try {
      const res = await api.get(`/leads/${id}`);
      setLead(res.data.data);
    } catch { toast.error('Lead not found'); navigate('/leads'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  if (loading) return <div className="py-16"><LoadingSpinner text="Loading lead..." /></div>;
  if (!lead) return null;

  const assignee = typeof lead.assignedTo === 'object' ? lead.assignedTo : null;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/leads')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{lead.fullName}</h2>
                <p className="text-sm text-gray-500">{lead.companyName}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={lead.leadStatus} />
                <PriorityBadge priority={lead.priority} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span>{lead.email}</span></div>
              <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{lead.phone}</span></div>
              <div className="flex items-center gap-3 text-sm"><Building2 className="w-4 h-4 text-gray-400" /><span>{lead.companyName}</span></div>
              <div className="flex items-center gap-3 text-sm"><IndianRupee className="w-4 h-4 text-gray-400" /><span>{lead.value ? formatCurrency(lead.value) : 'N/A'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span>Created {formatDate(lead.createdAt)}</span></div>
              {lead.nextFollowUp && <div className="flex items-center gap-3 text-sm"><Clock className="w-4 h-4 text-gray-400" /><span>Follow-up: {formatDate(lead.nextFollowUp)}</span></div>}
            </div>
          </div>

          {lead.notes && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{lead.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Lead Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Source</dt><dd className="font-medium">{lead.leadSource}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Assigned To</dt><dd className="font-medium">{assignee?.name || 'Unassigned'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Last Updated</dt><dd className="font-medium">{formatDate(lead.updatedAt)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

