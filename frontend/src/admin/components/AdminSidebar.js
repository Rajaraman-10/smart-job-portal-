import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Users, Building2, Briefcase, ScrollText, LogOut } from 'lucide-react';

const links = [
  { path: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: 'applications', label: 'Applications', Icon: ListChecks },
  { path: 'jobs', label: 'Jobs', Icon: Briefcase },
  { path: 'users', label: 'Users', Icon: Users },
  { path: 'companies', label: 'Companies', Icon: Building2 },
  { path: 'audit-log', label: 'Audit Log', Icon: ScrollText },
];

export default function AdminSidebar({ currentUser, onLogout }) {
  return (
    <aside className="flex h-full w-[260px] flex-col bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_20px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 dark:bg-slate-100 text-lg font-semibold uppercase tracking-[0.2em] text-white dark:text-slate-900 shadow-sm shadow-slate-950/10">
            A
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Vipseekers</p>
            <p className="text-base font-semibold text-slate-950 dark:text-slate-50">Admin console</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
        {links.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={`/admin/${path}`}
            className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-50'
            }`}
          >
            {({ isActive }) => (
              <>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                  isActive ? 'bg-white/15 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-5">
        <div className="rounded-[26px] bg-slate-50 dark:bg-slate-800 p-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Signed in as</p>
          <p className="mt-3 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{currentUser?.email || currentUser?.username || 'Admin'}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Admin account</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-slate-100 px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
