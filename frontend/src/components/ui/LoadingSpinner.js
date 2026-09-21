import React from 'react';

export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 p-6 text-[#5B6660] dark:text-slate-400">
      <div className="w-10 h-10 border-4 border-[#14181C]/10 dark:border-white/10 border-t-[#0E7C66] rounded-full animate-spin" />
      <span>{label}</span>
    </div>
  );
}
