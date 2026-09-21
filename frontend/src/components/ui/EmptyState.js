import React from 'react';

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 text-[#0E7C66] dark:text-[#4ADE80]">
        <span className="text-2xl">✨</span>
      </div>
      <h3 className="mt-6 font-display text-xl font-semibold text-[#14181C] dark:text-slate-50">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#5B6660] dark:text-slate-400">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center rounded-full bg-[#0E7C66] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0B6553] hover:shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
