import { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  GraduationCap,
  CheckCircle2,
  Clock,
  BookOpen,
  IndianRupee,
  Search,
  Filter,
  User,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import type { Deal, User as UserType } from '../types';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

// Student-Centric Admissions Pipeline Stages
const ADMISSION_STAGES = [
  {
    key: 'New Opportunity',
    label: 'Inbound Inquiries',
    subtitle: 'New Student Leads',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    border: 'border-blue-200/90',
    bg: 'bg-blue-50/25',
    headerBg: 'bg-blue-100/60',
    dot: 'bg-blue-500',
  },
  {
    key: 'Qualification',
    label: 'Foundations Cohort',
    subtitle: 'Free Track Curriculum',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    border: 'border-purple-200/90',
    bg: 'bg-purple-50/25',
    headerBg: 'bg-purple-100/60',
    dot: 'bg-purple-500',
  },
  {
    key: 'Proposal',
    label: 'Admissions Counseling',
    subtitle: 'Payment Pending',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    border: 'border-amber-200/90',
    bg: 'bg-amber-50/25',
    headerBg: 'bg-amber-100/60',
    dot: 'bg-amber-500',
  },
  {
    key: 'Negotiation',
    label: 'Fee Verification',
    subtitle: 'Receipt Review',
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
    border: 'border-orange-200/90',
    bg: 'bg-orange-50/25',
    headerBg: 'bg-orange-100/60',
    dot: 'bg-orange-500',
  },
  {
    key: 'Won',
    label: 'Verified Paid Enrolled',
    subtitle: 'Confirmed Admissions',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50/30',
    headerBg: 'bg-emerald-100/80',
    dot: 'bg-emerald-600',
  },
  {
    key: 'Lost',
    label: 'Discontinued / Closed',
    subtitle: 'Inactive Counseling',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    border: 'border-slate-200/90',
    bg: 'bg-slate-50/30',
    headerBg: 'bg-slate-100/70',
    dot: 'bg-slate-400',
  },
];

// Helper to parse student name and course from deal title
function parseStudentDeal(title: string) {
  const parts = (title || '').split(' - ');
  if (parts.length >= 2) {
    const course = parts[0].trim();
    const student = parts.slice(1).join(' - ').trim();
    return { course, student };
  }
  return { course: 'Arshith Boot Camp Track', student: title || 'Registered Learner' };
}

// Track badge styling helper
function getCourseBadge(course: string) {
  const c = course.toLowerCase();
  if (c.includes('python')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (c.includes('web')) {
    return 'bg-blue-50 text-blue-800 border-blue-200';
  }
  if (c.includes('sql')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  if (c.includes('ai') || c.includes('data')) {
    return 'bg-teal-50 text-teal-800 border-teal-200';
  }
  return 'bg-purple-50 text-purple-800 border-purple-200';
}

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<Deal['stage']>('Proposal');
  const [users, setUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('All');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    studentName: '',
    courseTrack: 'Python Programming',
    feeValue: '99',
    assignedTo: '',
    admissionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchDeals = useCallback(async () => {
    try {
      const res = await api.get('/deals', { params: { limit: 200 } });
      setDeals(res.data.data || []);
    } catch {
      toast.error('Failed to load student admissions pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
    api.get('/team').then((r) => setUsers(r.data.data || [])).catch(() => {});
  }, [fetchDeals]);

  // Handle Drag & Drop across admissions stages
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId as Deal['stage'];
    const movedDeal = deals.find((d) => d._id === draggableId);
    const { student } = parseStudentDeal(movedDeal?.title || '');

    const updatedDeals = deals.map((d) => (d._id === draggableId ? { ...d, stage: newStage } : d));
    setDeals(updatedDeals);

    const stageLabel = ADMISSION_STAGES.find((s) => s.key === newStage)?.label || newStage;

    try {
      await api.patch(`/deals/${draggableId}/stage`, { stage: newStage });
      toast.success(`${student} moved to ${stageLabel}!`, { icon: '🎓' });
    } catch {
      toast.error('Failed to sync student stage');
      fetchDeals();
    }
  };

  const openAddModal = (stage: Deal['stage'] = 'Proposal') => {
    setTargetStage(stage);
    setForm({
      studentName: '',
      courseTrack: 'Python Programming',
      feeValue: stage === 'Qualification' ? '0' : '99',
      assignedTo: users[0]?._id || '',
      admissionDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setModalOpen(true);
  };

  const handleEnrollStudent = async () => {
    if (!form.studentName.trim()) {
      toast.error('Student Name is required');
      return;
    }
    setSaving(true);
    try {
      const dealTitle = `${form.courseTrack} - ${form.studentName.trim()}`;
      await api.post('/deals', {
        title: dealTitle,
        stage: targetStage,
        value: Number(form.feeValue) || 0,
        probability: targetStage === 'Won' ? 100 : targetStage === 'Proposal' ? 60 : 30,
        assignedTo: form.assignedTo || undefined,
        expectedCloseDate: form.admissionDate || undefined,
        notes: form.notes || 'Enrolled via Admissions Pipeline',
      });
      toast.success(`Student ${form.studentName} enrolled successfully!`);
      setModalOpen(false);
      fetchDeals();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setSaving(false);
    }
  };

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const { course, student } = parseStudentDeal(deal.title);
      const matchesSearch =
        search === '' ||
        student.toLowerCase().includes(search.toLowerCase()) ||
        course.toLowerCase().includes(search.toLowerCase());

      const matchesTrack = selectedTrack === 'All' || course.toLowerCase().includes(selectedTrack.toLowerCase());

      return matchesSearch && matchesTrack;
    });
  }, [deals, search, selectedTrack]);

  // Aggregate Metrics
  const totalStudents = deals.length;
  const paidEnrollments = deals.filter((d) => d.stage === 'Won').length;
  const paidRevenue = deals.filter((d) => d.stage === 'Won').reduce((sum, d) => sum + (d.value || 0), 0);
  const counselingCount = deals.filter((d) => d.stage === 'Proposal').length;
  const counselingPipelineVal = deals
    .filter((d) => d.stage === 'Proposal' || d.stage === 'Negotiation')
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const foundationsCount = deals.filter((d) => d.stage === 'Qualification').length;

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Loading Arshith Boot Camp admissions pipeline..." />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ADMISSIONS SUMMARY BAR                                   */}
      {/* ========================================================================= */}
      <div className="bg-[#FBF8F1] rounded-2xl border border-[#426557]/25 shadow-xs p-5 md:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <span>CRM</span>
              <span className="text-slate-300">/</span>
              <span>Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#013A2B] font-bold">Student Admissions Pipeline</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0C2D26] tracking-tight flex items-center gap-2.5">
                <GraduationCap className="w-7 h-7 text-[#013A2B]" />
                <span>Student Admissions & Enrollment Pipeline</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#013A2B] border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                {totalStudents} Enrolled Learners
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Arshith Boot Camp Admissions Control · Drag and drop learners across onboarding stages, counseling calls, and confirmed cohort enrollment.
            </p>

            {/* Quick Metrics Chips */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-3 pt-3 border-t border-slate-200/70 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Total: {totalStudents} Learners</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paid Enrolled: {paidEnrollments} ({formatCurrency(paidRevenue)})</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 font-bold text-amber-800 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Admissions Counseling: {counselingCount} ({formatCurrency(counselingPipelineVal)})</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 font-bold text-purple-800 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                <span>Foundations Cohort: {foundationsCount} Free Learners</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex items-center gap-2">
            <button onClick={() => openAddModal('Proposal')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* Search & Course Track Filter Row */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Track Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Track:
            </span>
            {['All', 'Foundations', 'Python', 'Web Dev', 'SQL', 'AI & Data'].map((track) => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedTrack === track
                    ? 'bg-[#013A2B] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {track}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or course..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#013A2B]/20 focus:border-[#013A2B]"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ADMISSIONS KANBAN BOARD                                                */}
      {/* ========================================================================= */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-6">
          {ADMISSION_STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage.key);
            const totalStageFees = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

            return (
              <div
                key={stage.key}
                className={`flex flex-col rounded-2xl border ${stage.border} ${stage.bg} p-3 min-w-[275px] transition-all`}
              >
                {/* Column Header */}
                <div className={`p-2.5 rounded-xl ${stage.headerBg} border ${stage.border} mb-3 shadow-2xs`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${stage.dot} shrink-0`} />
                      <span className="text-xs font-black text-slate-900 tracking-tight truncate">
                        {stage.label}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${stage.badge}`}>
                      {stageDeals.length}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mt-1.5">
                    <span>{stage.subtitle}</span>
                    <span className="text-slate-900 font-extrabold">
                      {totalStageFees > 0 ? formatCurrency(totalStageFees) : '₹0 Free'}
                    </span>
                  </div>
                </div>

                {/* Droppable Student Region */}
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2.5 min-h-[500px] rounded-xl p-1 transition-all ${
                        snapshot.isDraggingOver ? 'bg-emerald-500/10 ring-2 ring-emerald-500/30' : ''
                      }`}
                    >
                      {stageDeals.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200/80 rounded-xl bg-white/40">
                          No students in this stage
                        </div>
                      ) : (
                        stageDeals.map((deal, index) => {
                          const { course, student } = parseStudentDeal(deal.title);
                          const assigneeName = typeof deal.assignedTo === 'object' ? deal.assignedTo.name : '';
                          const isPaid = deal.stage === 'Won';
                          const isPending = deal.stage === 'Proposal' || deal.stage === 'Negotiation';

                          return (
                            <Draggable key={deal._id} draggableId={deal._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#013A2B]/40 transition-all select-none ${
                                    snapshot.isDragging
                                      ? 'shadow-xl ring-2 ring-[#013A2B] rotate-1 scale-102'
                                      : ''
                                  }`}
                                >
                                  {/* Student Header */}
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100/90 text-[#013A2B] font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-300/60 shadow-2xs">
                                      {student.charAt(0).toUpperCase() || 'S'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-extrabold text-xs text-slate-900 truncate leading-snug">
                                        {student}
                                      </h4>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        Arshith Boot Camp
                                      </span>
                                    </div>
                                  </div>

                                  {/* Course Track Pill */}
                                  <div className="mt-2.5">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border truncate max-w-full ${getCourseBadge(
                                        course
                                      )}`}
                                    >
                                      {course}
                                    </span>
                                  </div>

                                  {/* Fee & Enrollment Status Badge */}
                                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                    {isPaid ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>₹99 Paid</span>
                                      </span>
                                    ) : isPending ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>₹99 Pending</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-300">
                                        <BookOpen className="w-3 h-3 text-purple-600" />
                                        <span>Free Track</span>
                                      </span>
                                    )}

                                    {/* Counselor Attribution */}
                                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">
                                      {assigneeName ? assigneeName.split(' ')[0] : 'Counselor'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* ========================================================================= */}
      {/* 3. ENROLL STUDENT MODAL                                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enroll Student into Boot Camp Track"
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleEnrollStudent} disabled={saving} className="btn-primary">
              {saving ? 'Enrolling...' : 'Confirm Enrollment'}
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
            <input
              type="text"
              value={form.studentName}
              onChange={(e) => setForm({ ...form, studentName: e.target.value })}
              className="input-field"
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course / Curriculum Track *</label>
            <select
              value={form.courseTrack}
              onChange={(e) => {
                const tr = e.target.value;
                setForm({
                  ...form,
                  courseTrack: tr,
                  feeValue: tr.includes('Foundations') ? '0' : '99',
                });
              }}
              className="select-field"
            >
              <option value="Python Programming">Python Programming (₹99)</option>
              <option value="Web Development">Web Development (₹99)</option>
              <option value="SQL Mastery">SQL Mastery (₹99)</option>
              <option value="AI & Data Science">AI & Data Science (₹99)</option>
              <option value="Foundations Track">Foundations Track (Free Cohort)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Fee (₹) *</label>
              <input
                type="number"
                value={form.feeValue}
                onChange={(e) => setForm({ ...form, feeValue: e.target.value })}
                className="input-field"
                placeholder="99"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admissions Stage</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value as Deal['stage'])}
                className="select-field"
              >
                {ADMISSION_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Admissions Counselor</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="select-field"
            >
              <option value="">Technical Mentor Lead</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Enrollment Date</label>
            <input
              type="date"
              value={form.admissionDate}
              onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Counseling & Admissions Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="Counseling discussion, fee confirmation receipt, cohort batch..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
