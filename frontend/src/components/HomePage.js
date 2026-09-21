import React, { useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Sparkles,
  Video,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Users,
  Building2,
  ArrowRight,
  Moon,
  Sun,
} from 'lucide-react';

export default function HomePage({ jobs = [], onGetStarted, theme = 'light', onToggleTheme }) {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const activeJobs = useMemo(() => jobs.filter((job) => !job.status || job.status === 'ACTIVE'), [jobs]);
  const companyCount = useMemo(() => new Set(activeJobs.map((job) => job.company).filter(Boolean)).size, [activeJobs]);

  const filteredJobs = useMemo(() => {
    return activeJobs.filter((job) => {
      const matchesSearch = !search
        || job.title?.toLowerCase().includes(search.toLowerCase())
        || job.company?.toLowerCase().includes(search.toLowerCase());
      const matchesLocation = !locationFilter || job.location?.toLowerCase().includes(locationFilter.toLowerCase());
      return matchesSearch && matchesLocation;
    });
  }, [activeJobs, search, locationFilter]);

  const featuredJobs = filteredJobs.slice(0, 6);

  const stats = [
    { label: 'Open roles', value: activeJobs.length },
    { label: 'Hiring companies', value: companyCount },
    { label: 'AI-matched applications', value: '24/7' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-950 dark:text-slate-50">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-lg font-bold text-white">
              V
            </div>
            <span className="text-lg font-bold tracking-tight">Vipseekers</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#jobs" className="hover:text-slate-950 dark:hover:text-white">Find Jobs</a>
            <a href="#features" className="hover:text-slate-950 dark:hover:text-white">Why Vipseekers</a>
            <button type="button" onClick={onGetStarted} className="hover:text-slate-950 dark:hover:text-white">
              For Employers
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-full border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered job matching
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Find your next role,<br className="hidden sm:block" /> faster.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Smart Job Portal connects job seekers and recruiters with AI-scored resume matching,
            built-in video interviews, and real-time hiring pipelines &mdash; all in one place.
          </p>

          <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg shadow-slate-900/5 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job title or company"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="hidden w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            <div className="flex flex-1 items-center gap-2 px-3">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Location"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <a
              href="#jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Search className="h-4 w-4" />
              Search Jobs
            </a>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section id="jobs" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Featured opportunities</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Real openings from companies hiring right now.</p>
          </div>
          <button
            type="button"
            onClick={onGetStarted}
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all jobs <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {featuredJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400">
            New roles are posted every day &mdash; check back soon, or sign up to get notified.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={onGetStarted}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Briefcase className="h-5 w-5" />
                  </span>
                  {job.category && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {job.category}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{job.company}</p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location || 'Remote'}</span>
                  {job.salary && <span>{job.salary}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Everything hiring needs, built in</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
              One platform for both sides of the table &mdash; job seekers and recruiters get the tools they need to move fast.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">For Job Seekers</h3>
              <div className="space-y-5">
                {[
                  { icon: Sparkles, title: 'AI resume matching', desc: 'See exactly which skills match a job, and which are missing, before you apply.' },
                  { icon: Video, title: 'Built-in video interviews', desc: 'Join scheduled interviews directly in the app, no extra software.' },
                  { icon: MessageSquare, title: 'Direct recruiter messaging', desc: 'Message recruiters once your application is being reviewed.' },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold">{f.title}</h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">For Recruiters</h3>
              <div className="space-y-5">
                {[
                  { icon: Users, title: 'Full hiring pipeline', desc: 'Track candidates from applied to offer, all in one dashboard.' },
                  { icon: BarChart3, title: 'Hiring analytics', desc: 'See where candidates drop off and which jobs perform best.' },
                  { icon: ShieldCheck, title: 'Verified company profiles', desc: 'Build a company page that showcases your team and openings.' },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold">{f.title}</h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Ready to get started?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          Create a free account as a job seeker or recruiter and start today.
        </p>
        <button
          type="button"
          onClick={onGetStarted}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700"
        >
          Get Started Free <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} Vipseekers Smart Job Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
