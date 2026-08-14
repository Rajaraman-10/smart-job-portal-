import React from 'react';

export default function AdminCompaniesPage({ companies = [], loading }) {
  if (loading) {
    return <div className="p-8 text-center text-slate-700 dark:text-slate-300">Loading companies…</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Companies</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Review company profiles and metadata.</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Employees</th>
                <th className="px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No companies found.</td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3">{company.name}</td>
                    <td className="px-4 py-3">{company.industry || '-'}</td>
                    <td className="px-4 py-3">{company.location || '-'}</td>
                    <td className="px-4 py-3">{company.employees || '-'}</td>
                    <td className="px-4 py-3">{company.rating ?? '-'}</td>
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
