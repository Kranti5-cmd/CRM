import { useState, useEffect, useCallback } from 'react';
import { Plus, LifeBuoy, AlertCircle, CheckCircle2, Clock, Edit2, Trash2, Search } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import PriorityBadge from '../components/ui/PriorityBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatDate } from '../utils/formatters';

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ open: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    customerName: '',
    customerEmail: '',
    category: 'Service Request',
    priority: 'Medium',
    status: 'Open',
    assignedTo: '',
    description: '',
    resolutionNotes: '',
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search) params.search = search;

      const [res, statsRes] = await Promise.all([
        api.get('/tickets', { params }),
        api.get('/tickets/stats'),
      ]);
      setTickets(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setStats(statsRes.data.data || {});
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    api.get('/team').then((r) => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTicket(null);
    setForm({
      subject: '',
      customerName: '',
      customerEmail: '',
      category: 'Service Request',
      priority: 'Medium',
      status: 'Open',
      assignedTo: '',
      description: '',
      resolutionNotes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (t: any) => {
    setEditTicket(t);
    setForm({
      subject: t.subject,
      customerName: t.customerName || '',
      customerEmail: t.customerEmail || '',
      category: t.category,
      priority: t.priority,
      status: t.status,
      assignedTo: typeof t.assignedTo === 'object' ? t.assignedTo._id : t.assignedTo || '',
      description: t.description || '',
      resolutionNotes: t.resolutionNotes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.subject || !form.description) {
      toast.error('Subject and Description are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo || undefined,
      };
      if (editTicket) {
        await api.put(`/tickets/${editTicket._id}`, payload);
        toast.success('Ticket updated');
      } else {
        await api.post('/tickets', payload);
        toast.success('Support ticket created');
      }
      setModalOpen(false);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/tickets/${deleteId}`);
      toast.success('Ticket removed');
      setDeleteId(null);
      fetchTickets();
    } catch {
      toast.error('Failed to delete ticket');
    }
  };

  const columns = [
    {
      key: 'ticketNumber',
      label: 'Ticket #',
      render: (t: any) => (
        <span className="font-mono text-xs font-bold text-royal-700 bg-royal-50 px-2 py-0.5 rounded">
          {t.ticketNumber}
        </span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject & Details',
      render: (t: any) => (
        <div>
          <span className="font-semibold text-gray-900 text-sm">{t.subject}</span>
          <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
        </div>
      ),
    },
    {
      key: 'customerName',
      label: 'Student',
      render: (t: any) => (
        <div>
          <span className="font-semibold text-xs text-gray-900">{t.customerName || 'Anonymous Student'}</span>
          <p className="text-[11px] text-gray-500">{t.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (t: any) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {t.category}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (t: any) => <PriorityBadge priority={t.priority} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (t: any) => {
        const styles: Record<string, string> = {
          Open: 'bg-red-50 text-red-700 border-red-200',
          'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
          Resolved: 'bg-green-50 text-green-700 border-green-200',
          Closed: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[t.status] || ''}`}>
            {t.status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (t: any) => <span className="text-xs text-gray-500">{formatDate(t.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (t: any) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(t)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-royal-600"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(t._id)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student Support</h2>
          <p className="text-sm text-gray-500">Record and resolve student inquiries, batch allocations, LMS access, and technical doubt sessions</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Support Ticket
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-royal-50 text-royal-600 flex items-center justify-center font-bold">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Tickets</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Open Issues</p>
            <p className="text-xl font-bold text-gray-900">{stats.open}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">In Progress</p>
            <p className="text-xl font-bold text-gray-900">{stats.inProgress}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Resolved</p>
            <p className="text-xl font-bold text-gray-900">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ticket #, subject, student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="select-field w-auto text-xs"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="select-field w-auto text-xs"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="Loading support tickets..." />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            title="No tickets found"
            description="Create a new ticket or adjust your filters."
            action={
              <button onClick={openCreate} className="btn-primary">
                New Ticket
              </button>
            }
          />
        ) : (
          <>
            <DataTable columns={columns} data={tickets} />
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit) || 1}
              onPageChange={setPage}
              itemsPerPage={limit}
              onItemsPerPageChange={(n) => {
                setLimit(n);
                setPage(1);
              }}
              totalItems={total}
            />
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTicket ? `Edit Ticket - ${editTicket.ticketNumber}` : 'Create Support Ticket'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Ticket'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="input-field"
              placeholder="e.g. Discord access, live batch timing, LMS login issue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Student Name</label>
            <input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="input-field"
              placeholder="e.g. Vaibhav Biradar"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Student Email</label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              className="input-field"
              placeholder="student@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="select-field"
            >
              <option value="Complaint">Complaint</option>
              <option value="Technical Issue">Technical Issue</option>
              <option value="Billing">Billing</option>
              <option value="Service Request">Service Request</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="select-field"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="select-field"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Support Executive</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="select-field"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Complaint Details *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Detailed description of customer issue..."
            />
          </div>
          {form.status === 'Resolved' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution Summary</label>
              <textarea
                value={form.resolutionNotes}
                onChange={(e) => setForm({ ...form, resolutionNotes: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="How was this complaint or ticket resolved?"
              />
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        message="Are you sure you want to permanently delete this support ticket?"
        danger
      />
    </div>
  );
}

