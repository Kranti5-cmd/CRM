import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Company, User, Column } from '../types';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { INDUSTRIES, COMPANY_SIZES } from '../utils/constants';

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', website: '', email: '', phone: '', size: '', revenue: '', assignedTo: '', notes: '' });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      const res = await api.get('/companies', { params });
      setCompanies(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load companies'); }
    finally { setLoading(false); }
  }, [page, limit, search]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { api.get('/team').then(r => setUsers(r.data.data || [])).catch(() => {}); }, []);

  const openCreate = () => { setEditCompany(null); setForm({ name: '', industry: '', website: '', email: '', phone: '', size: '', revenue: '', assignedTo: '', notes: '' }); setModalOpen(true); };
  const openEdit = (c: Company) => {
    setEditCompany(c);
    setForm({ name: c.name, industry: c.industry || '', website: c.website || '', email: c.email || '', phone: c.phone || '', size: c.size || '', revenue: c.revenue?.toString() || '', assignedTo: typeof c.assignedTo === 'object' ? c.assignedTo._id : c.assignedTo || '', notes: c.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, revenue: form.revenue ? Number(form.revenue) : undefined, assignedTo: form.assignedTo || undefined };
      if (editCompany) { await api.put(`/companies/${editCompany._id}`, payload); toast.success('Company updated'); }
      else { await api.post('/companies', payload); toast.success('Company created'); }
      setModalOpen(false); fetchCompanies();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/companies/${deleteId}`); toast.success('Company deleted'); setDeleteId(null); fetchCompanies(); } catch { toast.error('Failed to delete'); }
  };

  const columns: Column<Company>[] = [
    {
      key: 'name',
      label: 'Partner Company',
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-bold text-gray-900 block leading-tight">{c.name}</span>
          {c.email && <span className="text-[11px] text-gray-400 font-mono">{c.email}</span>}
        </div>
      ),
    },
    {
      key: 'industry',
      label: 'Industry',
      render: (c) => (
        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          {c.industry || 'Technology'}
        </span>
      ),
    },
    { key: 'size', label: 'Company Size', render: (c) => c.size || '50+' },
    {
      key: 'notes',
      label: 'Hiring & Placement Scope',
      render: (c) => <span className="text-xs text-gray-700 line-clamp-2 max-w-xs">{c.notes || 'Arshith Boot Camp placement partner'}</span>,
    },
    {
      key: 'website',
      label: 'Website',
      render: (c) => c.website ? (
        <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 hover:underline text-xs font-medium truncate max-w-[160px] block">
          {c.website}
        </a>
      ) : '-',
    },
    { key: 'assignedTo', label: 'Placement Lead', render: (c) => typeof c.assignedTo === 'object' ? c.assignedTo.name : 'Placement & Career Cell' },
    {
      key: 'actions', label: 'Actions', render: (c) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} title="Edit Company" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-royal-600"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(c._id); }} title="Delete Company" className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm font-medium text-gray-600">{total} total hiring partners & tech companies</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Partner Company</button>
      </div>
      <div className="card">
        <div className="p-4 border-b border-gray-100"><SearchInput placeholder="Search partner companies, recruiters, or hiring tracks..." onSearch={(v) => { setSearch(v); setPage(1); }} /></div>
        {loading ? <div className="py-16"><LoadingSpinner text="Loading partner companies..." /></div> : companies.length === 0 ? (
          <EmptyState title="No partner companies found" action={<button onClick={openCreate} className="btn-primary">Add Partner Company</button>} />
        ) : (
          <><DataTable columns={columns} data={companies} /><Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} itemsPerPage={limit} onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }} totalItems={total} /></>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCompany ? 'Edit Partner Company' : 'Add New Hiring Partner'} size="lg" footer={
        <><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Partner'}</button></>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Partner Company Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Zoho, Swiggy, Arshith Group" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label><select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} className="select-field"><option value="">Select industry</option>{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Official Website</label><input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="input-field" placeholder="https://" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Recruiter / Placement Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="campus@company.com" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+91..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label><select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="select-field"><option value="">Select size</option>{COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Placement Relationship Lead</label><select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="select-field"><option value="">Placement & Career Cell</option>{users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}</select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Hiring Tracks & Placement Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} placeholder="Hiring focus (Python, Web Development, SQL), batch drive dates, notes..." /></div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Company" message="Are you sure?" confirmText="Delete" danger />
    </div>
  );
}

