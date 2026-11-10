import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, CheckCircle, AlertCircle, Phone, Video, Mail, Trash2, X
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PriorityBadge from '../components/ui/PriorityBadge';
import { TASK_TYPES, PRIORITIES } from '../utils/constants';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event / Task Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  // Day Details Slide-over / Modal
  const [viewDayModal, setViewDayModal] = useState(false);
  const [inspectDay, setInspectDay] = useState<Date>(new Date());

  const [form, setForm] = useState({
    title: '',
    type: 'Call',
    priority: 'Medium',
    status: 'Pending',
    assignedTo: '',
    time: '10:00',
    description: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, leadsRes, usersRes] = await Promise.all([
        api.get('/tasks', { params: { limit: 200 } }),
        api.get('/leads', { params: { limit: 200 } }),
        api.get('/team'),
      ]);
      setTasks(tasksRes.data.data || []);
      setLeads((leadsRes.data.data || []).filter((l: any) => l.nextFollowUp));
      setUsers(usersRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
    const dayLeads = leads.filter((l) => l.nextFollowUp && isSameDay(new Date(l.nextFollowUp), day));
    return { dayTasks, dayLeads };
  };

  const handleCellClick = (day: Date) => {
    setSelectedDay(day);
    setInspectDay(day);
    const { dayTasks, dayLeads } = getEventsForDay(day);
    // If events exist, open day inspector; if empty, open new event modal
    if (dayTasks.length > 0 || dayLeads.length > 0) {
      setViewDayModal(true);
    } else {
      openAddModal(day);
    }
  };

  const openAddModal = (day: Date) => {
    setSelectedDay(day);
    setForm({
      title: '',
      type: 'Call',
      priority: 'Medium',
      status: 'Pending',
      assignedTo: '',
      time: '10:00',
      description: '',
    });
    setModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error('Please enter an event or meeting title');
      return;
    }
    setSaving(true);
    try {
      const dateStr = format(selectedDay, 'yyyy-MM-dd');
      await api.post('/tasks', {
        title: form.title,
        type: form.type,
        priority: form.priority,
        status: form.status,
        dueDate: `${dateStr}T${form.time}:00.000Z`,
        description: form.description,
        assignedTo: form.assignedTo || undefined,
      });
      toast.success('Event scheduled on calendar!');
      setModalOpen(false);
      setViewDayModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Event removed');
      loadData();
      setViewDayModal(false);
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Loading your CRM schedule..." />
      </div>
    );
  }

  const { dayTasks: inspectTasks, dayLeads: inspectLeads } = getEventsForDay(inspectDay);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Calendar & Meetings</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
              {tasks.length + leads.length} Scheduled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click on any date box below to schedule a call, meeting, or view event details
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Navigation */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-xs p-1">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-xs text-slate-900 min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn-secondary text-xs py-2"
          >
            Today
          </button>

          <button
            onClick={() => openAddModal(new Date())}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        </div>
      </div>

      {/* Main Calendar Board */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50 text-center py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[640px]">
          {days.map((day) => {
            const { dayTasks, dayLeads } = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            const inCurrentMonth = isSameMonth(day, currentDate);
            const totalEvents = dayTasks.length + dayLeads.length;

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleCellClick(day)}
                className={`p-2 transition-all cursor-pointer flex flex-col group relative select-none ${
                  !inCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white hover:bg-slate-50/80'
                } ${isToday ? 'bg-brand-50/20 ring-1 ring-brand-500/30' : ''}`}
              >
                {/* Date header & quick plus button */}
                <div className="flex justify-between items-center mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-slate-900 text-white' : inCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddModal(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition"
                    title="Add Event"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Event Pills list */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[90px] pr-0.5">
                  {dayTasks.map((t) => (
                    <div
                      key={t._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectDay(day);
                        setViewDayModal(true);
                      }}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 truncate flex items-center gap-1.5 shadow-2xs transition"
                      title={t.title}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}

                  {dayLeads.map((l) => (
                    <div
                      key={l._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectDay(day);
                        setViewDayModal(true);
                      }}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 truncate flex items-center gap-1.5 border border-amber-200/60 shadow-2xs transition"
                      title={`Follow-up with: ${l.fullName}`}
                    >
                      <Phone className="w-3 h-3 text-amber-700 flex-shrink-0" />
                      <span className="truncate">{l.fullName}</span>
                    </div>
                  ))}
                </div>

                {/* Empty hover indicator */}
                {totalEvents === 0 && inCurrentMonth && (
                  <div className="hidden group-hover:flex items-center justify-center flex-1 text-[11px] text-slate-300 font-medium">
                    + Add event
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: Schedule New Event / Meeting */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Schedule Event for ${format(selectedDay, 'EEEE, MMM dd, yyyy')}`}
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateTask} disabled={saving} className="btn-primary">
              {saving ? 'Scheduling...' : 'Save to Calendar'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Event / Meeting Title *</label>
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="e.g. Contract negotiation call with Sunrise Traders"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Activity Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="select-field"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Executive</label>
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Notes / Agenda</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="Discuss product quotation and implementation roadmap..."
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Day Details Inspector & Quick Action */}
      <Modal
        isOpen={viewDayModal}
        onClose={() => setViewDayModal(false)}
        title={`Events on ${format(inspectDay, 'MMMM dd, yyyy')}`}
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                setViewDayModal(false);
                openAddModal(inspectDay);
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add Another Event
            </button>
            <button onClick={() => setViewDayModal(false)} className="btn-secondary">
              Close
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {inspectTasks.length === 0 && inspectLeads.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No scheduled items on this day.</p>
          ) : (
            <div className="space-y-2.5">
              {/* Task Items */}
              {inspectTasks.map((t) => (
                <div
                  key={t._id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{t.title}</span>
                    {t.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {t.type}
                      </span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(t._id)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Lead Follow-ups */}
              {inspectLeads.map((l) => (
                <div
                  key={l._id}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-amber-900 block flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-700" />
                      Client Follow-up: {l.fullName}
                    </span>
                    <p className="text-xs text-amber-800/80 mt-0.5">
                      Company: {l.companyName || 'N/A'} • {l.phone}
                    </p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 mt-2">
                      Status: {l.leadStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
