import { useEffect, useState } from 'react';
import {
  fetchApplicationWorkflow,
  respondToOffer,
  sendOfferLetter,
  resendQuizEmail,
} from './services/api';

export function RecruiterWorkflowPanel({ applicationId, onStatusChanged }) {
  const [workflow, setWorkflow] = useState(null);
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [terms, setTerms] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApplicationWorkflow(applicationId)
      .then((data) => {
        setWorkflow(data);
        if (data.offer_letter) {
          setSalary(data.offer_letter.salary || '');
          setJoiningDate(data.offer_letter.joining_date || '');
          setTerms(data.offer_letter.terms || '');
        }
      })
      .catch((error) => setMessage(error.message));
  }, [applicationId]);

  const sendOffer = async () => {
    setSaving(true);
    setMessage('');
    try {
      const offer = await sendOfferLetter(applicationId, { salary, joining_date: joiningDate, terms });
      setWorkflow((current) => ({ ...current, offer_letter: offer }));
      onStatusChanged?.('OFFER_SENT');
      setMessage(offer.email_sent
        ? 'Offer letter and email sent to the candidate.'
        : `Offer saved, but email was not sent: ${offer.email_error || 'check SMTP settings'}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const resendQuiz = async () => {
    setSaving(true);
    setMessage('');
    try {
      const result = await resendQuizEmail(applicationId);
      setWorkflow((current) => ({
        ...current,
        quiz: current?.quiz ? { ...current.quiz, access_token: result.access_token, email_sent_at: result.email_sent_at, email_send_error: result.email_send_error } : current?.quiz,
      }));
      setMessage(result.sent ? 'Quiz email resent successfully.' : `Quiz email could not be sent: ${result.email_send_error || 'check email settings'}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="detail-section workflow-section workflow-panel-modern">
      <div className="workflow-panel-heading"><div><p className="workflow-kicker">CANDIDATE JOURNEY</p><h3>Selection workflow</h3></div><span className="workflow-status-chip">{workflow?.status || 'Loading'}</span></div>
      <p className="workflow-stage-note">Quiz questions are managed once in the job posting and shared with every applicant.</p>
      <div className="workflow-subsection workflow-readonly-card">
        <div className="workflow-card-heading"><h4>Technical quiz</h4><span>{workflow?.quiz ? workflow.quiz.status : 'Not published'}</span></div>
        {workflow?.quiz?.status === 'COMPLETED' ? (
          <div className="workflow-score-grid"><div><small>SCORE</small><strong>{workflow.quiz.score}%</strong></div><div><small>RESULT</small><strong>{workflow.quiz.score >= workflow.quiz.passing_score ? 'Passed' : 'Not cleared'}</strong></div><div><small>SUBMITTED</small><strong>{workflow.quiz.submitted_at ? new Date(workflow.quiz.submitted_at).toLocaleString() : 'Completed'}</strong></div></div>
        ) : <p className="workflow-result">The shared job quiz is available through the candidate's secure invitation link.</p>}
      </div>
      <div className="workflow-subsection">
        <h4>Offer letter</h4>
        <input value={salary} onChange={(event) => setSalary(event.target.value)} placeholder="Salary, e.g. INR 12 LPA" />
        <input type="date" value={joiningDate} onChange={(event) => setJoiningDate(event.target.value)} />
        <textarea value={terms} onChange={(event) => setTerms(event.target.value)} placeholder="Offer terms" rows="3" />
        <button type="button" className="submit-btn" onClick={sendOffer} disabled={saving || !salary || !joiningDate}>{saving ? 'Sending...' : 'Send offer letter'}</button>
      </div>
      <div className="workflow-actions">{workflow?.quiz?.access_token && <button type="button" className="cancel-btn" onClick={resendQuiz} disabled={saving}>{saving ? 'Sending...' : 'Resend Quiz Email'}</button>}</div>
      {message && <p className="workflow-result">{message}</p>}
    </section>
  );
}

export function CandidateWorkflowPanel({ applicationId }) {
  const [workflow, setWorkflow] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApplicationWorkflow(applicationId).then(setWorkflow).catch((error) => setMessage(error.message));
  }, [applicationId]);

  const respond = async (status) => {
    try {
      const offer = await respondToOffer(applicationId, status);
      setWorkflow((current) => ({ ...current, offer_letter: offer }));
      setMessage(`Offer ${status.toLowerCase()}.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!workflow) return <section className="detail-section"><h3>Selection workflow</h3><p>Loading workflow...</p></section>;
  const quiz = workflow.quiz;
  const offer = workflow.offer_letter;
  const timeline = workflow.timeline || {};
  const formatRound = (value) => value ? new Date(value).toLocaleString() : 'Not scheduled';
  return (
    <section className="detail-section workflow-section">
      <h3>Selection workflow</h3>
      <div className="workflow-timeline">
        <p><strong>Resume screening:</strong> {formatRound(timeline.resume_screening_at)}</p>
        <p><strong>Quiz:</strong> {formatRound(timeline.quiz_starts_at)} to {formatRound(timeline.quiz_ends_at)}</p>
        <p><strong>Technical interview:</strong> {formatRound(timeline.technical_interview_at)} · {timeline.technical_interview_mode || 'Not scheduled'}</p>
        <p><strong>Final decision:</strong> {formatRound(timeline.final_selection_at)}</p>
      </div>
      {quiz?.status === 'PUBLISHED' && (
        <div className="workflow-subsection">
          <h4>Technical quiz</h4>
          <p className="workflow-stage-note">Duration: {timeline.quiz_duration_minutes || 60} minutes. {timeline.quiz_instructions || 'Complete all questions during the scheduled window.'}</p>
          {quiz.access_token ? (
            <a className="submit-btn workflow-start-link" href={`/quiz/${quiz.access_token}`} target="_blank" rel="noreferrer">
              Start Quiz
            </a>
          ) : (
            <p className="workflow-result">Your quiz link is being prepared. Refresh this page shortly.</p>
          )}
        </div>
      )}
      {!quiz && ['SHORTLISTED', 'RESUME_SHORTLISTED', 'QUIZ_SCHEDULED'].includes(workflow.status) && (
        <p className="workflow-result">The recruiter has not published the quiz question set yet. The Start Quiz link will appear here after it is published.</p>
      )}
      {quiz?.status === 'COMPLETED' && <p className="workflow-result">Technical quiz score: {quiz.score}% ({quiz.score >= quiz.passing_score ? 'Passed' : 'Not passed'})</p>}
      {offer && (
        <div className="workflow-subsection">
          <h4>Offer letter</h4>
          <p>Salary: <strong>{offer.salary}</strong></p>
          <p>Joining date: <strong>{offer.joining_date}</strong></p>
          <p>{offer.terms || 'No additional terms.'}</p>
          {offer.status === 'SENT' && <div className="workflow-actions"><button type="button" className="submit-btn" onClick={() => respond('ACCEPTED')}>Accept offer</button><button type="button" className="reject-btn" onClick={() => respond('DECLINED')}>Decline offer</button></div>}
          {offer.status !== 'SENT' && <p className="workflow-result">Offer {offer.status.toLowerCase()}.</p>}
        </div>
      )}
      {message && <p className="workflow-result">{message}</p>}
    </section>
  );
}