import React from 'react';

export default function AdminApplicationsPage({ applications = [], loading, onViewApplication }) {
  if (loading) {
    return <div className="p-8 text-center text-slate-700">Loading applications…</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Applications</h1>
            <p className="mt-2 text-sm text-slate-600">Browse and review all candidate applications.</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600">
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
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                    No applications found.
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3">{application.applicant_name || application.applicant_email || 'Candidate'}</td>
                    <td className="px-4 py-3">{application.job_title}</td>
                    <td className="px-4 py-3">{application.job_company}</td>
                    <td className="px-4 py-3">{application.status}</td>
                    <td className="px-4 py-3">{application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onViewApplication?.(application.id)}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                      </button>
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
