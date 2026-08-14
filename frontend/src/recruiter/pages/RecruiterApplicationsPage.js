import React from 'react';
import {
  BriefcaseBusiness,
  Users,
  UserCheck,
  CalendarDays,
  MessageSquare,
  Plus,
  ArrowRight,
  Clock3,
  Trophy,
  Video,
  MapPin,
  ChevronRight,
} from 'lucide-react';

import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

/*
  Optional but recommended: load these two fonts once in your root HTML
  or _app entry so the design reads as intended. Everything still works
  with the default Tailwind font stack if you skip this.

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">

  Then in tailwind.config.js:
  fontFamily: {
    display: ['"Space Grotesk"', 'sans-serif'],
    data: ['"IBM Plex Mono"', 'monospace'],
  }
*/

const SHORTLISTED_STATUSES = [
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'OFFER_SENT',
  'SELECTED',
  'JOINED',
];

const formatDate = (date) => {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatStatus = (status) => {
  if (!status) return 'Applied';
  return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const STATUS_STYLE = {
  APPLIED: 'bg-[#E6F1FB] text-[#0C447C]',
  REVIEWING: 'bg-[#FAEEDA] text-[#633806]',
  SHORTLISTED: 'bg-[#E1F5EE] text-[#085041]',
  INTERVIEW_SCHEDULED: 'bg-[#E1F5EE] text-[#085041]',
  INTERVIEW_COMPLETED: 'bg-[#E1F5EE] text-[#085041]',
  OFFER_SENT: 'bg-[#FAEEDA] text-[#633806]',
  SELECTED: 'bg-[#EAF3DE] text-[#27500A]',
  JOINED: 'bg-[#EAF3DE] text-[#27500A]',
  REJECTED: 'bg-[#FCEBEB] text-[#791F1F]',
};

function PipelineStage({ index, total, label, value, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-1 flex-col gap-3 border-r border-dashed border-white/15 px-6 py-6 text-left last:border-r-0 hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between">
        <span className="font-data text-[11px] tracking-widest text-white/40">
          {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <Icon className="h-4 w-4 text-white/40 transition group-hover:text-teal-300" />
      </div>
      <div>
        <p className="font-data text-3xl font-semibold text-white">{value}</p>
        <p className="mt-1 text-sm text-white/60">{label}</p>
      </div>
    </button>
  );
}

function ArrivalMarker() {
  return (
    <div className="hidden w-6 shrink-0 items-center justify-center sm:flex">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}

export default function RecruiterApplicationsPage({ jobs = [], applications = [], loading, onQuickAction, onViewProfile, onShortlist, onReject, onSchedule }) {
  const activeJobs = jobs.filter((job) => job.status === 'ACTIVE').length;
  const totalApplications = applications.length;
  const shortlisted = applications.filter((a) => SHORTLISTED_STATUSES.includes(a.status)).length;
  const interviewsScheduled = applications.filter((a) => a.interviews && a.interviews.length > 0).length;
  const selectedCandidates = applications.filter((a) => ['SELECTED', 'JOINED'].includes(a.status)).length;
  const unreadMessages = applications.reduce((t, a) => t + Number(a.unread_message_count || 0), 0);

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))
    .slice(0, 5);

  const upcomingInterviews = applications
    .flatMap((a) => (a.interviews || []).map((i) => ({ ...i, application: a })))
    .filter((i) => i.interview_date)
    .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date))
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingSpinner label="Loading recruiter dashboard..." />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F6F3] dark:bg-slate-800 font-sans text-[#14181C] dark:text-slate-50">
      <div className="mx-auto max-w-[1400px] space-y-8 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <section className="flex flex-col gap-6 border-b border-[#14181C]/10 dark:border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">HIRING WORKSPACE</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[#14181C] dark:text-slate-50 sm:text-4xl">
              Build your next great team
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#5B6660] dark:text-slate-400">
              Every candidate, interview and job posting, tracked in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onQuickAction('applications')}
              className="inline-flex items-center gap-2 rounded-full border border-[#14181C]/15 dark:border-white/15 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-medium text-[#14181C] dark:text-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:border-[#14181C]/30 hover:shadow-md"
            >
              <Users className="h-4 w-4" />
              View candidates
            </button>
            <button
              type="button"
              onClick={() => onQuickAction('post-job')}
              className="inline-flex items-center gap-2 rounded-full bg-[#0E7C66] px-5 py-3 text-sm font-medium text-white shadow-sm shadow-[#0E7C66]/30 transition hover:-translate-y-0.5 hover:bg-[#0B6553] hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Post new job
            </button>
          </div>
        </section>

        {/* Signature element: hiring manifest / pipeline strip */}
        <section className="overflow-hidden rounded-2xl bg-[#14181C] shadow-lg shadow-[#14181C]/10">
          <div className="flex flex-wrap items-stretch divide-y divide-dashed divide-white/15 sm:flex-nowrap sm:divide-y-0">
            <PipelineStage index={1} total={4} label="Applications" value={totalApplications} icon={Users} onClick={() => onQuickAction('applications')} />
            <PipelineStage index={2} total={4} label="Shortlisted" value={shortlisted} icon={UserCheck} onClick={() => onQuickAction('applications')} />
            <PipelineStage index={3} total={4} label="Interviews" value={interviewsScheduled} icon={CalendarDays} onClick={() => onQuickAction('interviews')} />
            <PipelineStage index={4} total={4} label="Selected" value={selectedCandidates} icon={Trophy} onClick={() => onQuickAction('applications')} />
          </div>
          <div className="h-1 w-full bg-white/10 dark:bg-slate-100/10">
            <div
              className="h-full bg-[#0E7C66] transition-all duration-500"
              style={{ width: `${totalApplications ? Math.min(100, (selectedCandidates / totalApplications) * 100) : 0}%` }}
            />
          </div>
        </section>

        {/* Secondary metrics */}
        <section className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onQuickAction('manage-jobs')}
            className="inline-flex items-center gap-2.5 rounded-full border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 py-2 pl-2.5 pr-4 text-sm text-[#5B6660] dark:text-slate-400 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0E7C66]/30 hover:shadow-md"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 text-[#0E7C66]">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
            </span>
            <span className="font-data font-semibold text-[#14181C] dark:text-slate-50">{activeJobs}</span> active jobs
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('messages')}
            className="inline-flex items-center gap-2.5 rounded-full border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 py-2 pl-2.5 pr-4 text-sm text-[#5B6660] dark:text-slate-400 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0E7C66]/30 hover:shadow-md"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 text-[#0E7C66]">
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
            <span className="font-data font-semibold text-[#14181C] dark:text-slate-50">{unreadMessages}</span> unread messages
          </button>
        </section>

        {/* Main grid */}
        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

          {/* Recent applications */}
          <div className="overflow-hidden rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#14181C]/10 dark:border-white/10 px-6 py-5">
              <div>
                <h2 className="font-display text-base font-semibold text-[#14181C] dark:text-slate-50">Recent applications</h2>
                <p className="mt-1 text-sm text-[#5B6660] dark:text-slate-400">Latest candidates applying to your jobs</p>
              </div>
              <button type="button" onClick={() => onQuickAction('applications')} className="flex items-center gap-1 text-sm font-medium text-[#0E7C66] hover:text-[#0B6553]">
                View all <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {recentApplications.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No applications yet"
                  description="New candidate applications will appear here when people start applying to your jobs."
                  actionLabel="Post your first job"
                  onAction={() => onQuickAction('post-job')}
                />
              </div>
            ) : (
              <div className="divide-y divide-[#14181C]/8 dark:divide-white/8">
                {recentApplications.map((application) => {
                  const name = application.applicant_name || application.applicant_email || 'Candidate';
                  return (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => (onViewProfile ? onViewProfile(application.id) : onQuickAction('applications'))}
                      className="group flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-[#F5F6F3] dark:hover:bg-slate-800"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 font-data text-sm font-semibold text-[#085041] dark:text-[#4ADE80]">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium text-[#14181C] dark:text-slate-50">{name}</h3>
                          <p className="mt-0.5 truncate text-sm text-[#5B6660] dark:text-slate-400">{application.job_title || 'Job position'}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        {application.ai_match_score != null && (
                          <span className="font-data inline-flex items-center gap-1 rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 px-2.5 py-1 text-xs font-semibold text-[#085041] dark:text-[#4ADE80]">
                            AI {Math.round(application.ai_match_score)}%
                          </span>
                        )}
                        <div className="text-right">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[application.status] || 'bg-[#F1EFE8] text-[#444441] dark:text-slate-400'}`}>
                            {formatStatus(application.status)}
                          </span>
                          <p className="mt-1.5 font-data text-xs text-[#5B6660] dark:text-slate-400">{formatDate(application.applied_at)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#14181C]/20 dark:text-slate-50/20 transition group-hover:translate-x-1 group-hover:text-[#5B6660]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming interviews */}
          <div className="overflow-hidden rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#14181C]/10 dark:border-white/10 px-6 py-5">
              <div>
                <h2 className="font-display text-base font-semibold text-[#14181C] dark:text-slate-50">Upcoming interviews</h2>
                <p className="mt-1 text-sm text-[#5B6660] dark:text-slate-400">Your next candidate meetings</p>
              </div>
              <span className="font-data flex h-8 min-w-8 items-center justify-center rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 px-2 text-sm font-semibold text-[#085041] dark:text-[#4ADE80]">
                {upcomingInterviews.length}
              </span>
            </div>

            {upcomingInterviews.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No upcoming interviews"
                  description="Scheduled candidate interviews will appear here."
                  actionLabel="Schedule interview"
                  onAction={() => onQuickAction('interviews')}
                />
              </div>
            ) : (
              <div className="divide-y divide-[#14181C]/8 dark:divide-white/8">
                {upcomingInterviews.map((interview, index) => {
                  const name = interview.application.applicant_name || interview.application.applicant_email || 'Candidate';
                  const isOnline = interview.interview_mode?.toLowerCase().includes('online');
                  return (
                    <div key={`${interview.application.id}-${index}`} className="flex items-start gap-3 px-6 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F6F3] dark:bg-slate-800 text-[#5B6660] dark:text-slate-400">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium text-[#14181C] dark:text-slate-50">{name}</h3>
                        <p className="mt-0.5 truncate text-xs text-[#5B6660] dark:text-slate-400">{interview.application.job_title}</p>
                        <div className="mt-2 flex flex-wrap gap-3 font-data text-xs text-[#5B6660] dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatDate(interview.interview_date)} · {interview.interview_time || 'TBD'}
                          </span>
                          <span className="flex items-center gap-1">
                            {isOnline ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                            {interview.interview_mode || 'Online'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => onQuickAction('interviews')}
                  className="flex w-full items-center justify-center gap-2 bg-[#F5F6F3] dark:bg-slate-800 py-3 text-sm font-medium text-[#14181C] dark:text-slate-50 transition hover:bg-[#EAEBE8]"
                >
                  View all interviews <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}