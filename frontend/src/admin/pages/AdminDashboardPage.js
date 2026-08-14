import React from 'react';

export default function AdminDashboardPage({ dashboard, loading }) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-700 dark:text-slate-300">
        Loading admin dashboard...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8 text-center text-slate-700 dark:text-slate-300">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Platform-wide metrics and recent activity.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {['users', 'jobseekers', 'recruiters', 'admins', 'jobs', 'active_jobs', 'applications', 'companies'].map((key) => (
            <div key={key} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{key.replace('_', ' ')}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{dashboard.totals?.[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Applications by status</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(dashboard.applications_by_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                <span className="text-sm text-slate-700 dark:text-slate-300">{status.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recent jobs</h2>
          <div className="mt-4 space-y-3">
            {(dashboard.recent_jobs || []).map((job) => (
              <div key={job.id} className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{job.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recent users</h2>
          <div className="mt-4 space-y-3">
            {(dashboard.recent_users || []).map((user) => (
              <div key={user.id} className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{user.first_name || user.username}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
