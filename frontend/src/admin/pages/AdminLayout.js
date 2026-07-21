import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AdminLayout({ currentUser, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-6 p-4 md:p-6 lg:p-8">
        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm text-slate-500">Admin Portal</p>
              <h1 className="text-3xl font-semibold text-slate-950">Admin Console</h1>
              <p className="mt-1 text-sm text-slate-600">Manage users, applications, companies, and platform metrics.</p>
            </div>
            <div className="flex items-center gap-3">
              {currentUser?.first_name ? (
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Signed in as {currentUser.first_name}</div>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
