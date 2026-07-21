import React from 'react';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function RecruiterManageJobsPage({ jobs, loading, onEdit, onDelete }) {
  if (loading) {
    return <LoadingSpinner label="Loading posted jobs..." />;
  }

  if (!jobs.length) {
    return (
      <EmptyState
        title="No jobs posted yet"
        description="Start posting jobs to see them listed here with application counts and status management."
        actionLabel="Post your first job"
        onAction={() => onEdit(null)}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans text-[#14181C]">
      <div className="flex flex-col gap-3 border border-[#14181C]/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">POSTINGS</p>
          <h1 className="mt-2 font-display text-xl font-semibold text-[#14181C]">Manage jobs</h1>
          <p className="mt-1 text-sm text-[#5B6660]">Every posting you've published, with live application counts.</p>
        </div>
        <button
          type="button"
          onClick={() => onEdit(null)}
          className="inline-flex items-center justify-center bg-[#0E7C66] px-5 py-3 text-sm font-medium text-white hover:bg-[#0B6553]"
        >
          Post new job
        </button>
      </div>

      <div className="border border-[#14181C]/10 bg-white">
        <div className="grid grid-cols-1 gap-0 border-b border-[#14181C]/10 px-6 py-4 font-data text-xs tracking-widest text-[#5B6660] sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr]">
          <div>JOB TITLE</div>
          <div>LOCATION</div>
          <div>APPLICATIONS</div>
          <div>STATUS</div>
          <div>POSTED</div>
          <div className="text-right">ACTIONS</div>
        </div>
        {jobs.map((job) => (
          <div key={job.id} className="grid grid-cols-1 gap-2 border-b border-[#14181C]/8 px-6 py-5 text-sm text-[#14181C] sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr] sm:items-center sm:gap-0">
            <div>
              <p className="font-medium text-[#14181C]">{job.title}</p>
              <p className="text-sm text-[#5B6660]">{job.company}</p>
            </div>
            <div className="text-[#5B6660]">{job.location}</div>
            <div className="font-data text-[#5B6660]">{job.application_count ?? '—'}</div>
            <div>
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium ${job.status === 'ACTIVE' ? 'bg-[#EAF3DE] text-[#27500A]' : 'bg-[#F1EFE8] text-[#444441]'}`}>
                {job.status}
              </span>
            </div>
            <div className="font-data text-[#5B6660]">{new Date(job.posted_at).toLocaleDateString()}</div>
            <div className="flex items-center gap-2 sm:justify-end">
              <button onClick={() => onEdit(job)} className="border border-[#14181C]/15 bg-white px-3 py-1.5 text-xs font-medium text-[#14181C] hover:border-[#14181C]/30">
                Edit
              </button>
              <button onClick={() => onDelete(job)} className="bg-[#B3402F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#963426]">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}