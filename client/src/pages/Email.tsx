import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Play,
  Pause,
  Plus,
  Eye,
  Download,
  Users,
  RefreshCw,
  BarChart2,
  ShieldCheck,
  FileText,
  ArrowRight,
  Filter,
  X,
  ExternalLink,
  Calendar,
  Sparkles,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

// --- Type Definitions ---
interface DashboardStats {
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalFailed: number;
    totalPending: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    activeAutomations: number;
    totalWorkflows: number;
    totalCampaigns: number;
    totalSubscribers: number;
  };
  dailyActivity: {
    date: string;
    rawDate: string;
    sent: number;
    delivered: number;
    failed: number;
  }[];
  recentCampaigns: any[];
}

interface Workflow {
  _id: string;
  name: string;
  description: string;
  triggerEvent: string;
  delayHours: number;
  segment: string;
  isActive: boolean;
  conditions: {
    requireConsent: boolean;
    minDaysSinceRegistration: number;
    paymentStatus: string;
    courseName: string;
  };
  template: {
    _id: string;
    name: string;
    subject: string;
    category?: string;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  lastTriggeredAt?: string;
}

interface Template {
  _id: string;
  name: string;
  subject: string;
  category: string;
  htmlContent?: string;
  htmlBody?: string;
  textBody?: string;
  variables: string[];
  isActive: boolean;
}

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  segment: string;
  status: 'Draft' | 'Scheduled' | 'In Progress' | 'Sent' | 'Cancelled';
  scheduledAt?: string;
  sentAt?: string;
  template: {
    _id: string;
    name: string;
    subject: string;
  };
  stats: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  createdAt: string;
}

interface Subscriber {
  _id: string;
  email: string;
  name: string;
  phone: string;
  lists: string[];
  hasConsent: boolean;
  isUnsubscribed: boolean;
  createdAt: string;
  lead?: {
    courseName?: string;
    leadStatus?: string;
    paymentStatus?: string;
  };
}

interface EmailLog {
  _id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: string;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt: string;
  deliveredAt?: string;
  workflow?: { name: string; triggerEvent: string };
  campaign?: { name: string };
  template?: { name: string };
}

