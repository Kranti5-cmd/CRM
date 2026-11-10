import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  Settings as SettingsIcon,
  Users,
  LogOut,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  GraduationCap,
  Building2,
  Handshake,
  LifeBuoy,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/formatters';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const pageTitles: Record<string, string> = {
  '/': 'Executive Dashboard',
  '/leads': 'Lead Management',
  '/contacts': 'Student Management',
  '/companies': 'Company Accounts',
  '/deals': 'Deals & Quotations',
  '/pipeline': 'Student Admissions & Pipeline',
  '/tasks': 'Follow-up & Task Management',
  '/calendar': 'Schedule & Calendar',
  '/tickets': 'Student Support',
  '/email': 'Inbox & Communications',
  '/reports': 'Reports & Analytics',
  '/team': 'User & Role Management',
  '/settings': 'System Settings',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    students: any[];
    leads: any[];
    deals: any[];
    tickets: any[];
    companies: any[];
  }>({ students: [], leads: [], deals: [], tickets: [], companies: [] });
  const [searchLoading, setSearchLoading] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const title = pageTitles[location.pathname] || 'CRM Hub';

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=10');
      const data = res.data.data || res.data.notifications || [];
      setNotifications(Array.isArray(data) ? data : []);
      const countRes = await api.get('/notifications/unread-count');
      setUnreadCount(countRes.data.count || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Global Ctrl + K keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced real-time search across all 5 models
  useEffect(() => {
    const q = globalSearch.trim();
    if (q.length < 2) {
      setSearchResults({ students: [], leads: [], deals: [], tickets: [], companies: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setSearchResults(res.data.data || { students: [], leads: [], deals: [], tickets: [], companies: [] });
        setSearchOpen(true);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [globalSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      try {
        await api.put('/notifications/mark-all-read');
        setUnreadCount(0);
        setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
        toast.success('All notifications marked as read');
      } catch {
        toast.error('Failed to mark all as read');
      }
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n._id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        try {
          await api.put(`/notifications/${n._id}/read`);
          setNotifications((prev) =>
            prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
          );
          setUnreadCount((c) => Math.max(0, c - 1));
        } catch {}
      }
    }
    setNotifOpen(false);

    if (n.relatedModel === 'Lead') {
      navigate('/leads');
    } else if (n.relatedModel === 'Deal') {
      navigate('/deals');
    } else if (n.relatedModel === 'Task') {
      navigate('/tasks');
    } else if (n.relatedModel === 'Ticket') {
      navigate('/tickets');
    } else {
      navigate('/contacts');
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'conversion':
      case 'deal_update':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'task_overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'follow_up':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#013A2B]" />;
    }
  };

  const handleGlobalSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/leads?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <header className="shrink-0 w-full z-30 bg-[#FBF8F1] border-b border-[#426557]/20">
      <div className="flex items-center justify-between h-18 px-4 lg:px-8">
        {/* Left: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-forest hover:bg-forest/10 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sage">
              <span>CRM</span>
              <span className="text-gray-300">/</span>
              <span className="text-forest font-black">Workspace</span>
            </div>
            <h1 className="text-lg font-black text-forest tracking-tight leading-none mt-0.5">
              {title}
            </h1>
          </div>
        </div>

        {/* Center: Search with Live Palette & Ctrl + K */}
        <div className="hidden md:flex items-center flex-1 max-w-lg mx-8" ref={searchContainerRef}>
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => {
                if (globalSearch.trim().length >= 2) setSearchOpen(true);
              }}
              onKeyDown={handleGlobalSearchKeyDown}
              placeholder="Search students, leads, courses, tickets (Ctrl + K)..."
              className="w-full pl-10 pr-16 py-2 bg-[#F8F5EE] focus:bg-white text-xs font-semibold rounded-xl border border-sage/30 focus:border-forest text-charcoal outline-none transition-all placeholder:text-sage/70 shadow-2xs"
            />
            {globalSearch ? (
              <button
                onClick={() => {
                  setGlobalSearch('');
                  setSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 rounded border border-gray-200 pointer-events-none">
                Ctrl K
              </kbd>
            )}

            {/* Instant Live Search Results Dropdown */}
            {searchOpen && globalSearch.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[480px] overflow-y-auto animate-in fade-in zoom-in-95">
                {searchLoading ? (
                  <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#013A2B]" />
                    <span>Searching Arshith Boot Camp...</span>
                  </div>
                ) : searchResults.students.length === 0 &&
                  searchResults.leads.length === 0 &&
                  searchResults.deals.length === 0 &&
                  searchResults.tickets.length === 0 &&
                  searchResults.companies.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 px-4">
                    No matching students, leads, or records found for "{globalSearch}"
                  </div>
                ) : (
                  <div className="py-2 divide-y divide-gray-100">
                    {/* 1. Students / Contacts */}
                    {searchResults.students.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Students ({searchResults.students.length})</span>
                        </div>
                        {searchResults.students.map((s) => (
                          <div
                            key={s._id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/contacts');
                            }}
                            className="px-3 py-2 rounded-xl hover:bg-emerald-50/70 transition flex items-center justify-between cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 truncate">
                                {s.firstName} {s.lastName}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">{s.email} Â· {s.phone || 'No phone'}</p>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                              {s.position || 'Student'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. Leads */}
                    {searchResults.leads.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#013A2B] flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>Student Inquiries & Leads ({searchResults.leads.length})</span>
                        </div>
                        {searchResults.leads.map((l) => (
                          <div
                            key={l._id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/leads');
                            }}
                            className="px-3 py-2 rounded-xl hover:bg-gray-50 transition flex items-center justify-between cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-[#013A2B] truncate">
                                {l.fullName}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">{l.email} Â· {l.courseName || 'General Track'}</p>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                              {l.registrationStatus || 'Inquiry'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. Course Enrollments / Deals */}
                    {searchResults.deals.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                          <Handshake className="w-3.5 h-3.5" />
                          <span>Course Enrollments ({searchResults.deals.length})</span>
                        </div>
                        {searchResults.deals.map((d) => (
                          <div
                            key={d._id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/deals');
                            }}
                            className="px-3 py-2 rounded-xl hover:bg-amber-50/50 transition flex items-center justify-between cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-amber-900 truncate">
                                {d.title}
                              </p>
                              <p className="text-[11px] text-gray-500">Stage: {d.stage}</p>
                            </div>
                            <span className="text-xs font-black text-emerald-700 shrink-0">
                              {d.value > 0 ? `₹${d.value}` : 'Free Track'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. Support Tickets */}
                    {searchResults.tickets.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                          <LifeBuoy className="w-3.5 h-3.5" />
                          <span>Support Tickets ({searchResults.tickets.length})</span>
                        </div>
                        {searchResults.tickets.map((t) => (
                          <div
                            key={t._id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/tickets');
                            }}
                            className="px-3 py-2 rounded-xl hover:bg-rose-50/50 transition flex items-center justify-between cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-rose-900 truncate">
                                <span className="font-mono text-gray-500 mr-1.5">[{t.ticketNumber}]</span>
                                {t.subject}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">{t.customerName} ({t.customerEmail})</p>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 shrink-0">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 5. Partner Companies */}
                    {searchResults.companies.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Hiring Partners ({searchResults.companies.length})</span>
                        </div>
                        {searchResults.companies.map((c) => (
                          <div
                            key={c._id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/companies');
                            }}
                            className="px-3 py-2 rounded-xl hover:bg-purple-50/50 transition flex items-center justify-between cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-purple-900 truncate">
                                {c.name}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">{c.industry} Â· Size: {c.size || 'Tech'}</p>
                            </div>
                            <span className="text-[10px] text-purple-700 font-semibold shrink-0">
                              View Partner â
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
                if (!notifOpen) fetchNotifications();
              }}
              className="relative p-2.5 rounded-xl border border-sage/30 bg-[#FBF8F1] text-forest hover:bg-forest/5 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/90 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Activity Feed
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[#013A2B] hover:underline font-bold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-xs text-gray-400">
                      No notifications right now
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-gray-50/80 ${
                          n.isRead ? 'bg-white opacity-80' : 'bg-emerald-50/20'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs font-bold leading-tight truncate ${
                                n.isRead ? 'text-gray-700' : 'text-gray-900'
                              }`}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                            {n.message}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl border-l border-sage/30 hover:bg-forest/5 cursor-pointer transition-colors"
              title="User menu"
            >
              <div className="w-9 h-9 rounded-xl bg-forest text-warm-ivory flex items-center justify-center font-black text-xs shadow-xs">
                {user ? getInitials(user.name) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-black text-forest leading-tight">
                  {user?.name}
                </span>
                <span className="block text-[10px] font-bold text-sage uppercase tracking-wider leading-tight">
                  {user?.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-sage hidden sm:block ml-0.5" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95">
                {/* Header info */}
                <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                  <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
                    {user?.role}
                  </span>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer text-left"
                  >
                    <SettingsIcon className="w-4 h-4 text-gray-400" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/team');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer text-left"
                  >
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Team Management</span>
                  </button>
                </div>

                {/* Sign Out */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
