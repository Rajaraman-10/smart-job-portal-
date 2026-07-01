import { useState } from 'react';
import { scheduleInterview } from './services/api';

export function InterviewScheduler({ applicationId, existingInterviews = [], onScheduled }) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [mode, setMode] = useState('Video');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!scheduledAt) {
      setError('Choose a date and time.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const interview = await scheduleInterview({
        application: applicationId,
        scheduled_at: scheduledAt,
        mode,
        location_or_link: locationOrLink,
        notes,
      });
      onScheduled?.(interview);
      setScheduledAt('');
      setMode('Video');
      setLocationOrLink('');
      setNotes('');
    } catch (err) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="interview-scheduler">
      <h4>Schedule interview</h4>
      {existingInterviews.length > 0 && (
        <ul className="interview-list">
          {existingInterviews.map((entry) => (
            <li key={entry.id}>
              <span>{new Date(entry.scheduled_at).toLocaleString()}</span>
              <strong>{entry.mode}</strong>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit}>
        <div className="interview-form-row">
          <label htmlFor="interview-time">Date & time</label>
          <input id="interview-time" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
        <div className="interview-form-row">
          <label htmlFor="interview-mode">Mode</label>
          <select id="interview-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="Video">Video</option>
            <option value="Phone">Phone</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>
        <div className="interview-form-row">
          <label htmlFor="interview-link">Link or location</label>
          <input id="interview-link" type="text" value={locationOrLink} onChange={(e) => setLocationOrLink(e.target.value)} placeholder="Meet link or office address" />
        </div>
        <div className="interview-form-row">
          <label htmlFor="interview-notes">Notes</label>
          <textarea id="interview-notes" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Share prep notes" />
        </div>
        {error ? <div className="interview-error">{error}</div> : null}
        <button className="submit-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Scheduling…' : 'Save interview'}
        </button>
      </form>
    </div>
  );
}

export function InterviewSummary({ interviews = [] }) {
  if (!interviews.length) return null;

  return (
    <div className="interview-summary">
      <h4>Upcoming interviews</h4>
      {interviews.map((entry) => (
        <p key={entry.id}>
          {new Date(entry.scheduled_at).toLocaleString()} • {entry.mode}
          {entry.location_or_link ? ` • ${entry.location_or_link}` : ''}
          {entry.notes ? <span className="interview-summary-notes"> • {entry.notes}</span> : null}
        </p>
      ))}
    </div>
  );
}
