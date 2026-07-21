import React from 'react';

export default function AdminDashboardPage({ dashboard, loading }) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-700">
        Loading admin dashboard...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8 text-center text-slate-700">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Platform-wide metrics and recent activity.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {['users', 'jobseekers', 'recruiters', 'admins', 'jobs', 'active_jobs', 'applications', 'companies'].map((key) => (
            <div key={key} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{key.replace('_', ' ')}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{dashboard.totals?.[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Applications by status</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(dashboard.applications_by_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <span className="text-sm text-slate-700">{status.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Recent jobs</h2>
          <div className="mt-4 space-y-3">
            {(dashboard.recent_jobs || []).map((job) => (
              <div key={job.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{job.company}</p>
                <p className="text-base font-semibold text-slate-900">{job.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Recent users</h2>
          <div className="mt-4 space-y-3">
            {(dashboard.recent_users || []).map((user) => (
              <div key={user.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="text-base font-semibold text-slate-900">{user.first_name || user.username}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
