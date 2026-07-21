import React from 'react';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function RecruiterInterviewsPage({ interviews, loading, onStart, onReschedule, onCancel }) {
  if (loading) {
    return <LoadingSpinner label="Loading interviews..." />;
  }

  if (!interviews.length) {
    return (
      <EmptyState
        title="No interviews scheduled"
        description="Once you schedule an interview, it will appear here with quick action controls."
        actionLabel="Schedule interview"
        onAction={() => onReschedule?.()}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans text-[#14181C]">
      <div className="border border-[#14181C]/10 bg-white p-6">
        <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">SCHEDULE</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-[#14181C]">Interview calendar</h1>
        <p className="mt-1 text-sm text-[#5B6660]">Manage upcoming interviews and keep each hiring conversation on schedule.</p>
      </div>

      <div className="border border-[#14181C]/10 bg-white">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#14181C]/10 px-6 py-4 font-data text-xs tracking-widest text-[#5B6660]">
          <div>CANDIDATE</div>
          <div>JOB</div>
          <div>DATE</div>
          <div>TYPE</div>
          <div>ACTIONS</div>
        </div>
        {interviews.map((interview) => (
          <div key={interview.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#14181C]/8 px-6 py-5 text-sm text-[#14181C]">
            <div className="font-medium">{interview.application?.applicant_name || interview.application?.applicant_email || 'Candidate'}</div>
            <div className="text-[#5B6660]">{interview.application?.job_title || 'Job title'}</div>
            <div className="font-data text-[#5B6660]">{interview.interview_date ? new Date(interview.interview_date).toLocaleDateString() : 'TBD'}</div>
            <div className="text-[#5B6660]">{interview.interview_mode || 'Online'}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onStart(interview)} className="bg-[#0E7C66] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0B6553]">
                Start
              </button>
              <button type="button" onClick={() => onReschedule(interview)} className="border border-[#14181C]/15 bg-white px-3 py-1.5 text-xs font-medium text-[#14181C] hover:border-[#14181C]/30">
                Reschedule
              </button>
              <button type="button" onClick={() => onCancel(interview)} className="bg-[#B3402F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#963426]">
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}