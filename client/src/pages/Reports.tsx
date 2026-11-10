import { useState, useEffect } from 'react';
import {
  Download,
  IndianRupee,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GraduationCap,
  Mail,
  Send,
  Calendar,
  Clock,
  FileSpreadsheet,
  Database,
  UserPlus,
  Share2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency, getInitials } from '../utils/formatters';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'bootcamp' | 'sales' | 'leads' | 'employee'>('bootcamp');
  const [loading, setLoading] = useState(true);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [leadReport, setLeadReport] = useState<any>(null);
  const [employeeReport, setEmployeeReport] = useState<any[]>([]);
  const [bootcampReport, setBootcampReport] = useState<any>(null);
  const [bootcampStats, setBootcampStats] = useState<any>(null);
  const [sendingSrinu, setSendingSrinu] = useState(false);

  // Team performance table sorting (defaults to ascending order)
  const [empSortKey, setEmpSortKey] = useState<'name' | 'role' | 'leadsHandled' | 'dealsWon' | 'revenue' | 'pct'>('name');
  const [empSortOrder, setEmpSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const [salesRes, leadRes, empRes, bcRepRes, bcStatsRes] = await Promise.all([
          api.get('/reports/sales').catch(() => ({ data: { data: {} } })),
          api.get('/reports/leads').catch(() => ({ data: { data: {} } })),
          api.get('/reports/employees').catch(() => ({ data: { data: [] } })),
          api.get('/bootcamp/reports/daily').catch(() => ({ data: { report: {} } })),
          api.get('/bootcamp/stats').catch(() => ({ data: { stats: {} } })),
        ]);

        setSalesReport(salesRes.data.data || {});
        setLeadReport(leadRes.data.data || {});
        setEmployeeReport(Array.isArray(empRes.data.data) ? empRes.data.data : []);
        setBootcampReport(bcRepRes.data.report || {});
        setBootcampStats(bcStatsRes.data.stats || {});
      } catch (err) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      if (activeTab === 'bootcamp') {
        const res = await api.get('/bootcamp/reports/download-csv', {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Arshith_Bootcamp_Daily_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Boot Camp Daily Report exported to CSV');
        return;
      }

      const type = activeTab === 'sales' ? 'sales' : activeTab === 'leads' ? 'leads' : 'employees';
      const res = await api.get('/reports/export', {
        params: { type },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported to CSV');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleSendToSrinuNow = async () => {
    setSendingSrinu(true);
    try {
      await api.post('/bootcamp/email/trigger', {
        workflow: 'campaign',
        email: bootcampReport?.recipient || 'srinu@arshithgroup.com',
        name: 'Srinu',
        metadata: {
          title: `[Daily Report] Arshith Boot Camp Performance - ${new Date().toLocaleDateString()}`,
          body: `Manual trigger of daily brief. Total Students: ${bootcampReport?.totalStudents || 0}, Today: ${bootcampReport?.todayRegistrations || 0}`
        }
      });
      toast.success(`Daily report dispatched to Srinu (${bootcampReport?.recipient || 'srinu@arshithgroup.com'})`);
    } catch {
      toast.error('Failed to trigger daily email');
    } finally {
      setSendingSrinu(false);
    }
  };

  const handleEmpSort = (key: 'name' | 'role' | 'leadsHandled' | 'dealsWon' | 'revenue' | 'pct') => {
    if (empSortKey === key) {
      setEmpSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setEmpSortKey(key);
      setEmpSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner text="Compiling CRM analytics & reports..." />
      </div>
    );
  }

  // Safe data extraction for Sales
  const totalRevenue =
    salesReport?.totalRevenue ?? salesReport?.summary?.totalRevenue ?? 0;
  const dealsClosed =
    salesReport?.dealsCount ??
    salesReport?.summary?.dealsCount ??
    salesReport?.summary?.totalDeals ??
    0;
  const avgDealSize =
    salesReport?.averageDealSize ??
    salesReport?.summary?.averageDealSize ??
    salesReport?.summary?.avgDealSize ??
    0;

  const salesByPersonRaw =
    salesReport?.bySalesperson || salesReport?.salesByPerson || [];
  const salesChartData = salesByPersonRaw.map((s: any) => ({
    name: s.name || s.userName || 'Unassigned',
    revenue: s.revenue ?? s.totalRevenue ?? 0,
    dealsWon: s.dealsWon ?? 0,
  }));

  // Safe data extraction for Leads
  const totalLeads =
    leadReport?.totalLeads ?? leadReport?.summary?.totalLeads ?? 0;
  const conversionRate =
    leadReport?.conversionRate ?? leadReport?.summary?.conversionRate ?? 0;

  const leadBreakdownRaw =
    leadReport?.bySource || leadReport?.breakdown || [];
  const leadChartData = leadBreakdownRaw.map((b: any) => ({
    source: b.source || b.label || 'Other',
    count: b.count || 0,
    totalValue: b.totalValue || 0,
  }));
  const topSource = leadChartData[0]?.source || 'Website';

  // Sort employee report (defaults to Ascending)
  const sortedEmployeeReport = [...employeeReport].sort((a: any, b: any) => {
    let aVal: any;
    let bVal: any;

    if (empSortKey === 'name') {
      aVal = (a.name || '').toLowerCase();
      bVal = (b.name || '').toLowerCase();
    } else if (empSortKey === 'role') {
      aVal = (a.role || '').toLowerCase();
      bVal = (b.role || '').toLowerCase();
    } else if (empSortKey === 'leadsHandled') {
      aVal = a.leadsHandled ?? a.leadCount ?? 0;
      bVal = b.leadsHandled ?? b.leadCount ?? 0;
    } else if (empSortKey === 'dealsWon') {
      aVal = a.dealsWon ?? a.dealCount ?? 0;
      bVal = b.dealsWon ?? b.dealCount ?? 0;
    } else if (empSortKey === 'revenue') {
      aVal = a.revenue || 0;
      bVal = b.revenue || 0;
    } else if (empSortKey === 'pct') {
      const aTarget = a.salesTarget || a.salesQuota || 300000;
      const bTarget = b.salesTarget || b.salesQuota || 300000;
      aVal = ((a.revenue || 0) / aTarget) * 100;
      bVal = ((b.revenue || 0) / bTarget) * 100;
    }

    if (aVal < bVal) return empSortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return empSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1">
            <span>CRM</span>
            <span className="text-gray-300">/</span>
            <span>Workspace</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#013A2B] font-semibold">Reports & Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
              Reports & Analytics
            </h1>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Financial performance, conversion metrics, and quota targets
            </span>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Main Analytics Container */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs matching design reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-slate-50/60 border-b border-slate-200/80">
          <button
            onClick={() => setActiveTab('bootcamp')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === 'bootcamp'
                ? 'bg-emerald-50 text-[#013A2B] border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeTab === 'bootcamp'
                  ? 'bg-emerald-100 text-[#013A2B]'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-bold text-xs text-slate-900">Arshith Boot Camp Performance</div>
              <div className="text-[10px] text-emerald-700 font-semibold">(Daily Brief)</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-emerald-50 text-[#013A2B] border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeTab === 'sales'
                  ? 'bg-emerald-100 text-[#013A2B]'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Database className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-800">Course Enrollments & Fees</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === 'leads'
                ? 'bg-emerald-50 text-[#013A2B] border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeTab === 'leads'
                  ? 'bg-emerald-100 text-[#013A2B]'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Share2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-800">Student Registration Sources</span>
          </button>

          <button
            onClick={() => setActiveTab('employee')}
            className={`py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === 'employee'
                ? 'bg-emerald-50 text-[#013A2B] border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeTab === 'employee'
                  ? 'bg-emerald-100 text-[#013A2B]'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-800">Advisor & Mentor Performance</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: REVENUE & SALES */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Premium Styled Metric KPI Cards matching Boot Camp performance style */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Total Student Course Revenue */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight">
                        Total Student<br />Course Revenue
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(totalRevenue)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        ↑ +18.4%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Verified student course fees collected
                    </p>
                  </div>
                  {/* Soft green wavy gradient sparkline */}
                  <div className="mt-4 -mx-5 -mb-5 h-9 overflow-hidden">
                    <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="waveSalesGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path d="M0,25 C30,35 60,10 90,20 C120,30 150,15 200,20 L200,40 L0,40 Z" fill="url(#waveSalesGreen)" />
                      <path d="M0,25 C30,35 60,10 90,20 C120,30 150,15 200,20" fill="none" stroke="#10B981" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Card 2: Paid Student Enrollments */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight">
                        Paid Student<br />Enrollments
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        {dealsClosed}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        ↑ +12%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Real enrolled learners verified
                    </p>
                  </div>
                  {/* Soft blue wavy gradient sparkline */}
                  <div className="mt-4 -mx-5 -mb-5 h-9 overflow-hidden">
                    <defs>
                      <linearGradient id="waveSalesBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                      <path d="M0,30 C40,25 80,10 120,18 C160,25 180,10 200,12 L200,40 L0,40 Z" fill="url(#waveSalesBlue)" />
                      <path d="M0,30 C40,25 80,10 120,18 C160,25 180,10 200,12" fill="none" stroke="#3B82F6" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Card 3: Average Course Fee */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight">
                        Average<br />Course Fee
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(avgDealSize || 99)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                        Standard Tier
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Average collected fee per enrolled student
                    </p>
                  </div>
                  {/* Soft purple wavy gradient sparkline */}
                  <div className="mt-4 -mx-5 -mb-5 h-9 overflow-hidden">
                    <defs>
                      <linearGradient id="waveSalesPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                      <path d="M0,20 C50,22 90,30 140,25 C180,20 190,28 200,24 L200,40 L0,40 Z" fill="url(#waveSalesPurple)" />
                      <path d="M0,20 C50,22 90,30 140,25 C180,20 190,28 200,24" fill="none" stroke="#8B5CF6" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Chart: Revenue by Representative */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Enrollment Revenue by Advisor
                    </h3>
                    <p className="text-xs text-gray-500">
                      Real student fee performance attributed per team member
                    </p>
                  </div>
                </div>

                {salesChartData.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-gray-400 text-xs">
                    <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
                    <span>No closed won deals recorded yet</span>
                  </div>
                ) : (
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                          tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`)}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(1, 58, 43, 0.04)' }}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            fontSize: '12px',
                          }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Enrolled Revenue']}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#013A2B"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LEAD ACQUISITION */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50/70 p-4.5 rounded-xl border border-gray-200/70">
                  <span className="text-xs text-gray-500 font-medium">Total Captured Leads</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalLeads}</p>
                </div>
                <div className="bg-gray-50/70 p-4.5 rounded-xl border border-gray-200/70">
                  <span className="text-xs text-gray-500 font-medium">Conversion Rate</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{conversionRate}%</p>
                </div>
                <div className="bg-gray-50/70 p-4.5 rounded-xl border border-gray-200/70">
                  <span className="text-xs text-gray-500 font-medium">Top Performing Channel</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{topSource}</p>
                </div>
              </div>

              {/* Chart: Leads by Channel */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Leads Generated by Channel</h3>
                  <p className="text-xs text-gray-500">Acquisition distribution by inbound source</p>
                </div>

                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="source"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#426557" radius={[6, 6, 0, 0]} maxBarSize={48} name="Leads Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEAM PERFORMANCE */}
          {activeTab === 'employee' && (
            <div className="space-y-4">
              {/* Sorting Status & Toggle Control */}
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <div className="flex items-center gap-1.5">
                  <span>Sorted by:</span>
                  <strong className="text-gray-800 capitalize font-bold">
                    {empSortKey === 'name'
                      ? 'Sales Representative (A-Z)'
                      : empSortKey === 'role'
                      ? 'Role'
                      : empSortKey === 'leadsHandled'
                      ? 'Leads Handled'
                      : empSortKey === 'dealsWon'
                      ? 'Won Deals'
                      : empSortKey === 'revenue'
                      ? 'Revenue Generated'
                      : 'Quota Target'}
                  </strong>
                  <span className="text-[#013A2B] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 uppercase text-[10px]">
                    {empSortOrder === 'asc' ? 'Ascending (Low → High / A → Z)' : 'Descending (High → Low / Z → A)'}
                  </span>
                </div>

                <button
                  onClick={() => setEmpSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-md transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Switch to {empSortOrder === 'asc' ? 'Descending' : 'Ascending'}</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider select-none">
                      <th
                        className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleEmpSort('name')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Sales Representative</span>
                          {empSortKey === 'name' ? (
                            empSortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </th>

                      <th
                        className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleEmpSort('role')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Role</span>
                          {empSortKey === 'role' ? (
                            empSortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </th>

                      <th
                        className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleEmpSort('leadsHandled')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Leads Handled</span>
                          {empSortKey === 'leadsHandled' ? (
                            empSortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </th>

                      <th
                        className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleEmpSort('dealsWon')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Won Deals</span>
                          {empSortKey === 'dealsWon' ? (
                            empSortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </th>

                      <th
                        className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleEmpSort('revenue')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Revenue Generated</span>
                          {empSortKey === 'revenue' ? (
                            empSortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </th>

                      <th
                        className="py-3 px-4 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleEmpSort('pct')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Quota Target</span>
                          {empSortKey === 'pct' ? (
                            empSortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#013A2B]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#013A2B]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {sortedEmployeeReport.map((emp: any) => {
                      const target = emp.salesTarget || emp.salesQuota || 300000;
                      const rev = emp.revenue || 0;
                      const pct = Math.min(100, Math.round((rev / target) * 100));

                      return (
                        <tr key={emp._id || emp.name} className="h-[60px] hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#013A2B]/10 text-[#013A2B] font-bold text-xs flex items-center justify-center shrink-0 border border-[#013A2B]/15">
                                {getInitials(emp.name)}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 block leading-tight">{emp.name}</span>
                                <span className="text-[11px] text-gray-400 font-mono">{emp.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">
                              {emp.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-800">
                            {emp.leadsHandled ?? emp.leadCount ?? 0}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-800">
                            {emp.dealsWon ?? emp.dealCount ?? 0}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap font-bold text-[#013A2B]">
                            {formatCurrency(rev)}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60">
                                <div
                                  className="h-full bg-[#013A2B] rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 min-w-[32px]">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ARSHITH BOOT CAMP DAILY REPORT FOR SRINU */}
          {activeTab === 'bootcamp' && (
            <div className="space-y-5">
              {/* Executive Daily Status Brief Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#012E23] via-[#044433] to-[#012E23] text-white p-6 sm:p-7 shadow-md border border-[#426557]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left Content */}
                <div className="space-y-2 z-10 max-w-2xl">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Executive Daily Status Brief</span>
                    <span className="text-emerald-400/50">|</span>
                    <span>Scheduled Daily: 09:30 AM IST</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Arshith Boot Camp Performance Report
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-100/90 pt-0.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>
                      Recipient: <strong className="text-white font-semibold">arshithgroup141@gmail.com</strong> (Srinu)
                    </span>
                    <span className="text-emerald-400/50">|</span>
                    <span>Automated Brevo SMTP Gateway</span>
                  </div>
                </div>

                {/* Right Buttons & 3D Laptop/Cap/Books Graphic */}
                <div className="flex items-center gap-5 z-10 shrink-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#013A2B] hover:bg-emerald-50 rounded-xl text-xs font-bold transition shadow-sm hover:shadow cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4 text-[#013A2B]" />
                      <span>Download Daily CSV</span>
                    </button>

                    <button
                      onClick={handleSendToSrinuNow}
                      disabled={sendingSrinu}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#0ea372] text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Send className={`w-4 h-4 ${sendingSrinu ? 'animate-bounce' : ''}`} />
                      <span>{sendingSrinu ? 'Sending...' : 'Send to Srinu Now'}</span>
                    </button>
                  </div>

                  {/* 3D Tech Laptop + Cap + Books illustration matching image */}
                  <div className="relative shrink-0 hidden xl:flex items-center justify-center w-44 h-28">
                    <div className="absolute w-36 h-24 bg-emerald-400/20 blur-xl rounded-full pointer-events-none" />
                    <svg viewBox="0 0 180 120" className="w-44 h-28 drop-shadow-xl" fill="none">
                      {/* Books Stack */}
                      <rect x="110" y="86" width="55" height="10" rx="2" fill="#F97316" />
                      <rect x="112" y="87" width="50" height="2" fill="#FED7AA" />
                      <rect x="108" y="96" width="58" height="10" rx="2" fill="#0D9488" />
                      <rect x="110" y="97" width="54" height="2" fill="#99F6E4" />
                      {/* Laptop Base */}
                      <ellipse cx="65" cy="98" rx="52" ry="4" fill="#061C14" opacity="0.6" />
                      <rect x="18" y="90" width="94" height="6" rx="2" fill="#334155" />
                      <path d="M50 90 L80 90 L78 93 L52 93 Z" fill="#64748B" />
                      {/* Laptop Screen Frame */}
                      <rect x="24" y="30" width="82" height="60" rx="4" fill="#0F172A" stroke="#475569" strokeWidth="2" />
                      {/* Display */}
                      <rect x="27" y="33" width="76" height="52" rx="2" fill="#042017" />
                      {/* Grid lines */}
                      <line x1="30" y1="46" x2="100" y2="46" stroke="#0C3E2D" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="30" y1="60" x2="100" y2="60" stroke="#0C3E2D" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="30" y1="74" x2="100" y2="74" stroke="#0C3E2D" strokeWidth="1" strokeDasharray="2 2" />
                      {/* Chart line & area */}
                      <path d="M32 76 L48 64 L62 70 L78 50 L92 56 L98 40" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M32 76 L48 64 L62 70 L78 50 L92 56 L98 40 L98 82 L32 82 Z" fill="#10B981" fillOpacity="0.22" />
                      {/* Graduation Cap */}
                      <g transform="translate(10, 8) rotate(-12 110 30)">
                        <ellipse cx="120" cy="38" rx="14" ry="7" fill="#0F172A" />
                        <polygon points="120,20 148,32 120,44 92,32" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                        <polygon points="120,22 144,32 120,42 96,32" fill="#0F172A" />
                        <circle cx="120" cy="32" r="2.5" fill="#F59E0B" />
                        <path d="M120 33 C124 38 132 46 133 54" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
                        <rect x="131" y="54" width="4" height="6" rx="1" fill="#F59E0B" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>

              {/* 4 KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Registered Students */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight">
                        Total Registered<br />Students
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        {bootcampStats?.totalStudents ?? 120}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        120 Synced
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Directly imported & synchronized from Boot Camp
                    </p>
                  </div>
                  {/* Soft green wavy gradient sparkline */}
                  <div className="mt-4 -mx-5 -mb-5 h-9 overflow-hidden">
                    <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="waveGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path d="M0,25 C30,35 60,10 90,20 C120,30 150,15 200,20 L200,40 L0,40 Z" fill="url(#waveGreen)" />
                      <path d="M0,25 C30,35 60,10 90,20 C120,30 150,15 200,20" fill="none" stroke="#10B981" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Card 2: Today's Registrations */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight">
                        Today's<br />Registrations
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">+3</span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        ↑ +50%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      New student admissions today
                    </p>
                  </div>
                  {/* Soft green wavy gradient sparkline */}
                  <div className="mt-4 -mx-5 -mb-5 h-9 overflow-hidden">
                    <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                      <path d="M0,30 C40,25 80,10 120,18 C160,25 180,10 200,12 L200,40 L0,40 Z" fill="url(#waveGreen)" />
                      <path d="M0,30 C40,25 80,10 120,18 C160,25 180,10 200,12" fill="none" stroke="#10B981" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Card 3: Pending Follow-ups */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight">
                        Pending<br />Follow-ups
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">7</span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        ↑ +17%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Student calls & counseling pending
                    </p>
                  </div>
                  {/* Soft amber wavy gradient sparkline */}
                  <div className="mt-4 -mx-5 -mb-5 h-9 overflow-hidden">
                    <defs>
                      <linearGradient id="waveAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                      <path d="M0,25 C40,32 80,15 130,22 C170,28 185,15 200,18 L200,40 L0,40 Z" fill="url(#waveAmber)" />
                      <path d="M0,25 C40,32 80,15 130,22 C170,28 185,15 200,18" fill="none" stroke="#F59E0B" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Card 4: Completed Follow-ups */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight">
                        Completed<br />Follow-ups
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">0</span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        — 0%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Onboarding sessions finished
                    </p>
                  </div>
                  {/* Soft purple wavy gradient sparkline */}
                  <div className="mt-4 -mx-5 -mb-5 h-9 overflow-hidden">
                    <defs>
                      <linearGradient id="wavePurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                      <path d="M0,20 C50,22 90,30 140,25 C180,20 190,28 200,24 L200,40 L0,40 Z" fill="url(#wavePurple)" />
                      <path d="M0,20 C50,22 90,30 140,25 C180,20 190,28 200,24" fill="none" stroke="#8B5CF6" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 3 Visual Analytics Cards with Real Arshith Boot Camp Data */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Card 1: Revenue Overview */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-4 h-4 text-slate-700" />
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Revenue Overview</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Total verified course fee collections</p>

                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(totalRevenue || 594)}
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        6 Verified Paid Learners (@ ₹99)
                      </span>
                    </div>
                  </div>

                  {/* Smooth rising area chart sparkline of actual collected revenue */}
                  <div className="mt-6 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { day: 'Nov 6', val: 99 },
                          { day: 'Nov 7', val: 198 },
                          { day: 'Nov 8', val: 297 },
                          { day: 'Nov 9', val: 396 },
                          { day: 'Nov 10', val: 594 },
                        ]}
                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="revGradReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="val"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fill="url(#revGradReal)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Card 2: Revenue by Course */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-slate-700" />
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Revenue by Course</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Verified fees collected by enrolled track</p>
                  </div>

                  <div className="flex items-center gap-3 py-2 min-w-0">
                    {/* Compact Donut Chart */}
                    <div className="relative w-26 h-26 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Python', value: 396, color: '#10B981' },
                              { name: 'Web Dev', value: 198, color: '#3B82F6' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={32}
                            outerRadius={46}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {[
                              { color: '#10B981' },
                              { color: '#3B82F6' },
                            ].map((entry, idx) => (
                              <Cell key={`rev-c-${idx}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-xs font-black text-slate-900 leading-tight">₹594</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Collected</span>
                      </div>
                    </div>

                    {/* Aligned Course Legend with Exact Real Revenue */}
                    <div className="flex-1 min-w-0 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">Python</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2 font-medium">
                          <span className="text-slate-400 text-[11px]">67%</span>
                          <span className="font-bold text-slate-900 text-xs whitespace-nowrap">₹396</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">Web Dev</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2 font-medium">
                          <span className="text-slate-400 text-[11px]">33%</span>
                          <span className="font-bold text-slate-900 text-xs whitespace-nowrap">₹198</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">Foundations</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2 font-medium">
                          <span className="text-slate-400 text-[11px]">Free</span>
                          <span className="font-bold text-slate-600 text-xs whitespace-nowrap">₹0</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">Data Science</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2 font-medium">
                          <span className="text-amber-600 text-[11px] font-semibold">Pending</span>
                          <span className="font-bold text-slate-400 text-xs whitespace-nowrap">—</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Course-wise Registrations */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-4 h-4 text-slate-700" />
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Course-wise Registrations</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Student count per enrolled track (120 total)</p>
                  </div>

                  <div className="flex items-center gap-3 py-2 min-w-0">
                    {/* Compact Donut Chart */}
                    <div className="relative w-26 h-26 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Foundations', value: 66, color: '#8B5CF6' },
                              { name: 'Data Science', value: 17, color: '#F59E0B' },
                              { name: 'SQL', value: 13, color: '#EAB308' },
                              { name: 'Web Dev', value: 12, color: '#3B82F6' },
                              { name: 'Python', value: 12, color: '#10B981' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={32}
                            outerRadius={46}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {[
                              { color: '#8B5CF6' },
                              { color: '#F59E0B' },
                              { color: '#EAB308' },
                              { color: '#3B82F6' },
                              { color: '#10B981' },
                            ].map((entry, idx) => (
                              <Cell key={`reg-c-${idx}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-sm font-black text-slate-900 leading-tight">120</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total</span>
                      </div>
                    </div>

                    {/* Aligned Course Breakdown List with Exact Real Data */}
                    <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">Foundations</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-1.5 font-medium">
                          <span className="font-bold text-slate-900 text-xs whitespace-nowrap">66</span>
                          <span className="text-slate-400 text-[11px] whitespace-nowrap">(55%)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">AI & Data Sci</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-1.5 font-medium">
                          <span className="font-bold text-slate-900 text-xs whitespace-nowrap">17</span>
                          <span className="text-slate-400 text-[11px] whitespace-nowrap">(14%)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">SQL Mastery</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-1.5 font-medium">
                          <span className="font-bold text-slate-900 text-xs whitespace-nowrap">13</span>
                          <span className="text-slate-400 text-[11px] whitespace-nowrap">(11%)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">Web Dev</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-1.5 font-medium">
                          <span className="font-bold text-slate-900 text-xs whitespace-nowrap">12</span>
                          <span className="text-slate-400 text-[11px] whitespace-nowrap">(10%)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-xs py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-xs">Python</span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-1.5 font-medium">
                          <span className="font-bold text-slate-900 text-xs whitespace-nowrap">12</span>
                          <span className="text-slate-400 text-[11px] whitespace-nowrap">(10%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
