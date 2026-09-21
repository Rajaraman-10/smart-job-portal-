import React, { useState } from 'react';
import { Video, RefreshCw, X } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { submitInterviewFeedback } from '../../services/api';

export default function RecruiterInterviewsPage({ interviews, loading, error, onStart, onReschedule, onCancel }) {
  const [feedbackInterviewId, setFeedbackInterviewId] = useState(null);
  const [feedback, setFeedback] = useState({ overall_rating: 0, recommendation: 'MAYBE', notes: '' });
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const saveFeedback = async (interviewId) => {
    try {
      await submitInterviewFeedback(interviewId, feedback);
      setFeedbackMessage('Feedback saved');
      setFeedbackInterviewId(null);
    } catch (saveError) {
      setFeedbackMessage(saveError.message);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading interviews..." />;
  }

  if (error) {
    return (
      <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h2 className="font-display text-lg font-semibold">Unable to load interviews</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
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
    <div className="space-y-6 font-sans text-[#14181C] dark:text-slate-50">
      <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">SCHEDULE</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-[#14181C] dark:text-slate-50">Interviews</h1>
        <p className="mt-1 text-sm text-[#5B6660] dark:text-slate-400">Manage upcoming interviews and keep each hiring conversation on schedule.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
        <div className="hidden gap-4 border-b border-[#14181C]/10 dark:border-white/10 px-6 py-4 font-data text-xs tracking-widest text-[#5B6660] dark:text-slate-400 lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
          <div>CANDIDATE</div>
          <div>JOB</div>
          <div>DATE</div>
          <div>TYPE</div>
          <div>ACTIONS</div>
        </div>
        {interviews.map((interview) => (
          <div key={interview.id} className="grid grid-cols-1 gap-3 border-b border-[#14181C]/8 dark:border-white/10 px-6 py-5 text-sm text-[#14181C] dark:text-slate-50 last:border-b-0 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] lg:items-center lg:gap-4">
            <div className="font-medium">{interview.application?.applicant_name || interview.application?.applicant_email || 'Candidate'}</div>
            <div className="text-[#5B6660] dark:text-slate-400">{interview.application?.job_title || 'Job title'}</div>
            <div className="font-data text-[#5B6660] dark:text-slate-400">{interview.interview_date ? new Date(interview.interview_date).toLocaleDateString() : 'TBD'}</div>
            <div className="text-[#5B6660] dark:text-slate-400">{interview.interview_mode || 'Online'}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onStart(interview)} className="inline-flex items-center gap-1.5 rounded-full bg-[#0E7C66] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0B6553]">
                <Video className="h-3.5 w-3.5" /> Start
              </button>
              <button type="button" onClick={() => onReschedule(interview)} className="inline-flex items-center gap-1.5 rounded-full border border-[#14181C]/15 dark:border-white/15 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-[#14181C] dark:text-slate-50 transition hover:border-[#14181C]/30">
                <RefreshCw className="h-3.5 w-3.5" /> Reschedule
              </button>
              <button type="button" onClick={() => onCancel(interview)} className="inline-flex items-center gap-1.5 rounded-full bg-[#B3402F] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#963426]">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button type="button" onClick={() => setFeedbackInterviewId(interview.id)} className="inline-flex items-center gap-1.5 rounded-full border border-[#0E7C66]/30 px-3 py-1.5 text-xs font-medium text-[#0E7C66]">
                Feedback
              </button>
            </div>
            {feedbackInterviewId === interview.id && (
              <div className="rounded-xl bg-[#F5F6F3] p-3 dark:bg-slate-800 lg:col-span-5">
                <div className="flex flex-wrap gap-2">
                  <label className="text-xs">Overall / 5 <input type="number" min="0" max="5" value={feedback.overall_rating} onChange={(event) => setFeedback({ ...feedback, overall_rating: Number(event.target.value) })} className="ml-1 w-16 rounded border px-2 py-1 dark:bg-slate-900" /></label>
                  <label className="text-xs">Recommendation <select value={feedback.recommendation} onChange={(event) => setFeedback({ ...feedback, recommendation: event.target.value })} className="ml-1 rounded border px-2 py-1 dark:bg-slate-900"><option value="STRONG_YES">Strong yes</option><option value="YES">Yes</option><option value="MAYBE">Maybe</option><option value="NO">No</option></select></label>
                </div>
                <textarea value={feedback.notes} onChange={(event) => setFeedback({ ...feedback, notes: event.target.value })} placeholder="Interview notes" className="mt-3 w-full rounded border px-3 py-2 text-sm dark:bg-slate-900" rows="2" />
                <button type="button" onClick={() => saveFeedback(interview.id)} className="mt-2 rounded-full bg-[#0E7C66] px-3 py-1.5 text-xs font-medium text-white">Save feedback</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {feedbackMessage && <p className="text-sm text-[#0E7C66]">{feedbackMessage}</p>}
    </div>
  );
}
