import React from 'react';

export default function AdminUsersPage({ users = [], loading, currentUser, onToggleActive }) {
  if (loading) {
    return <div className="p-8 text-center text-slate-700 dark:text-slate-300">Loading users…</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Users</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">View and manage registered users.</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No users found.</td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  const isActive = user.is_active !== false;
                  return (
                    <tr key={user.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3">{user.first_name || user.username}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.role}</td>
                      <td className="px-4 py-3">{user.company_name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role !== 'admin' && !isSelf && (
                          <button
                            type="button"
                            onClick={() => onToggleActive?.(user.id)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              isActive
                                ? 'border-rose-300 bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-50'
                                : 'border-emerald-300 bg-white dark:bg-slate-900 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
