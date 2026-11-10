import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Contact, User, Company, Column } from '../types';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatDate } from '../utils/formatters';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', position: '', department: '', assignedTo: '', notes: '' });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      const res = await api.get('/contacts', { params });
      setContacts(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [page, limit, search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => {
    api.get('/team').then(r => setUsers(r.data.data || [])).catch(() => {});
    api.get('/companies?limit=100').then(r => setCompanies(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => { setEditContact(null); setForm({ firstName: '', lastName: '', email: '', phone: '', company: '', position: '', department: '', assignedTo: '', notes: '' }); setModalOpen(true); };
  const openEdit = (c: Contact) => {
    setEditContact(c);
    setForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, company: typeof c.company === 'object' ? c.company._id : c.company || '', position: c.position || '', department: c.department || '', assignedTo: typeof c.assignedTo === 'object' ? c.assignedTo._id : c.assignedTo || '', notes: c.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.email) { toast.error('First name and email are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, company: form.company || undefined, assignedTo: form.assignedTo || undefined };
      if (editContact) { await api.put(`/contacts/${editContact._id}`, payload); toast.success('Student updated'); }
      else { await api.post('/contacts', payload); toast.success('Student created'); }
      setModalOpen(false); fetchContacts();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/contacts/${deleteId}`); toast.success('Student deleted'); setDeleteId(null); fetchContacts(); }
    catch { toast.error('Failed to delete'); }
  };

  const columns: Column<Contact>[] = [
    { key: 'name', label: 'Student Name', sortable: true, render: (c) => <span className="font-semibold text-gray-900">{c.firstName} {c.lastName}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (c) => c.phone || '-' },
    {
      key: 'company',
      label: 'Institution / Boot Camp',
      render: (c) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {typeof c.company === 'object' ? c.company.name : 'Arshith Boot Camp'}
        </span>
      ),
    },
    { key: 'position', label: 'Course / Track', render: (c) => <span className="font-medium text-gray-800">{c.position || '-'}</span> },
    { key: 'assignedTo', label: 'Assigned Advisor', render: (c) => typeof c.assignedTo === 'object' ? c.assignedTo.name : 'Unassigned' },
    {
      key: 'actions', label: 'Actions', render: (c) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} title="Edit Student" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-royal-600"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(c._id); }} title="Delete Student" className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm font-medium text-gray-600">{total} total students</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Student</button>
      </div>
      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <SearchInput placeholder="Search students by name, email, or course track..." onSearch={(v) => { setSearch(v); setPage(1); }} />
        </div>
        {loading ? <div className="py-16"><LoadingSpinner text="Loading students..." /></div> : contacts.length === 0 ? (
          <EmptyState title="No students found" description="Add your first student or wait for CodeLekho registrations." action={<button onClick={openCreate} className="btn-primary">Add Student</button>} />
        ) : (
          <>
            <DataTable columns={columns} data={contacts} />
            <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} itemsPerPage={limit} onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }} totalItems={total} />
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editContact ? 'Edit Student' : 'Add New Student'} size="lg" footer={
        <><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Student'}</button></>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-field" placeholder="First name" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-field" placeholder="Last name" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Student Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="student@example.com" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+91..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Institution / Boot Camp</label><select value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="select-field"><option value="">Select institution</option>{companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Enrolled Course / Track</label><input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="input-field" placeholder="e.g. Python Programming (Enrolled)" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch / Department</label><input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input-field" placeholder="e.g. Arshith Boot Camp" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Assigned Advisor</label><select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="select-field"><option value="">Unassigned</option>{users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}</select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Student Notes & Details</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} placeholder="Student ID, payment details, notes..." /></div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Student" message="Are you sure you want to delete this student record?" confirmText="Delete Student" danger />
    </div>
  );
}

