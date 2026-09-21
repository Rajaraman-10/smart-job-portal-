import React from 'react';
import EmptyState from '../../components/ui/EmptyState';

export default function RecruiterPlaceholderPage({ title, description, actionLabel, onAction }) {
  return (
    <div className="space-y-6 font-sans text-[#14181C] dark:text-slate-50">
      <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">RECRUITER WORKSPACE</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-[#14181C] dark:text-slate-50">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#5B6660] dark:text-slate-400">{description}</p>
      </div>
      <EmptyState
        title="Coming soon"
        description="This part of the recruiter workspace is still being built."
        actionLabel={actionLabel}
        onAction={onAction}
      />
    </div>
  );
}
