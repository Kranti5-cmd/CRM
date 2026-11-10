import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, Edit2, Trash2, Calendar } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Task, User as UserType, Column } from '../types';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import PriorityBadge from '../components/ui/PriorityBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { TASK_TYPES, PRIORITIES, TASK_STATUSES } from '../utils/constants';
import { formatDate } from '../utils/formatters';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed' | 'Overdue'>('All');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [users, setUsers] = useState<UserType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Follow-up',
    priority: 'Medium',
    status: 'Pending',
    assignedTo: '',
    dueDate: '',
    notes: '',
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (activeTab === 'Pending') params.status = 'Pending';
      if (activeTab === 'Completed') params.status = 'Completed';
      
      const endpoint = activeTab === 'Overdue' ? '/tasks/overdue' : '/tasks';
      const res = await api.get(endpoint, { params });
      
      if (activeTab === 'Overdue') {
        setTasks(res.data.data || []);
        setTotal(res.data.count || (res.data.data ? res.data.data.length : 0));
      } else {
        setTasks(res.data.data || []);
        setTotal(res.data.pagination?.total || (res.data.data ? res.data.data.length : 0));
      }
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    api.get('/team').then((r) => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTask(null);
    setForm({
      title: '',
      description: '',
      type: 'Follow-up',
      priority: 'Medium',
      status: 'Pending',
      assignedTo: '',
      dueDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditTask(t);
    setForm({
      title: t.title,
      description: t.description || '',
      type: t.type,
      priority: t.priority,
      status: t.status,
      assignedTo: typeof t.assignedTo === 'object' ? t.assignedTo._id : t.assignedTo || '',
      dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
      notes: t.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.dueDate) {
      toast.error('Title and Due Date are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo || undefined,
      };
      if (editTask) {
        await api.put(`/tasks/${editTask._id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task scheduled');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (t: Task) => {
    try {
      if (t.status === 'Completed') {
        await api.put(`/tasks/${t._id}`, { status: 'Pending' });
        toast.success('Task marked as pending');
      } else {
        await api.patch(`/tasks/${t._id}/complete`);
        toast.success('Task marked as completed');
      }
      fetchTasks();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/tasks/${deleteId}`);
      toast.success('Task deleted');
      setDeleteId(null);
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'status',
      label: 'Done',
      render: (t) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleComplete(t);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            t.status === 'Completed' ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-300 hover:text-gray-500'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
        </button>
      ),
    },
    {
      key: 'title',
      label: 'Task & Details',
      sortable: true,
      render: (t) => (
        <div>
          <span className={`font-semibold text-sm ${t.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {t.title}
          </span>
          {t.description && <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (t) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
          {t.type}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (t) => <PriorityBadge priority={t.priority} />,
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (t) => <span>{typeof t.assignedTo === 'object' ? t.assignedTo.name : '-'}</span>,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (t) => {
        const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'Completed';
        return (
          <span className={`text-xs font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(t.dueDate)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(t);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-royal-600"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(t._id);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tasks & Follow-ups</h2>
          <p className="text-sm text-gray-500">Stay on top of customer follow-ups and day-to-day CRM actions</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="card">
        {/* Filter Tabs */}
        <div className="flex border-b border-gray-100 px-4">
          {(['All', 'Pending', 'Completed', 'Overdue'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`py-3.5 px-4 font-semibold text-xs transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-royal-600 text-royal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'Overdue' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="Fetching tasks..." />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks in this view"
            description="All clear or schedule a new follow-up."
            action={
              <button onClick={openCreate} className="btn-primary">
                Add Task
              </button>
            }
          />
        ) : (
          <>
            <DataTable columns={columns} data={tasks} />
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTask ? 'Edit Task' : 'Schedule New Task'}
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Task'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="e.g. Follow-up demo call"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="select-field"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="select-field"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned To</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="select-field"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Details</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              rows={2}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to remove this task?"
        danger
      />
    </div>
  );
}