export default function Email() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workflows' | 'templates' | 'campaigns' | 'contacts' | 'reports'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [listCounts, setListCounts] = useState<Record<string, number>>({});
  const [dailyReport, setDailyReport] = useState<any>(null);

  // Filter & search states
  const [subscriberSegment, setSubscriberSegment] = useState<string>('All');
  const [contactSearch, setContactSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('All');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('All');

  // Modals
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [testEmailModal, setTestEmailModal] = useState<{ open: boolean; templateId: string; templateName: string }>({
    open: false,
    templateId: '',
    templateName: '',
  });
  const [testEmailAddress, setTestEmailAddress] = useState('student@example.com');
  const [sendingTest, setSendingTest] = useState(false);

  const [triggerModal, setTriggerModal] = useState<{ open: boolean; workflow: Workflow | null }>({
    open: false,
    workflow: null,
  });
  const [triggerEmail, setTriggerEmail] = useState('');
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(false);

  const [newCampaignModal, setNewCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    template: '',
    segment: 'Arshith Boot Camp Students',
    scheduledAt: '',
  });
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const [newWorkflowModal, setNewWorkflowModal] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    triggerEvent: 'student_registered',
    template: '',
    segment: 'Arshith Boot Camp Students',
    delayHours: 0,
    requireConsent: true,
  });
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);

  // Workflow Details & Execution History Modal
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    workflow: Workflow | null;
    executions: any[];
    loading: boolean;
  }>({
    open: false,
    workflow: null,
    executions: [],
    loading: false,
  });

  // Edit Workflow Modal
  const [editModal, setEditModal] = useState<{
    open: boolean;
    workflow: Workflow | null;
    form: {
      name: string;
      description: string;
      triggerEvent: string;
      delayHours: number;
      template: string;
      segment: string;
    };
  }>({
    open: false,
    workflow: null,
    form: {
      name: '',
      description: '',
      triggerEvent: '',
      delayHours: 0,
      template: '',
      segment: 'Arshith Boot Camp Students',
    },
  });

  // Fetch all core automation data
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsRes, wfRes, tmplRes, campRes, subRes, logsRes, repRes] = await Promise.all([
        api.get('/email-automation/dashboard-stats'),
        api.get('/email-automation/workflows'),
        api.get('/email-automation/templates'),
        api.get('/email-automation/campaigns'),
        api.get('/email-automation/subscribers?limit=50'),
        api.get('/email-automation/logs?limit=50'),
        api.get('/email-automation/reports/daily'),
      ]);

      if (statsRes.data?.data) setStats(statsRes.data.data);
      if (wfRes.data?.data) setWorkflows(wfRes.data.data);
      if (tmplRes.data?.data) setTemplates(tmplRes.data.data);
      if (campRes.data?.data) setCampaigns(campRes.data.data);
      if (subRes.data?.data) {
        setSubscribers(subRes.data.data);
        if (subRes.data.listCounts) setListCounts(subRes.data.listCounts);
      }
      if (logsRes.data?.data) setLogs(logsRes.data.data);
      if (repRes.data) setDailyReport(repRes.data);
    } catch (err: any) {
      console.error('Failed to load email automation data', err);
      toast.error('Failed to synchronize email automation system');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Workflow Toggle (Active / Inactive)
  const handleToggleWorkflow = async (id: string, currentStatus: boolean) => {
    try {
      const res = await api.patch(`/email-automation/workflows/${id}/toggle`);
      if (res.data?.data) {
        setWorkflows((prev) =>
          prev.map((w) => (w._id === id ? { ...w, isActive: res.data.data.isActive } : w))
        );
        toast.success(`Workflow ${res.data.data.isActive ? 'activated' : 'paused'}`);
        fetchData(true);
      }
    } catch {
      toast.error('Failed to update workflow status');
    }
  };

  // Handle Workflow Details & Execution History View
  const handleViewWorkflowDetails = async (wf: Workflow) => {
    setDetailModal({ open: true, workflow: wf, executions: [], loading: true });
    try {
      const res = await api.get(`/email-automation/workflows/${wf._id}/details`);
      if (res.data?.data) {
        setDetailModal({
          open: true,
          workflow: res.data.data.workflow || wf,
          executions: res.data.data.executions || [],
          loading: false,
        });
      }
    } catch {
      setDetailModal((prev) => ({ ...prev, loading: false }));
      toast.error('Failed to load workflow execution details');
    }
  };

  // Open Edit Workflow Modal
  const handleOpenEditWorkflow = (wf: Workflow) => {
    setEditModal({
      open: true,
      workflow: wf,
      form: {
        name: wf.name,
        description: wf.description || '',
        triggerEvent: wf.triggerEvent,
        delayHours: wf.delayHours || 0,
        template: wf.template?._id || '',
        segment: wf.segment || 'Arshith Boot Camp Students',
      },
    });
  };

  // Save Edit Workflow
  const handleSaveEditWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.workflow) return;
    try {
      const res = await api.put(`/email-automation/workflows/${editModal.workflow._id}`, editModal.form);
      if (res.data?.data) {
        toast.success('Workflow updated successfully!');
        setEditModal({
          open: false,
          workflow: null,
          form: { name: '', description: '', triggerEvent: '', delayHours: 0, template: '', segment: 'Arshith Boot Camp Students' },
        });
        fetchData(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update workflow');
    }
  };

  // Trigger single recipient workflow
  const handleRunWorkflowTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerModal.workflow || !triggerEmail.trim()) return;
    setTriggeringWorkflow(true);
    try {
      const res = await api.post(`/email-automation/workflows/${triggerModal.workflow._id}/trigger`, {
        email: triggerEmail.trim(),
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Workflow executed successfully!');
        setTriggerModal({ open: false, workflow: null });
        setTriggerEmail('');
        fetchData(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to trigger workflow');
    } finally {
      setTriggeringWorkflow(false);
    }
  };

  // Send Test Email for Template
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim() || !testEmailModal.templateId) return;
    setSendingTest(true);
    try {
      const res = await api.post('/email-automation/templates/test-email', {
        templateId: testEmailModal.templateId,
        toEmail: testEmailAddress.trim(),
      });
      if (res.data?.success) {
        toast.success(`Test email sent to ${testEmailAddress}!`);
        setTestEmailModal({ open: false, templateId: '', templateName: '' });
        fetchData(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.template) {
      toast.error('Please fill in campaign name, subject, and select a template');
      return;
    }
    setCreatingCampaign(true);
    try {
      const res = await api.post('/email-automation/campaigns', campaignForm);
      if (res.data?.data) {
        toast.success('Campaign created successfully!');
        setNewCampaignModal(false);
        setCampaignForm({
          name: '',
          subject: '',
          template: '',
          segment: 'Arshith Boot Camp Students',
          scheduledAt: '',
        });
        fetchData(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCreatingCampaign(false);
    }
  };

  // Send Campaign Now
  const handleSendCampaignNow = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign to all recipients in the segment now?')) return;
    const toastId = toast.loading('Dispatching campaign through ArshithBrevo engine...');
    try {
      const res = await api.post(`/email-automation/campaigns/${campaignId}/send`);
      toast.success(res.data?.message || 'Campaign sent successfully!', { id: toastId });
      fetchData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send campaign', { id: toastId });
    }
  };

  // Create Custom Workflow
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowForm.name || !workflowForm.template) {
      toast.error('Name and Template are required');
      return;
    }
    setCreatingWorkflow(true);
    try {
      const res = await api.post('/email-automation/workflows', {
        name: workflowForm.name,
        description: workflowForm.description,
        triggerEvent: workflowForm.triggerEvent,
        template: workflowForm.template,
        segment: workflowForm.segment,
        delayHours: Number(workflowForm.delayHours),
        conditions: {
          requireConsent: workflowForm.requireConsent,
        },
      });
      if (res.data?.data) {
        toast.success('Workflow created successfully!');
        setNewWorkflowModal(false);
        setWorkflowForm({
          name: '',
          description: '',
          triggerEvent: 'student_registered',
          template: '',
          segment: 'Arshith Boot Camp Students',
          delayHours: 0,
          requireConsent: true,
        });
        fetchData(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create workflow');
    } finally {
      setCreatingWorkflow(false);
    }
  };

  // Toggle Subscriber Consent / Unsubscribe
  const handleToggleConsent = async (id: string) => {
    try {
      const res = await api.patch(`/email-automation/subscribers/${id}/toggle-consent`);
      if (res.data?.data) {
        toast.success(
          res.data.data.isUnsubscribed ? 'Contact marked as Unsubscribed' : 'Contact resubscribed with consent'
        );
        fetchData(true);
      }
    } catch {
      toast.error('Failed to update contact consent');
    }
  };

  // Download CSV Report
  const handleDownloadCSV = () => {
    window.open('/api/email-automation/reports/export-csv', '_blank');
  };

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((s) => {
    const matchSegment = subscriberSegment === 'All' || s.lists.includes(subscriberSegment);
    const matchSearch =
      !contactSearch ||
      s.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      s.phone.includes(contactSearch);
    return matchSegment && matchSearch;
  });

  // Filtered logs
  const filteredLogs = logs.filter((l) => {
    if (logStatusFilter === 'All') return true;
    return l.status === logStatusFilter;
  });

  // Filtered templates
  const filteredTemplates = templates.filter((t) => {
    if (templateCategoryFilter === 'All') return true;
    return t.category === templateCategoryFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-[#426557]">Connecting to ArshithBrevo & Email Automation Engine...</p>
      </div>
    );
  }

  const summary = stats?.summary || {
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalFailed: 0,
    totalPending: 0,
    deliveryRate: 100,
    openRate: 0,
    clickRate: 0,
    activeAutomations: 10,
    totalWorkflows: 10,
    totalCampaigns: 1,
    totalSubscribers: 117,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#013A2B] text-[#FBF8F1] flex items-center justify-center shadow-md shrink-0">
              <Mail className="w-7 h-7 text-[#FBF8F1]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#013A2B]">Arshith Boot Camp Email Automation</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" /> ArshithBrevo Connected
                </span>
              </div>
              <p className="text-sm text-[#426557] mt-1">
                Centralized student lifecycle workflows, transactional Brevo delivery, automated daily reports, and marketing campaigns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Sync Engine
            </button>
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => setNewCampaignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#013A2B] text-[#FBF8F1] hover:bg-[#0C2D26] shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#426557]/15 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: BarChart2 },
            { id: 'workflows', label: `Automations (${workflows.length})`, icon: Zap },
            { id: 'templates', label: `Templates (${templates.length})`, icon: FileText },
            { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: Send },
            { id: 'contacts', label: `Audiences (${summary.totalSubscribers})`, icon: Users },
            { id: 'reports', label: 'Daily Reports & Logs', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  active
                    ? 'bg-[#013A2B] text-[#FBF8F1] shadow-sm'
                    : 'text-[#426557] hover:text-[#013A2B] hover:bg-[#F8F5EE]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Emails Sent"
              value={summary.totalSent}
              icon={Send}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-50"
            />
            <StatCard
              title="Delivery Rate"
              value={`${summary.deliveryRate}%`}
              icon={CheckCircle2}
              iconColor="text-teal-700"
              iconBg="bg-teal-50"
            />
            <StatCard
              title="Open Rate"
              value={`${summary.openRate}%`}
              icon={Eye}
              iconColor="text-blue-700"
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Click Rate"
              value={`${summary.clickRate}%`}
              icon={Sparkles}
              iconColor="text-purple-700"
              iconBg="bg-purple-50"
            />
            <StatCard
              title="Failed / Bounced"
              value={summary.totalFailed}
              icon={AlertCircle}
              iconColor="text-red-700"
              iconBg="bg-red-50"
            />
            <StatCard
              title="Pending In Queue"
              value={summary.totalPending}
              icon={Clock}
              iconColor="text-amber-700"
              iconBg="bg-amber-50"
            />
            <StatCard
              title="Active Workflows"
              value={`${summary.activeAutomations} / ${summary.totalWorkflows}`}
              icon={Zap}
              iconColor="text-emerald-800"
              iconBg="bg-emerald-100"
            />
            <StatCard
              title="Total Audience"
              value={summary.totalSubscribers}
              icon={Users}
              iconColor="text-stone-800"
              iconBg="bg-stone-100"
            />
          </div>

          {/* Daily Email Activity & Delivery Engine Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Bar Chart */}
            <div className="lg:col-span-2 bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#013A2B]">Daily Email Activity (Past 7 Days)</h3>
                  <p className="text-xs text-[#426557]">Volume of automated workflow and campaign emails dispatched</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#013A2B]" />
                    <span className="text-[#302B25] font-medium">Delivered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-400" />
                    <span className="text-[#302B25] font-medium">Failed</span>
                  </div>
                </div>
              </div>

              {/* Chart Visual */}
              <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-[#426557]/15">
                {stats?.dailyActivity && stats.dailyActivity.length > 0 ? (
                  stats.dailyActivity.map((day, idx) => {
                    const maxVal = Math.max(...stats.dailyActivity.map((d) => d.sent), 10);
                    const deliveredHeight = Math.min(100, Math.round((day.delivered / maxVal) * 100));
                    const failedHeight = Math.min(100, Math.round((day.failed / maxVal) * 100));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div className="relative w-full flex items-end justify-center gap-1">
                          {/* Delivered Bar */}
                          <div
                            style={{ height: `${Math.max(deliveredHeight, 6)}%` }}
                            className="w-full max-w-[28px] bg-[#013A2B] group-hover:bg-[#426557] rounded-t-md transition-all relative"
                          >
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0C2D26] text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 shadow">
                              {day.delivered} delivered
                            </div>
                          </div>
                          {/* Failed Bar (if any) */}
                          {day.failed > 0 && (
                            <div
                              style={{ height: `${Math.max(failedHeight, 6)}%` }}
                              className="w-full max-w-[12px] bg-red-400 rounded-t-md relative"
                            >
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-red-800 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 shadow">
                                {day.failed} failed
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-[#426557] mt-3 group-hover:text-[#013A2B]">
                          {day.date}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#426557]">
                    No email activity recorded in the last 7 days.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-[#426557] mt-3">
                <span>Real-time Brevo Transactional Gateway</span>
                <span>Idempotency deduplication active</span>
              </div>
            </div>

            {/* Brevo & Daily Report Status Card */}
            <div className="bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#013A2B]">ArshithBrevo Platform</h4>
                    <p className="text-[11px] text-[#426557]">Centralized Backend Engine (Port 5001)</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F5EE] border border-[#426557]/10">
                    <span className="text-[#302B25] font-medium">Provider Service</span>
                    <span className="font-semibold text-emerald-700">Brevo API v3 (REST)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F5EE] border border-[#426557]/10">
                    <span className="text-[#302B25] font-medium">Daily Report Recipient</span>
                    <span className="font-semibold text-[#013A2B]">{dailyReport?.reportTarget || 'arshithgroup141@gmail.com'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F5EE] border border-[#426557]/10">
                    <span className="text-[#302B25] font-medium">Daily Report Dispatch</span>
                    <span className="font-semibold text-[#013A2B]">09:30 AM IST (Daily)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F5EE] border border-[#426557]/10">
                    <span className="text-[#302B25] font-medium">Live Supabase Sync</span>
                    <span className="font-semibold text-emerald-700">117 CodeLekho Students</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#426557]/15 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('workflows')}
                  className="text-xs font-bold text-[#013A2B] hover:text-[#426557] flex items-center gap-1"
                >
                  Configure Workflows <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-xs font-bold text-[#426557] hover:text-[#013A2B]"
                >
                  View Delivery Logs
                </button>
              </div>
            </div>
          </div>

          {/* Quick Workflow Grid (Top 4 Active) */}
          <div className="bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#013A2B]">Core Student Lifecycle Automations</h3>
                <p className="text-xs text-[#426557]">Event-driven triggers executing automatically when students register or progress</p>
              </div>
              <button
                onClick={() => setActiveTab('workflows')}
                className="text-xs font-bold text-[#013A2B] hover:underline"
              >
                View All 10 Workflows →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflows.slice(0, 4).map((wf) => (
                <div
                  key={wf._id}
                  className="p-4 rounded-xl bg-[#F8F5EE] border border-[#426557]/15 hover:border-[#426557] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#013A2B]/10 text-[#013A2B]">
                        {wf.triggerEvent.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${wf.isActive ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-400'}`}
                      />
                    </div>
                    <h4 className="text-sm font-bold text-[#013A2B] line-clamp-1">{wf.name}</h4>
                    <p className="text-xs text-[#426557] mt-1 line-clamp-2">
                      {wf.description || `Sends "${wf.template?.name}" automatically upon trigger.`}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#426557]/10 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#426557]">
                      {wf.delayHours === 0 ? 'Instant send' : `Wait ${wf.delayHours}h`}
                    </span>
                    <button
                      onClick={() => setTriggerModal({ open: true, workflow: wf })}
                      className="text-xs font-bold text-[#013A2B] hover:text-[#426557] flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUTOMATION WORKFLOW BUILDER (10 WORKFLOWS) */}
      {/* ========================================================================= */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#013A2B]">Automated Student Email Workflows</h2>
              <p className="text-xs text-[#426557]">
                Visual event triggers, conditions, delays, and dynamic template dispatch for Arshith Boot Camp students.
              </p>
            </div>
            <button
              onClick={() => setNewWorkflowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#013A2B] text-[#FBF8F1] hover:bg-[#0C2D26] shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Custom Workflow
            </button>
          </div>

          {/* Workflow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf, idx) => (
              <div
                key={wf._id}
                className="bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl p-5 shadow-sm hover:border-[#426557] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#013A2B] text-[#FBF8F1] font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-[#013A2B]">{wf.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold text-[#426557] bg-[#F8F5EE] px-2 py-0.5 rounded border border-[#426557]/15">
                            Trigger: {wf.triggerEvent}
                          </span>
                          <span className="text-[10px] font-semibold text-[#426557] bg-[#F8F5EE] px-2 py-0.5 rounded border border-[#426557]/15">
                            {wf.delayHours === 0 ? 'Immediate' : `${wf.delayHours} Hours Delay`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleWorkflow(wf._id, wf.isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        wf.isActive ? 'bg-[#013A2B]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          wf.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-[#302B25] mt-3">{wf.description}</p>

                  {/* Flow Diagram Mini-Step */}
                  <div className="mt-4 p-3 rounded-xl bg-[#F8F5EE] border border-[#426557]/10 flex items-center gap-2 text-[11px] text-[#426557] overflow-x-auto no-scrollbar">
                    <span className="font-semibold text-[#013A2B] bg-white px-2 py-1 rounded shadow-2xs shrink-0">
                      ⚡ {wf.triggerEvent}
                    </span>
                    <ArrowRight className="w-3 h-3 shrink-0 text-[#426557]/50" />
                    <span className="bg-white px-2 py-1 rounded shadow-2xs shrink-0">
                      🔒 Check Consent
                    </span>
                    <ArrowRight className="w-3 h-3 shrink-0 text-[#426557]/50" />
                    <span className="bg-white px-2 py-1 rounded shadow-2xs shrink-0 font-medium text-emerald-800">
                      ✉️ {wf.template?.name || 'Assigned Template'}
                    </span>
                    <ArrowRight className="w-3 h-3 shrink-0 text-[#426557]/50" />
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded shrink-0">
                      🚀 Brevo API
                    </span>
                  </div>

                  {/* Conditions & Target Segment */}
                  <div className="mt-3 flex items-center justify-between text-xs text-[#426557] flex-wrap gap-2">
                    <div>
                      Audience: <strong className="text-[#013A2B]">{wf.segment}</strong>
                    </div>
                    <div>
                      Duplicates: <strong className="text-emerald-700">Protected (Idempotency)</strong>
                    </div>
                  </div>

                  {/* Execution Timing & Detailed Counts */}
                  <div className="mt-3 p-3 rounded-xl bg-[#F8F5EE] border border-[#426557]/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#426557] block text-[10px]">Total Sent</span>
                      <strong className="text-[#013A2B] font-bold text-xs">{wf.stats?.sent || 0}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block text-[10px]">Success</span>
                      <strong className="text-emerald-700 font-bold text-xs">{wf.stats?.delivered || 0}</strong>
                    </div>
                    <div>
                      <span className="text-red-600 block text-[10px]">Failed</span>
                      <strong className="text-red-600 font-bold text-xs">{wf.stats?.failed || 0}</strong>
                    </div>
                    <div>
                      <span className="text-[#426557] block text-[10px]">Last Run</span>
                      <strong className="text-[#013A2B] text-[10px] truncate block">
                        {wf.lastTriggeredAt
                          ? new Date(wf.lastTriggeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'Not run yet'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-[#426557]/15 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleViewWorkflowDetails(wf)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#426557]/30 text-xs font-semibold text-[#013A2B] hover:bg-[#F8F5EE]"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details & Logs
                    </button>
                    <button
                      onClick={() => handleOpenEditWorkflow(wf)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#426557]/30 text-xs font-semibold text-[#013A2B] hover:bg-[#F8F5EE]"
                    >
                      Configure Trigger
                    </button>
                  </div>

                  <button
                    onClick={() => setTriggerModal({ open: true, workflow: wf })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#013A2B] text-white font-bold text-xs hover:bg-[#0C2D26] shadow-2xs"
                  >
                    <Play className="w-3 h-3" /> Test Run
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMAIL TEMPLATES */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#013A2B]">Boot Camp Email Templates</h2>
              <p className="text-xs text-[#426557]">
                HTML emails designed with responsive styling and dynamic variable insertion.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#426557] font-medium">Category:</span>
              <select
                value={templateCategoryFilter}
                onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                className="text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] px-3 py-1.5 text-[#013A2B] font-semibold"
              >
                <option value="All">All Categories</option>
                <option value="Welcome">Welcome</option>
                <option value="Registration">Registration</option>
                <option value="Course Info">Course Info</option>
                <option value="Payment">Payment</option>
                <option value="Reminder">Reminder</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Completion">Completion</option>
                <option value="Feedback">Feedback</option>
              </select>
            </div>
          </div>

          {/* Template Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl._id}
                className="bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl p-5 shadow-sm hover:border-[#426557] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {tmpl.category || 'General'}
                    </span>
                    <span className="text-[11px] text-[#426557]">HTML Ready</span>
                  </div>

                  <h3 className="text-sm font-bold text-[#013A2B]">{tmpl.name}</h3>
                  <p className="text-xs text-[#426557] mt-1 line-clamp-1">
                    Subject: <span className="font-medium text-[#302B25]">{tmpl.subject}</span>
                  </p>

                  {/* Variables supported */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-[#426557] uppercase">Dynamic Variables:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tmpl.variables && tmpl.variables.length > 0 ? (
                        tmpl.variables.map((v) => (
                          <span
                            key={v}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F8F5EE] border border-[#426557]/15 text-[#013A2B]"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#426557]/15 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewTemplate(tmpl)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#013A2B] hover:text-[#426557]"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview HTML
                  </button>

                  <button
                    onClick={() =>
                      setTestEmailModal({
                        open: true,
                        templateId: tmpl._id,
                        templateName: tmpl.name,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#426557]/30 text-xs font-bold text-[#013A2B] hover:bg-[#F8F5EE]"
                  >
                    <Send className="w-3 h-3" /> Send Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CAMPAIGNS */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#013A2B]">Email Broadcast Campaigns</h2>
              <p className="text-xs text-[#426557]">
                Send immediate announcements, cohort schedules, or promotional emails to targeted student segments.
              </p>
            </div>
            <button
              onClick={() => setNewCampaignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#013A2B] text-[#FBF8F1] hover:bg-[#0C2D26] shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </button>
          </div>

          {/* Campaigns Table */}
          <div className="bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F5EE] border-b border-[#426557]/15 text-[#426557] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Campaign Name</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Segment</th>
                    <th className="py-3.5 px-4">Template</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Delivered</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#426557]/10">
                  {campaigns.length > 0 ? (
                    campaigns.map((camp) => (
                      <tr key={camp._id} className="hover:bg-[#F8F5EE]/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#013A2B]">{camp.name}</td>
                        <td className="py-3.5 px-4 text-[#302B25] max-w-xs truncate">{camp.subject}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#426557]/10 text-[#013A2B]">
                            {camp.segment}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#426557] font-medium">{camp.template?.name || 'Default'}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              camp.status === 'Sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : camp.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#013A2B]">
                          {camp.stats?.delivered || 0} / {camp.stats?.totalRecipients || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {camp.status !== 'Sent' && (
                            <button
                              onClick={() => handleSendCampaignNow(camp._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#013A2B] text-white text-xs font-bold hover:bg-[#0C2D26]"
                            >
                              <Send className="w-3 h-3" /> Send Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#426557]">
                        No campaigns found. Click "New Campaign" to launch an email broadcast.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIENCES & CONTACTS (7 LISTS) */}
      {/* ========================================================================= */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#013A2B]">Contact Segments & Marketing Consent</h2>
              <p className="text-xs text-[#426557]">
                Live synchronization with 117 CodeLekho students and CRM lead records. Respects unsubscribe preferences.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, or phone..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              />
            </div>
          </div>

          {/* 7 Segment Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              'All',
              'Arshith Boot Camp Students',
              'New Registrations',
              'Interested Leads',
              'Converted Students',
              'Pending Payments',
              'Course Completed Students',
              'Marketing Subscribers',
            ].map((seg) => {
              const active = subscriberSegment === seg;
              const count = listCounts[seg] ?? (seg === 'All' ? summary.totalSubscribers : 0);
              return (
                <button
                  key={seg}
                  onClick={() => setSubscriberSegment(seg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#013A2B] text-[#FBF8F1] shadow-2xs'
                      : 'bg-[#FBF8F1] text-[#426557] border border-[#426557]/20 hover:border-[#426557]'
                  }`}
                >
                  <span>{seg}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active ? 'bg-white/20 text-white' : 'bg-[#426557]/15 text-[#013A2B]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Contacts Table */}
          <div className="bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F5EE] border-b border-[#426557]/15 text-[#426557] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Student Contact</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Course Enrolled</th>
                    <th className="py-3.5 px-4">Lists</th>
                    <th className="py-3.5 px-4">Consent Status</th>
                    <th className="py-3.5 px-4 text-right">Opt-in Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#426557]/10">
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map((sub) => (
                      <tr key={sub._id} className="hover:bg-[#F8F5EE]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#013A2B]">{sub.name || 'Student'}</p>
                          <p className="text-[11px] text-[#426557] font-mono">{sub.email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#302B25]">{sub.phone || '—'}</td>
                        <td className="py-3.5 px-4 font-medium text-[#013A2B]">
                          {sub.lead?.courseName || 'Python Programming'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {sub.lists.map((l) => (
                              <span
                                key={l}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#426557]/10 text-[#013A2B]"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {sub.isUnsubscribed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              <X className="w-3 h-3" /> Unsubscribed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" /> Subscribed (Consented)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleConsent(sub._id)}
                            className="text-xs font-bold text-[#426557] hover:text-[#013A2B] underline"
                          >
                            {sub.isUnsubscribed ? 'Resubscribe' : 'Unsubscribe'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#426557]">
                        No contacts match the selected segment or search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REPORTS & DELIVERY LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Daily Report Summary Card */}
          <div className="bg-[#013A2B] text-[#FBF8F1] rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Daily Report Active
                  </span>
                  <span className="text-xs text-white/70">Scheduled daily @ {dailyReport?.scheduledTime || '09:30'} AM IST</span>
                </div>
                <h3 className="text-xl font-bold mt-2">Srinu Daily Automation Dispatch</h3>
                <p className="text-xs text-white/70 mt-1">
                  Recipient: <strong className="text-white">{dailyReport?.reportTarget || 'arshithgroup141@gmail.com'}</strong>. Captures total sent, delivered, registrations, and follow-ups.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-[#0C2D26] p-4 rounded-xl border border-white/10">
                <div className="text-center">
                  <p className="text-[11px] text-white/70">Sent Today</p>
                  <p className="text-xl font-bold">{dailyReport?.data?.sentToday || 0}</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-[11px] text-white/70">Delivered</p>
                  <p className="text-xl font-bold text-emerald-400">{dailyReport?.data?.deliveredToday || 0}</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-[11px] text-white/70">New Leads</p>
                  <p className="text-xl font-bold text-teal-300">{dailyReport?.data?.newRegistrationsToday || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Logs Table */}
          <div className="bg-[#FBF8F1] border border-[#426557]/20 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#013A2B]">Email Activity & Delivery Logs</h3>
                <p className="text-xs text-[#426557]">Comprehensive audit trail with provider message IDs and timestamps</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#426557] font-medium">Status:</span>
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] px-3 py-1.5 text-[#013A2B] font-semibold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Sent">Sent</option>
                  <option value="Opened">Opened</option>
                  <option value="Clicked">Clicked</option>
                  <option value="Failed">Failed</option>
                  <option value="Bounced">Bounced</option>
                </select>
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#426557]/30 text-xs font-bold text-[#013A2B] hover:bg-[#F8F5EE]"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F5EE] border-b border-[#426557]/15 text-[#426557] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Recipient</th>
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Trigger Source</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Provider ID</th>
                    <th className="py-3 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#426557]/10">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((l) => (
                      <tr key={l._id} className="hover:bg-[#F8F5EE]/50 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#013A2B]">{l.recipientName || 'Student'}</p>
                          <p className="text-[11px] text-[#426557] font-mono">{l.recipientEmail}</p>
                        </td>
                        <td className="py-3 px-3 text-[#302B25] max-w-xs truncate font-medium">{l.subject}</td>
                        <td className="py-3 px-3 text-[#426557]">
                          {l.workflow ? `Flow: ${l.workflow.name}` : (l.campaign ? `Campaign: ${l.campaign.name}` : 'Transactional')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.status === 'Sent'
                                ? 'bg-teal-100 text-teal-800'
                                : l.status === 'Opened'
                                ? 'bg-blue-100 text-blue-800'
                                : l.status === 'Clicked'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-500">{l.providerMessageId || '—'}</td>
                        <td className="py-3 px-3 text-right text-[11px] text-[#426557]">
                          {new Date(l.sentAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#426557]">
                        No logs found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW TEMPLATE HTML */}
      {/* ========================================================================= */}
      {previewTemplate && (
        <Modal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={`HTML Preview: ${previewTemplate.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#F8F5EE] border border-[#426557]/15 text-xs text-[#426557]">
              <p>
                <strong>Subject:</strong> {previewTemplate.subject}
              </p>
              <p className="mt-1">
                <strong>Available Placeholders:</strong>{' '}
                {previewTemplate.variables?.map((v) => `{{${v}}}`).join(', ')}
              </p>
            </div>

            <div className="border border-[#426557]/20 rounded-xl overflow-hidden bg-white max-h-[500px] overflow-y-auto p-4">
              <div
                dangerouslySetInnerHTML={{
                  __html: (previewTemplate.htmlContent || previewTemplate.htmlBody || '')
                    .replace(/\{\{\s*student_name\s*\}\}/g, 'Rahul Sharma')
                    .replace(/\{\{\s*course_name\s*\}\}/g, 'Python Programming')
                    .replace(/\{\{\s*student_email\s*\}\}/g, 'rahul.sharma@example.com')
                    .replace(/\{\{\s*registration_date\s*\}\}/g, 'Nov 7, 2026')
                    .replace(/\{\{\s*payment_status\s*\}\}/g, 'Confirmed')
                    .replace(/\{\{\s*course_start_date\s*\}\}/g, 'Monday at 10:00 AM IST'),
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEND TEST EMAIL */}
      {/* ========================================================================= */}
      {testEmailModal.open && (
        <Modal
          isOpen={testEmailModal.open}
          onClose={() => setTestEmailModal({ open: false, templateId: '', templateName: '' })}
          title={`Send Test: ${testEmailModal.templateName}`}
          size="md"
        >
          <form onSubmit={handleSendTestEmail} className="space-y-4">
            <p className="text-xs text-[#426557]">
              Send a simulated live test through the Brevo engine to verify styling, typography, and variable replacement.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Recipient Test Email</label>
              <input
                type="email"
                required
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setTestEmailModal({ open: false, templateId: '', templateName: '' })}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingTest}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#013A2B] text-white hover:bg-[#0C2D26]"
              >
                {sendingTest ? <LoadingSpinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
                Send Test Email
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRIGGER WORKFLOW FOR STUDENT */}
      {/* ========================================================================= */}
      {triggerModal.open && triggerModal.workflow && (
        <Modal
          isOpen={triggerModal.open}
          onClose={() => setTriggerModal({ open: false, workflow: null })}
          title={`Execute Workflow: ${triggerModal.workflow.name}`}
          size="md"
        >
          <form onSubmit={handleRunWorkflowTrigger} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#F8F5EE] border border-[#426557]/15 text-xs text-[#426557]">
              <p>
                <strong>Trigger Event:</strong> {triggerModal.workflow.triggerEvent}
              </p>
              <p>
                <strong>Template:</strong> {triggerModal.workflow.template?.name}
              </p>
              <p>
                <strong>Duplicate Protection:</strong> Enabled (Idempotency ensures no duplicate sends).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Student / Lead Email Address</label>
              <input
                type="email"
                required
                value={triggerEmail}
                onChange={(e) => setTriggerEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              />
              <p className="text-[11px] text-[#426557] mt-1">
                Enter an existing student email from CRM (or a test email) to dispatch this lifecycle flow.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setTriggerModal({ open: false, workflow: null })}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={triggeringWorkflow}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#013A2B] text-white hover:bg-[#0C2D26]"
              >
                {triggeringWorkflow ? <LoadingSpinner size="sm" /> : <Play className="w-3.5 h-3.5" />}
                Execute Flow
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CAMPAIGN */}
      {/* ========================================================================= */}
      {newCampaignModal && (
        <Modal
          isOpen={newCampaignModal}
          onClose={() => setNewCampaignModal(false)}
          title="Create New Email Campaign"
          size="md"
        >
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Campaign Name</label>
              <input
                type="text"
                required
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="e.g. November Cohort Admission Open"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Subject Line</label>
              <input
                type="text"
                required
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                placeholder="e.g. Special Tech Announcement from Arshith Boot Camp"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Select Email Template</label>
              <select
                required
                value={campaignForm.template}
                onChange={(e) => setCampaignForm({ ...campaignForm, template: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Target Audience Segment</label>
              <select
                value={campaignForm.segment}
                onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              >
                <option value="Arshith Boot Camp Students">Arshith Boot Camp Students</option>
                <option value="New Registrations">New Registrations</option>
                <option value="Interested Leads">Interested Leads</option>
                <option value="Converted Students">Converted Students</option>
                <option value="Pending Payments">Pending Payments</option>
                <option value="Course Completed Students">Course Completed Students</option>
                <option value="Marketing Subscribers">Marketing Subscribers</option>
                <option value="All Students">All Students</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setNewCampaignModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingCampaign}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#013A2B] text-white hover:bg-[#0C2D26]"
              >
                {creatingCampaign ? <LoadingSpinner size="sm" /> : <Plus className="w-3.5 h-3.5" />}
                Create Campaign
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE WORKFLOW */}
      {/* ========================================================================= */}
      {newWorkflowModal && (
        <Modal
          isOpen={newWorkflowModal}
          onClose={() => setNewWorkflowModal(false)}
          title="Create Automation Workflow"
          size="md"
        >
          <form onSubmit={handleCreateWorkflow} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Workflow Name</label>
              <input
                type="text"
                required
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                placeholder="e.g. VIP Student Welcome Journey"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Trigger Event</label>
              <select
                value={workflowForm.triggerEvent}
                onChange={(e) => setWorkflowForm({ ...workflowForm, triggerEvent: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              >
                <option value="student_registered">Student Registered</option>
                <option value="registration_confirmed">Registration Confirmed</option>
                <option value="course_enrolled">Course Enrolled</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="payment_completed">Payment Completed</option>
                <option value="course_starting_soon">Course Starting Soon</option>
                <option value="counselor_followup_needed">Counselor Follow-up Needed</option>
                <option value="student_inactive_7d">Student Inactive (7 Days)</option>
                <option value="course_completed">Course Completed</option>
                <option value="feedback_request">Feedback Request</option>
                <option value="manual_trigger">Manual Trigger</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Email Template</label>
              <select
                required
                value={workflowForm.template}
                onChange={(e) => setWorkflowForm({ ...workflowForm, template: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#013A2B] mb-1">Delay (Hours)</label>
                <input
                  type="number"
                  min="0"
                  value={workflowForm.delayHours}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, delayHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#013A2B] mb-1">Audience Segment</label>
                <select
                  value={workflowForm.segment}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, segment: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
                >
                  <option value="Arshith Boot Camp Students">Arshith Boot Camp Students</option>
                  <option value="New Registrations">New Registrations</option>
                  <option value="Interested Leads">Interested Leads</option>
                  <option value="Converted Students">Converted Students</option>
                  <option value="Pending Payments">Pending Payments</option>
                  <option value="Course Completed Students">Course Completed Students</option>
                  <option value="Marketing Subscribers">Marketing Subscribers</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="consentCheck"
                checked={workflowForm.requireConsent}
                onChange={(e) => setWorkflowForm({ ...workflowForm, requireConsent: e.target.checked })}
                className="rounded border-[#426557]/30 text-[#013A2B] focus:ring-[#013A2B]"
              />
              <label htmlFor="consentCheck" className="text-xs text-[#302B25] font-medium">
                Enforce marketing consent and unsubscribe preference check
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setNewWorkflowModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingWorkflow}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#013A2B] text-white hover:bg-[#0C2D26]"
              >
                {creatingWorkflow ? <LoadingSpinner size="sm" /> : <Plus className="w-3.5 h-3.5" />}
                Save Workflow
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: WORKFLOW DETAILS & EXECUTION HISTORY */}
      {/* ========================================================================= */}
      {detailModal.open && detailModal.workflow && (
        <Modal
          isOpen={detailModal.open}
          onClose={() => setDetailModal({ open: false, workflow: null, executions: [], loading: false })}
          title={`Workflow Details: ${detailModal.workflow.name}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Header info banner */}
            <div className="p-4 rounded-xl bg-[#F8F5EE] border border-[#426557]/15">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#013A2B]/10 text-[#013A2B]">
                    {detailModal.workflow.triggerEvent}
                  </span>
                  <p className="text-xs text-[#302B25] mt-2 font-medium">{detailModal.workflow.description}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    detailModal.workflow.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {detailModal.workflow.isActive ? 'Active Engine' : 'Paused'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#426557]/10 text-xs">
                <div>
                  <span className="text-[10px] text-[#426557] block">Delay</span>
                  <strong className="text-[#013A2B]">
                    {detailModal.workflow.delayHours === 0 ? 'Immediate Send' : `${detailModal.workflow.delayHours} Hours`}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#426557] block">Audience Segment</span>
                  <strong className="text-[#013A2B] truncate block">{detailModal.workflow.segment}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#426557] block">Emails Sent</span>
                  <strong className="text-[#013A2B]">{detailModal.workflow.stats?.sent || 0}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#426557] block">Delivered</span>
                  <strong className="text-emerald-700">{detailModal.workflow.stats?.delivered || 0}</strong>
                </div>
              </div>
            </div>

            {/* Execution History Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#013A2B] uppercase tracking-wider">
                  Recent Executions & Audit Trail
                </h4>
                <span className="text-[11px] text-[#426557]">
                  {detailModal.executions.length} recorded events
                </span>
              </div>

              {detailModal.loading ? (
                <div className="p-8 text-center"><LoadingSpinner size="md" /></div>
              ) : detailModal.executions.length > 0 ? (
                <div className="border border-[#426557]/20 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F5EE] border-b border-[#426557]/15 text-[#426557] font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Recipient</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Attempt</th>
                        <th className="py-2.5 px-3">Idempotency Key</th>
                        <th className="py-2.5 px-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#426557]/10">
                      {detailModal.executions.map((ex: any) => (
                        <tr key={ex._id} className="hover:bg-[#F8F5EE]/40">
                          <td className="py-2 px-3 font-medium text-[#013A2B]">
                            {ex.recipientName || 'Student'}
                            <span className="block text-[10px] text-[#426557] font-mono">{ex.recipientEmail}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ex.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ex.status === 'Sent'
                                  ? 'bg-teal-100 text-teal-800'
                                  : ex.status === 'Skipped_Consent' || ex.status === 'Skipped_Duplicate'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {ex.status}
                            </span>
                            {ex.failureReason && (
                              <span className="block text-[9px] text-gray-500 max-w-xs truncate" title={ex.failureReason}>
                                {ex.failureReason}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[#426557]">{ex.attemptCount || 1}</td>
                          <td className="py-2 px-3 font-mono text-[10px] text-[#426557] max-w-[140px] truncate" title={ex.idempotencyKey}>
                            {ex.idempotencyKey}
                          </td>
                          <td className="py-2 px-3 text-right text-[10px] text-[#426557]">
                            {new Date(ex.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#426557] bg-[#F8F5EE] rounded-xl border border-[#426557]/10">
                  No execution records yet for this workflow. Use "Test Run" to trigger.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#426557]/15">
              <button
                onClick={() => setDetailModal({ open: false, workflow: null, executions: [], loading: false })}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE]"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT WORKFLOW CONFIGURATION */}
      {/* ========================================================================= */}
      {editModal.open && editModal.workflow && (
        <Modal
          isOpen={editModal.open}
          onClose={() =>
            setEditModal({
              open: false,
              workflow: null,
              form: { name: '', description: '', triggerEvent: '', delayHours: 0, template: '', segment: 'Arshith Boot Camp Students' },
            })
          }
          title={`Configure Workflow: ${editModal.workflow.name}`}
          size="md"
        >
          <form onSubmit={handleSaveEditWorkflow} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Workflow Name</label>
              <input
                type="text"
                required
                value={editModal.form.name}
                onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, name: e.target.value } })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Trigger Event</label>
              <select
                value={editModal.form.triggerEvent}
                onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, triggerEvent: e.target.value } })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              >
                <option value="student_registered">Student Registered</option>
                <option value="registration_confirmed">Registration Confirmed</option>
                <option value="course_enrolled">Course Enrolled</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="payment_completed">Payment Completed</option>
                <option value="course_starting_soon">Course Starting Soon</option>
                <option value="counselor_followup_needed">Counselor Follow-up Needed</option>
                <option value="student_inactive_7d">Student Inactive (7 Days)</option>
                <option value="course_completed">Course Completed</option>
                <option value="feedback_request">Feedback Request</option>
                <option value="manual_trigger">Manual Trigger</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Assigned Email Template</label>
              <select
                required
                value={editModal.form.template}
                onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, template: e.target.value } })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#013A2B] mb-1">Delay (Hours)</label>
                <input
                  type="number"
                  min="0"
                  value={editModal.form.delayHours}
                  onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, delayHours: Number(e.target.value) } })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#013A2B] mb-1">Target Segment</label>
                <select
                  value={editModal.form.segment}
                  onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, segment: e.target.value } })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
                >
                  <option value="Arshith Boot Camp Students">Arshith Boot Camp Students</option>
                  <option value="New Registrations">New Registrations</option>
                  <option value="Interested Leads">Interested Leads</option>
                  <option value="Converted Students">Converted Students</option>
                  <option value="Pending Payments">Pending Payments</option>
                  <option value="Course Completed Students">Course Completed Students</option>
                  <option value="Marketing Subscribers">Marketing Subscribers</option>
                  <option value="All Students">All Students</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#013A2B] mb-1">Description</label>
              <textarea
                rows={2}
                value={editModal.form.description}
                onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, description: e.target.value } })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#426557]/30 bg-[#FBF8F1] focus:outline-none focus:border-[#013A2B]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#426557]/15">
              <button
                type="button"
                onClick={() =>
                  setEditModal({
                    open: false,
                    workflow: null,
                    form: { name: '', description: '', triggerEvent: '', delayHours: 0, template: '', segment: '' },
                  })
                }
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#426557]/30 text-[#013A2B] hover:bg-[#F8F5EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#013A2B] text-white hover:bg-[#0C2D26]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
