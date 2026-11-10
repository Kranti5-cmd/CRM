import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Deal, User, Company, Contact, Column } from '../types';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DEAL_STAGES } from '../utils/constants';

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', contact: '', value: '', stage: 'New Opportunity', probability: '10', assignedTo: '', expectedCloseDate: '', notes: '' });

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (stageFilter) params.stage = stageFilter;
      const res = await api.get('/deals', { params });
      setDeals(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load deals'); }
    finally { setLoading(false); }
  }, [page, limit, search, stageFilter]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);
  useEffect(() => {
    api.get('/team').then(r => setUsers(r.data.data || [])).catch(() => {});
    api.get('/companies?limit=100').then(r => setCompanies(r.data.data || [])).catch(() => {});
    api.get('/contacts?limit=100').then(r => setContacts(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => { setEditDeal(null); setForm({ title: '', company: '', contact: '', value: '', stage: 'New Opportunity', probability: '10', assignedTo: '', expectedCloseDate: '', notes: '' }); setModalOpen(true); };
  const openEdit = (d: Deal) => {
    setEditDeal(d);
    setForm({ title: d.title, company: typeof d.company === 'object' ? d.company._id : d.company || '', contact: typeof d.contact === 'object' ? d.contact._id : d.contact || '', value: d.value?.toString() || '', stage: d.stage, probability: d.probability?.toString() || '10', assignedTo: typeof d.assignedTo === 'object' ? d.assignedTo._id : d.assignedTo || '', expectedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.split('T')[0] : '', notes: d.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.value) { toast.error('Title and value are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value), probability: Number(form.probability), company: form.company || undefined, contact: form.contact || undefined, assignedTo: form.assignedTo || undefined, expectedCloseDate: form.expectedCloseDate || undefined };
      if (editDeal) { await api.put(`/deals/${editDeal._id}`, payload); toast.success('Deal updated'); }
      else { await api.post('/deals', payload); toast.success('Deal created'); }
      setModalOpen(false); fetchDeals();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/deals/${deleteId}`); toast.success('Deal deleted'); setDeleteId(null); fetchDeals(); } catch { toast.error('Failed to delete'); }
  };

  const columns: Column<Deal>[] = [
    { key: 'title', label: 'Deal', sortable: true, render: (d) => <span className="font-medium text-gray-900">{d.title}</span> },
    { key: 'company', label: 'Company', render: (d) => typeof d.company === 'object' ? d.company.name : '-' },
    { key: 'value', label: 'Value', sortable: true, render: (d) => <span className="font-semibold text-gray-900">{formatCurrency(d.value)}</span> },
    { key: 'stage', label: 'Stage', render: (d) => <StatusBadge status={d.stage} variant="deal" /> },
    { key: 'probability', label: 'Prob.', render: (d) => `${d.probability}%` },
    { key: 'assignedTo', label: 'Assigned', render: (d) => typeof d.assignedTo === 'object' ? d.assignedTo.name : '-' },
    { key: 'expectedCloseDate', label: 'Close Date', render: (d) => d.expectedCloseDate ? formatDate(d.expectedCloseDate) : '-' },
    {
      key: 'actions', label: '', render: (d) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(d); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-royal-600"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(d._id); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{total} total deals</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Deal</button>
      </div>
      <div className="card">
        <div className="p-3.5 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-3">
          <SearchInput placeholder="Search deals by title or notes..." onSearch={(v) => { setSearch(v); setPage(1); }} className="flex-1 w-full" />
          <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(1); }} className="select-field w-full sm:w-auto h-[42px] min-w-[160px] text-sm"><option value="">All Stages</option>{DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select>
          {(search || stageFilter) && (
            <button
              onClick={() => { setSearch(''); setStageFilter(''); setPage(1); }}
              className="h-[42px] px-3.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
            >
              Reset
            </button>
          )}
        </div>
        {loading ? <div className="py-16"><LoadingSpinner /></div> : deals.length === 0 ? (
          <EmptyState title="No deals found" action={<button onClick={openCreate} className="btn-primary">Add Deal</button>} />
        ) : (
          <><DataTable columns={columns} data={deals} /><Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} itemsPerPage={limit} onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }} totalItems={total} /></>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editDeal ? 'Edit Deal' : 'Add Deal'} size="lg" footer={
        <><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button></>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Deal Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label><select value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="select-field"><option value="">Select</option>{companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact</label><select value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="select-field"><option value="">Select</option>{contacts.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Course Fee / Value (₹) *</label><input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="input-field" placeholder="₹" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Stage</label><select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="select-field">{DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label><input type="number" min="0" max="100" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label><select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="select-field"><option value="">Select</option>{users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label><input type="date" value={form.expectedCloseDate} onChange={e => setForm({ ...form, expectedCloseDate: e.target.value })} className="input-field" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} /></div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Deal" message="This action cannot be undone." confirmText="Delete" danger />
    </div>
  );
}

