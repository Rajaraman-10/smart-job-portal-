import React from 'react';

export default function RecruiterSettingsPage({
  currentUser,
  profileForm = {},
  onProfileFieldChange,
  onSaveProfile,
  profileLoading = false,
  profileSaveMessage = '',
  profileError = '',
}) {
  return (
    <div className="space-y-6 font-sans text-[#14181C] dark:text-slate-50">
      <div className="border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6">
        <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">SETTINGS</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-[#14181C] dark:text-slate-50">Account settings</h1>
        <p className="mt-2 text-sm text-[#5B6660] dark:text-slate-400">Manage your recruiter account details and notification preferences.</p>
      </div>

      <div className="border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6">
        <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">ACCOUNT INFORMATION</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-[#5B6660] dark:text-slate-400">Name</p>
            <p className="mt-1 text-sm font-medium text-[#14181C] dark:text-slate-50">{currentUser?.full_name || currentUser?.username || 'Recruiter'}</p>
          </div>
          <div>
            <p className="text-sm text-[#5B6660] dark:text-slate-400">Email</p>
            <p className="mt-1 text-sm font-medium text-[#14181C] dark:text-slate-50">{currentUser?.email || 'No email provided'}</p>
          </div>
          <div>
            <p className="text-sm text-[#5B6660] dark:text-slate-400">Company</p>
            <p className="mt-1 text-sm font-medium text-[#14181C] dark:text-slate-50">{currentUser?.company_name || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-[#5B6660] dark:text-slate-400">Account type</p>
            <p className="mt-1 text-sm font-medium text-[#14181C] dark:text-slate-50">Recruiter</p>
          </div>
        </div>
      </div>

      <form
        className="border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6"
        onSubmit={onSaveProfile}
      >
        <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">NOTIFICATION PREFERENCES</p>
        <label className="mt-4 flex items-center justify-between gap-6 border border-[#14181C]/10 dark:border-white/10 bg-[#F5F6F3] dark:bg-slate-800 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-[#14181C] dark:text-slate-50">Email notifications</p>
            <p className="mt-1 text-sm text-[#5B6660] dark:text-slate-400">Get emailed when candidates apply or send you a message.</p>
          </div>
          <input
            type="checkbox"
            checked={profileForm.email_notifications !== false}
            onChange={(e) => onProfileFieldChange?.('email_notifications', e.target.checked)}
            className="h-5 w-5 cursor-pointer"
          />
        </label>
        <div className="mt-5 flex items-center gap-4">
          <button
            type="submit"
            disabled={profileLoading}
            className="inline-flex items-center bg-[#0E7C66] px-5 py-3 text-sm font-medium text-white hover:bg-[#0B6553] disabled:opacity-60"
          >
            {profileLoading ? 'Saving...' : 'Save preferences'}
          </button>
          {profileSaveMessage && <p className="text-sm text-[#0E7C66]">{profileSaveMessage}</p>}
          {profileError && <p className="text-sm text-[#B3402F]">{profileError}</p>}
        </div>
      </form>
    </div>
  );
}
