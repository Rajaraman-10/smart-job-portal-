import React from 'react';
import { Outlet } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminLayout({ currentUser, onLogout, theme, onToggleTheme }) {
  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-950 dark:text-slate-50">
      <div className="mx-auto flex h-screen max-w-[1480px] gap-6 p-4 md:p-6 lg:p-8">
        <AdminSidebar currentUser={currentUser} onLogout={onLogout} />
        <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Admin Portal</p>
              <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Admin Console</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Manage users, applications, companies, and platform metrics.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {currentUser?.first_name ? (
                <div className="rounded-full bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm text-slate-700 dark:text-slate-300">Signed in as {currentUser.first_name}</div>
              ) : null}
            </div>
          </div>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
