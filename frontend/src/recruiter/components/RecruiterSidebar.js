import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  PenTool,
  Layers,
  ListChecks,
  CalendarDays,
  MessageSquare,  
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import logoMark from '../../assets/logo-mark.png';

const sections = [
  [
    { path: 'dashboard', label: 'Dashboard', Icon: Home },
  ],
  [
    { path: 'post-job', label: 'Post Job', Icon: PenTool },
    { path: 'manage-jobs', label: 'Manage Jobs', Icon: Layers },
    { path: 'applications', label: 'Applications', Icon: ListChecks },
    { path: 'interviews', label: 'Interviews', Icon: CalendarDays },
    { path: 'messages', label: 'Messages', Icon: MessageSquare },
  ],
  [
    { path: 'company-profile', label: 'Company Profile', Icon: Building2 },
    { path: 'subscription', label: 'Subscription', Icon: CreditCard },
    { path: 'analytics', label: 'Analytics', Icon: BarChart3 },
    { path: 'settings', label: 'Settings', Icon: Settings },
  ],
];

export default function RecruiterSidebar({ currentUser, onLogout }) {
  return (
    <aside className="flex h-full w-[280px] flex-col bg-white dark:bg-slate-900 text-[#14181C] dark:text-slate-50 border-r border-[#14181C]/10 dark:border-white/10 shadow-[2px_0_20px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#14181C]/10 dark:border-white/10 px-6 py-6">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white border border-[#14181C]/10 shadow-sm">
            <img src={logoMark} alt="" className="h-full w-full object-contain p-1.5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#5B6660] dark:text-slate-400">VIP Jobseeker</p>
            <p className="font-display text-base font-semibold text-[#14181C] dark:text-slate-50">Recruiter portal</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#5B6660] dark:text-slate-400">A focused hiring workspace for candidate sourcing and job tracking.</p>
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 py-4">
        {sections.map((group, groupIndex) => (
          <div key={groupIndex} className={groupIndex > 0 ? 'border-t border-[#14181C]/10 dark:border-white/10 pt-4' : ''}>
            <div className="space-y-1">
              {group.map(({ path, label, Icon }) => (
                <NavLink
                  key={path}
                  to={`/recruiter/${path}`}
                  className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#0E7C66] text-white shadow-[0_0_0_1px_rgba(14,124,102,0.12)]'
                      : 'text-[#5B6660] dark:text-slate-300 hover:bg-[#F5F6F3] dark:hover:bg-slate-700 hover:text-[#14181C] dark:hover:text-slate-50'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                        isActive ? 'bg-white/15 text-white' : 'bg-[#F5F6F3] dark:bg-slate-700 text-[#5B6660] dark:text-slate-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#14181C]/10 dark:border-white/10 px-6 py-5">
        <div className="rounded-2xl bg-[#F5F6F3] dark:bg-slate-800 p-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#94A0AA] dark:text-slate-500">Signed in as</p>
          <p className="mt-3 truncate text-sm font-semibold text-[#14181C] dark:text-slate-50">{currentUser?.email || currentUser?.username || 'Recruiter'}</p>
          <p className="mt-1 text-xs text-[#5B6660] dark:text-slate-400">Recruiter account</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0E7C66] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0B6553]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
