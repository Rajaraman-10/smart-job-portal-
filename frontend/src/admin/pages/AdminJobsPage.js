import React, { useState } from 'react';

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-rose-50 text-rose-700',
  DRAFT: 'bg-amber-50 text-amber-700',
};

export default function AdminJobsPage({ jobs = [], loading, onCloseJob, onReopenJob, onDeleteJob }) {
  const [busyId, setBusyId] = useState(null);

  if (loading) {
    return <div className="p-8 text-center text-slate-700 dark:text-slate-300">Loading jobs…</div>;
  }

  const sortedJobs = [...jobs].sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));

  const handleToggle = async (job) => {
    setBusyId(job.id);
    try {
      if (job.status === 'ACTIVE') {
        await onCloseJob(job.id);
      } else {
        await onReopenJob(job.id);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Permanently delete "${job.title}" at ${job.company}? This also deletes all of its applications and cannot be undone.`)) {
      return;
    }
    setBusyId(job.id);
    try {
      await onDeleteJob(job.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Jobs</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Every job posting platform-wide. Close or remove listings that violate policy.</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Posted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No jobs found.</td>
                </tr>
              ) : (
                sortedJobs.map((job) => (
                  <tr key={job.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{job.title}</td>
                    <td className="px-4 py-3">{job.company}</td>
                    <td className="px-4 py-3">{job.location}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[job.status] || 'bg-slate-100 text-slate-600'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => handleToggle(job)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                            job.status === 'ACTIVE'
                              ? 'border-amber-300 bg-white dark:bg-slate-900 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-300 bg-white dark:bg-slate-900 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {job.status === 'ACTIVE' ? 'Close' : 'Reopen'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => handleDelete(job)}
                          className="rounded-full border border-rose-300 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
