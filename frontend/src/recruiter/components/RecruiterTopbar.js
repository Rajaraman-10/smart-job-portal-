import React from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';

export default function RecruiterTopbar({ currentUser }) {
  return (
    <header className="flex min-h-[84px] items-center justify-between gap-4 rounded-[32px] border border-slate-200 bg-white px-6 py-4 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0E7C66] text-white shadow-sm shadow-slate-950/10">
          <span className="font-semibold">V</span>
        </div>
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Recruiter portal</p>
          <h1 className="text-lg font-semibold text-slate-950">Hiring workspace</h1>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative w-full max-w-lg">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition focus:border-[#0E7C66] focus:ring-2 focus:ring-[#0E7C66]/10"
            placeholder="Search candidates, jobs or messages"
          />
        </div>
        <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-50 text-slate-950 transition hover:bg-slate-100">
          <Bell className="h-5 w-5" />
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded-3xl bg-[#0E7C66] px-4 py-3 text-sm text-white transition hover:bg-[#0B6553]">
          <span>{currentUser?.first_name || currentUser?.username}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
