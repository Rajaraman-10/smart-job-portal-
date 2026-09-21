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
  {
    label: null,
    items: [{ path: 'dashboard', label: 'Dashboard', Icon: Home }],
  },
  {
    label: 'Hiring',
    items: [
      { path: 'post-job', label: 'Post a job', Icon: PenTool },
      { path: 'manage-jobs', label: 'Manage jobs', Icon: Layers },
      { path: 'applications', label: 'Applications', Icon: ListChecks },
      { path: 'interviews', label: 'Interviews', Icon: CalendarDays },
      { path: 'messages', label: 'Messages', Icon: MessageSquare },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: 'company-profile', label: 'Company profile', Icon: Building2 },
      { path: 'subscription', label: 'Subscription', Icon: CreditCard },
      { path: 'analytics', label: 'Analytics', Icon: BarChart3 },
      { path: 'settings', label: 'Settings', Icon: Settings },
    ],
  },
];

export default function RecruiterSidebar({ currentUser, onLogout }) {
  const initials = (currentUser?.email || currentUser?.username || 'R')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <aside className="flex h-full w-[272px] flex-col bg-white dark:bg-slate-900 text-[#14181C] dark:text-slate-50 border-r border-[#14181C]/10 dark:border-white/10">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F5F6F3] dark:bg-slate-800">
          <img src={logoMark} alt="" className="h-full w-full object-contain p-1" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight text-[#14181C] dark:text-slate-50">
            VIP Jobseeker
          </p>
          <p className="truncate text-[13px] leading-tight text-[#5B6660] dark:text-slate-400">
            Recruiter portal
          </p>
        </div>
      </div>

      <div className="mx-6 border-t border-[#14181C]/8 dark:border-white/10" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="mb-2 px-3 text-[11px] font-medium text-[#94A0AA] dark:text-slate-500">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ path, label, Icon }) => (
                <NavLink
                  key={path}
                  to={`/recruiter/${path}`}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[#0E7C66]/8 text-[#0E7C66] dark:bg-[#0E7C66]/15 dark:text-emerald-300'
                        : 'text-[#5B6660] hover:bg-[#F5F6F3] hover:text-[#14181C] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#0E7C66]" />
                      )}
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          isActive ? 'text-[#0E7C66] dark:text-emerald-300' : 'text-[#94A0AA] dark:text-slate-500'
                        }`}
                        strokeWidth={2}
                      />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Account footer */}
      <div className="border-t border-[#14181C]/8 dark:border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0E7C66] text-[13px] font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#14181C] dark:text-slate-50">
              {currentUser?.email || currentUser?.username || 'Recruiter'}
            </p>
            <p className="truncate text-[12px] text-[#5B6660] dark:text-slate-400">Recruiter account</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#5B6660] transition-colors hover:bg-[#F5F6F3] hover:text-[#14181C] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}