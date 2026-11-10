import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  X,
  ChevronDown,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Lead, User } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITIES } from '../utils/constants';
import { formatDate, getInitials } from '../utils/formatters';

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    leadSource: 'Website',
    leadStatus: 'New',
    priority: 'Medium',
    assignedTo: '',
    value: '',
    nextFollowUp: '',
    notes: '',
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit, sortBy, sortOrder };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get('/leads', { params });
      setLeads(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sourceFilter, priorityFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    api
      .get('/team')
      .then((r) => setUsers(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  const openCreate = () => {
    setEditLead(null);
    setForm({
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      leadSource: 'Website',
      leadStatus: 'New',
      priority: 'Medium',
      assignedTo: '',
      value: '',
      nextFollowUp: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditLead(lead);
    setForm({
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone || '',
      companyName: lead.companyName || '',
      leadSource: lead.leadSource,
      leadStatus: lead.leadStatus,
      priority: lead.priority,
      assignedTo:
        typeof lead.assignedTo === 'object'
          ? (lead.assignedTo as any)?._id || ''
          : lead.assignedTo || '',
      value: lead.value?.toString() || '',
      nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.split('T')[0] : '',
      notes: lead.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: form.value ? Number(form.value) : undefined,
        nextFollowUp: form.nextFollowUp || undefined,
        assignedTo: form.assignedTo || undefined,
      };
      if (editLead) {
        await api.put(`/leads/${editLead._id}`, payload);
        toast.success('Lead updated successfully');
      } else {
        await api.post('/leads', payload);
        toast.success('Lead created successfully');
      }
      setModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/leads/${deleteId}`);
      toast.success('Lead deleted successfully');
      setDeleteId(null);
      fetchLeads();
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasActiveFilters = Boolean(search || statusFilter || sourceFilter || priorityFilter);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* 1. Header Section */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1">
            <span>CRM</span>
            <span className="text-gray-300">/</span>
            <span>Workspace</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#013A2B] font-semibold">Lead Management</span>
          </div>
          {/* Title + Count */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
              Lead Management
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              {total} {total === 1 ? 'lead' : 'total leads'}
            </span>
          </div>
        </div>

        {/* Top-Right Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#013A2B] hover:bg-[#0C2D26] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Section (Horizontal Row) */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-3.5 sm:p-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Bar (~40% on lg) */}
          <div className="w-full lg:w-[40%] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search leads by name, email, company..."
              className="w-full h-[42px] pl-10 pr-9 bg-gray-50/70 hover:bg-gray-50 focus:bg-white text-sm text-gray-900 placeholder:text-gray-400 rounded-lg border border-gray-200 focus:border-[#013A2B] focus:ring-2 focus:ring-[#013A2B]/10 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="w-full lg:flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[42px] pl-3 pr-8 bg-gray-50/70 hover:bg-gray-50 focus:bg-white text-sm text-gray-800 rounded-lg border border-gray-200 focus:border-[#013A2B] focus:ring-2 focus:ring-[#013A2B]/10 outline-none transition-all cursor-pointer appearance-none font-medium"
              >
                <option value="">All Statuses</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Source Dropdown */}
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[42px] pl-3 pr-8 bg-gray-50/70 hover:bg-gray-50 focus:bg-white text-sm text-gray-800 rounded-lg border border-gray-200 focus:border-[#013A2B] focus:ring-2 focus:ring-[#013A2B]/10 outline-none transition-all cursor-pointer appearance-none font-medium"
              >
                <option value="">All Sources</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Priority Dropdown */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[42px] pl-3 pr-8 bg-gray-50/70 hover:bg-gray-50 focus:bg-white text-sm text-gray-800 rounded-lg border border-gray-200 focus:border-[#013A2B] focus:ring-2 focus:ring-[#013A2B]/10 outline-none transition-all cursor-pointer appearance-none font-medium"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="h-[42px] px-3.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Lead Management Table Container */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner text="Loading leads..." />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found"
            description={
              hasActiveFilters
                ? 'Try adjusting or clearing your filters to see more leads.'
                : 'Get started by creating your first sales lead.'
            }
            action={
              hasActiveFilters ? (
                <button onClick={handleResetFilters} className="btn-secondary text-xs">
                  Clear Filters
                </button>
              ) : (
                <button onClick={openCreate} className="btn-primary text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Lead
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider select-none">
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('fullName')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Lead Name</span>
                        {sortBy === 'fullName' &&
                          (sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                          ))}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Email</span>
                        {sortBy === 'email' &&
                          (sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                          ))}
                      </div>
                    </th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('companyName')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Company</span>
                        {sortBy === 'companyName' &&
                          (sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                          ))}
                      </div>
                    </th>

                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Assigned To</th>

                    <th
                      className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Created Date</span>
                        {sortBy === 'createdAt' &&
                          (sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                          ))}
                      </div>
                    </th>

                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => {
                    const assignedUser =
                      typeof lead.assignedTo === 'object' && lead.assignedTo
                        ? (lead.assignedTo as any).name
                        : lead.assignedTo || '';

                    return (
                      <tr
                        key={lead._id}
                        onClick={() => navigate(`/leads/${lead._id}`)}
                        className="h-[62px] hover:bg-gray-50/70 transition-colors duration-150 cursor-pointer group"
                      >
                        {/* Lead Name with avatar */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#013A2B]/10 text-[#013A2B] font-bold text-xs flex items-center justify-center shrink-0 border border-[#013A2B]/15">
                              {getInitials(lead.fullName)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-[#013A2B] transition-colors flex items-center gap-1.5 flex-wrap">
                                <span>{lead.fullName}</span>
                                {lead.studentId && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300/80">
                                    {lead.studentId}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                {lead.courseName && (
                                  <span className="text-emerald-700 font-semibold">
                                    {lead.courseName}
                                  </span>
                                )}
                                {lead.phone && <span>{lead.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 font-normal">
                            {lead.email}
                          </span>
                        </td>

                        {/* Company */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800">
                            {lead.companyName || '—'}
                          </span>
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/60">
                            {lead.leadSource}
                          </span>
                        </td>

                        {/* Status (Color Specification) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <LeadStatusPill status={lead.leadStatus} />
                        </td>

                        {/* Priority (Color Specification) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <LeadPriorityPill priority={lead.priority} />
                        </td>

                        {/* Assigned To */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {assignedUser ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span>{assignedUser}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Unassigned</span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-xs text-gray-500 font-medium">
                            {formatDate(lead.createdAt)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              title="View details"
                              onClick={() => navigate(`/leads/${lead._id}`)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#013A2B] hover:bg-[#013A2B]/10 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              title="Edit lead"
                              onClick={() => openEdit(lead)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              title="Delete lead"
                              onClick={() => setDeleteId(lead._id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>
                  Showing{' '}
                  <strong className="text-gray-700">
                    {total === 0 ? 0 : (page - 1) * limit + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-gray-700">
                    {Math.min(page * limit, total)}
                  </strong>{' '}
                  of <strong className="text-gray-700">{total}</strong> leads
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">|</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-7 px-2 bg-white text-xs text-gray-700 rounded border border-gray-200 focus:outline-none focus:border-[#013A2B] cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | string)[]>((acc, cur, idx, src) => {
                      if (idx > 0 && cur - (src[idx - 1] as number) > 1) acc.push('...');
                      acc.push(cur);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`dots-${idx}`} className="px-1.5 text-xs text-gray-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(Number(item))}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            item === page
                              ? 'bg-[#013A2B] text-white shadow-xs'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Lead Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editLead ? 'Edit Lead' : 'Add New Lead'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#013A2B] hover:bg-[#0C2D26] text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : editLead ? 'Update Lead' : 'Create Lead'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B] focus:ring-1 focus:ring-[#013A2B]"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B] focus:ring-1 focus:ring-[#013A2B]"
              placeholder="john@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B] focus:ring-1 focus:ring-[#013A2B]"
              placeholder="(555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Company</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B] focus:ring-1 focus:ring-[#013A2B]"
              placeholder="Company name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Source</label>
            <select
              value={form.leadSource}
              onChange={(e) => setForm({ ...form, leadSource: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B]"
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={form.leadStatus}
              onChange={(e) => setForm({ ...form, leadStatus: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B]"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B]"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned To</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B]"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Course Fee / Value (₹)
            </label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B]"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Next Follow-up</label>
            <input
              type="date"
              value={form.nextFollowUp}
              onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })}
              className="w-full h-[40px] px-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full p-3 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#013A2B]"
              rows={3}
              placeholder="Add lead context or requirements..."
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

/**
 * 4. Status Badge Pill Component
 * Follows exact user specifications:
 * - New: Blue
 * - Contacted: Purple
 * - Qualified: Teal
 * - Proposal / Proposal Sent / Negotiation: Orange
 * - Converted: Green
 * - Lost: Red
 */
function LeadStatusPill({ status }: { status: string }) {
  let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotStyle = 'bg-gray-400';

  switch (status) {
    case 'New':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200/80';
      dotStyle = 'bg-blue-500';
      break;
    case 'Contacted':
      badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200/80';
      dotStyle = 'bg-purple-500';
      break;
    case 'Qualified':
      badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200/80';
      dotStyle = 'bg-teal-500';
      break;
    case 'Proposal':
    case 'Proposal Sent':
    case 'Negotiation':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
      dotStyle = 'bg-amber-500';
      break;
    case 'Converted':
    case 'Won':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      dotStyle = 'bg-emerald-500';
      break;
    case 'Lost':
      badgeStyle = 'bg-red-50 text-red-700 border-red-200/80';
      dotStyle = 'bg-red-500';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />
      <span>{status}</span>
    </span>
  );
}

/**
 * Priority Badge Pill Component
 * Follows exact user specifications:
 * - High / Critical: Soft Red
 * - Medium: Soft Orange
 * - Low: Light Grey
 */
function LeadPriorityPill({ priority }: { priority: string }) {
  let badgeStyle = 'bg-gray-100 text-gray-600 border-gray-200/80';

  switch (priority) {
    case 'Critical':
    case 'High':
      badgeStyle = 'bg-red-50 text-red-700 border-red-200/80';
      break;
    case 'Medium':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
      break;
    case 'Low':
    default:
      badgeStyle = 'bg-gray-100 text-gray-600 border-gray-200/80';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} whitespace-nowrap`}
    >
      {priority}
    </span>
  );
}
