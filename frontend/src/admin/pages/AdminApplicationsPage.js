import React from 'react';

export default function AdminApplicationsPage({ applications = [], loading, onViewApplication, onUpdateStatus }) {
  if (loading) {
    return <div className="p-8 text-center text-slate-700 dark:text-slate-300">Loading applications…</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Applications</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Browse and review all candidate applications.</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No applications found.
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3">{application.applicant_name || application.applicant_email || 'Candidate'}</td>
                    <td className="px-4 py-3">{application.job_title}</td>
                    <td className="px-4 py-3">{application.job_company}</td>
                    <td className="px-4 py-3">{application.status}</td>
                    <td className="px-4 py-3">{application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onViewApplication?.(application.id)}
                          className="rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          View
                        </button>
                        {application.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus?.(application.id, 'REJECTED')}
                            className="rounded-full border border-rose-300 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            Reject
                          </button>
                        )}
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
