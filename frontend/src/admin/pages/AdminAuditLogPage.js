import React from 'react';

const ACTION_LABELS = {
  USER_SUSPENDED: 'Suspended user',
  USER_REACTIVATED: 'Reactivated user',
  COMPANY_VERIFICATION_UPDATED: 'Updated company verification',
  JOB_STATUS_CHANGED: 'Changed job status',
  JOB_DELETED: 'Deleted job',
};

const ACTION_STYLE = {
  USER_SUSPENDED: 'bg-rose-50 text-rose-700',
  USER_REACTIVATED: 'bg-emerald-50 text-emerald-700',
  COMPANY_VERIFICATION_UPDATED: 'bg-sky-50 text-sky-700',
  JOB_STATUS_CHANGED: 'bg-amber-50 text-amber-700',
  JOB_DELETED: 'bg-rose-50 text-rose-700',
};

export default function AdminAuditLogPage({ logs = [], loading, onRefresh }) {
  if (loading) {
    return <div className="p-8 text-center text-slate-700 dark:text-slate-300">Loading audit log…</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Audit Log</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Every moderation action taken by an admin — who did what, and when.</p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Refresh
            </button>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No moderation actions yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{log.admin_name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${ACTION_STYLE[log.action] || 'bg-slate-100 text-slate-600'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{log.target_label || `${log.target_type} #${log.target_id}`}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{log.details || '-'}</td>
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
