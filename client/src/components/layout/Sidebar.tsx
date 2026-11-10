import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Contact, GraduationCap, Building2, Handshake, GitBranch,
  CheckSquare, Calendar, Mail, LifeBuoy, BarChart3, UsersRound, Settings,
  LogOut, Shield, Leaf
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/formatters';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const PROJECT_MODULES = [
  { num: '1', title: 'Student Management', to: '/contacts', icon: GraduationCap },
  { num: '2', title: 'Lead Management', to: '/leads', icon: Users },
  { num: '3', title: 'Admissions Pipeline', to: '/pipeline', icon: GitBranch },
  { num: '4', title: 'Follow-up & Tasks', to: '/tasks', icon: CheckSquare },
  { num: '5', title: 'Student Support', to: '/tickets', icon: LifeBuoy },
  { num: '6', title: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
  { num: '7', title: 'User & Role Mgmt', to: '/team', icon: UsersRound },
];

const SECONDARY_LINKS = [
  { title: 'Deals & Quotations', to: '/deals', icon: Handshake },
  { title: 'Calendar Schedule', to: '/calendar', icon: Calendar },
  { title: 'Inbox & Mail', to: '/email', icon: Mail },
  { title: 'System Settings', to: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-xs z-40 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-[#013A2B] text-warm-ivory border-r border-[#426557]/30 z-50 flex flex-col transition-all duration-300 select-none shadow-xl',
          collapsed ? 'w-[76px]' : 'w-64',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className={cn('flex items-center h-18 px-5 border-b border-[#426557]/40 bg-[#0C2D26]/60', collapsed ? 'justify-center' : 'justify-between')}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-warm-ivory text-forest flex items-center justify-center font-black shadow-md">
              <Leaf className="w-4 h-4 fill-forest" />
            </div>
            {!collapsed && (
              <div>
                <span className="text-base font-black tracking-tight text-warm-ivory uppercase">
                  CRM<span className="text-[#a3b899]">HUB</span>
                </span>
                <span className="block text-[9px] font-bold text-warm-ivory/60 tracking-wider uppercase">Enterprise Edition</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
          {/* Main Dashboard Link */}
          <div>
            <NavLink
              to="/"
              end
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-[#0C2D26] text-warm-ivory border border-[#426557] shadow-sm'
                    : 'text-warm-ivory/80 hover:bg-[#0C2D26]/70 hover:text-warm-ivory'
                )
              }
            >
              <LayoutDashboard className="w-4 h-4 text-warm-ivory" />
              {!collapsed && <span>Executive Dashboard</span>}
            </NavLink>
          </div>

          {/* Core 7 Modules */}
          <div>
            {!collapsed && (
              <p className="px-3.5 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-warm-ivory/50">
                Core Modules (1 to 7)
              </p>
            )}
            <div className="space-y-1">
              {PROJECT_MODULES.map((m) => (
                <NavLink
                  key={m.num}
                  to={m.to}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
                      collapsed && 'justify-center px-2',
                      isActive
                        ? 'bg-[#0C2D26] text-warm-ivory font-bold border border-[#426557] shadow-xs'
                        : 'text-warm-ivory/70 hover:text-warm-ivory hover:bg-[#0C2D26]/50'
                    )
                  }
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0',
                      'bg-[#0C2D26] text-warm-ivory/90 group-hover:bg-[#426557]'
                    )}
                  >
                    {m.num}
                  </span>
                  {!collapsed && <span className="truncate">{m.title}</span>}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Secondary Links */}
          <div>
            {!collapsed && (
              <p className="px-3.5 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-warm-ivory/50">
                Tools & Workspaces
              </p>
            )}
            <div className="space-y-0.5">
              {SECONDARY_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition text-warm-ivory/60 hover:text-warm-ivory hover:bg-[#0C2D26]/40',
                      collapsed && 'justify-center px-2',
                      isActive && 'text-warm-ivory font-bold bg-[#0C2D26] border border-[#426557]/60'
                    )
                  }
                >
                  <item.icon className="w-3.5 h-3.5 text-warm-ivory/50" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer User Info */}
        <div className="border-t border-[#426557]/40 p-3 bg-[#0C2D26]/80 flex items-center justify-between">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-warm-ivory text-forest flex items-center justify-center font-black text-xs shadow-xs">
                  {user ? getInitials(user.name) : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-warm-ivory truncate leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-warm-ivory/60 truncate leading-tight">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-warm-ivory/60 hover:text-red-400 hover:bg-black/20 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={logout}
              className="w-8 h-8 mx-auto rounded-full bg-warm-ivory text-forest flex items-center justify-center font-black text-xs"
            >
              {user ? getInitials(user.name) : 'U'}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
