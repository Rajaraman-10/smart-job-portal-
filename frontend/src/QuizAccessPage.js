import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, LockKeyhole, Send, ShieldCheck } from 'lucide-react';
import { fetchQuizByToken, submitQuizByToken } from './services/api';

export default function QuizAccessPage({ token }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [message, setMessage] = useState('Loading quiz...');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizByToken(token).then((data) => {
      setQuiz(data);
      setMessage('');
      const end = data.ends_at ? new Date(data.ends_at).getTime() : Date.now() + (data.duration_minutes || 60) * 60000;
      setSecondsLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    }).catch((error) => setMessage(error.message));
  }, [token]);

  useEffect(() => {
    if (secondsLeft === null || submitted) return undefined;
    if (secondsLeft <= 0) {
      submitQuizByToken(token, answers).then((result) => {
        setSubmitted(true);
        setMessage(`Time expired. Score: ${result.score}%.`);
      }).catch((error) => setMessage(error.message));
      return undefined;
    }
    const timer = setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, submitted, token, answers]);

  const submit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const result = await submitQuizByToken(token, answers);
      setSubmitted(true);
      setMessage(`Quiz submitted. Score: ${result.score}%. ${result.passed ? 'Passed.' : 'Not cleared.'}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = quiz?.questions?.length || 0;
  const timerTone = secondsLeft !== null && secondsLeft < 300 ? 'is-urgent' : '';

  if (!quiz) return <main className="quiz-access-page quiz-access-page--loading"><div className="quiz-loading-card"><LockKeyhole size={22} /><h1>Technical quiz</h1><p>{message}</p></div></main>;
  return (
    <main className="quiz-access-page">
      <div className="quiz-shell">
        <header className="quiz-header">
          <div className="quiz-brand"><span className="quiz-brand-mark">V</span><span>Vipseekers <small>ASSESSMENT ROOM</small></span></div>
          <div className="quiz-security"><ShieldCheck size={16} /> Secure attempt</div>
        </header>
        <section className="quiz-intro">
          <div><p className="quiz-kicker">TECHNICAL ROUND</p><h1>{quiz.job_title}</h1><p>{quiz.instructions || 'Answer each question carefully. Your attempt is evaluated automatically after submission.'}</p></div>
          <div className={`quiz-timer ${timerTone}`}><Clock3 size={18} /><span><small>TIME REMAINING</small>{submitted ? 'Submitted' : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}</span></div>
        </section>
        <div className="quiz-progress-row"><span>{answeredCount} of {totalQuestions} answered</span><div className="quiz-progress"><span style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }} /></div><span>{quiz.duration_minutes || 60} min</span></div>
        <section className="quiz-question-list">
          {quiz.questions.map((question, index) => (
            <fieldset className={`quiz-question-card ${answers[question.id] ? 'is-answered' : ''}`} key={question.id}>
              <legend><span className="quiz-question-number">{String(index + 1).padStart(2, '0')}</span>{question.prompt}</legend>
              <div className="quiz-option-grid">{question.options.map((option, optionIndex) => <label className={answers[question.id] === option ? 'is-selected' : ''} key={option}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} disabled={submitted} /><span className="quiz-option-key">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{answers[question.id] === option && <CheckCircle2 size={16} />}</label>)}</div>
            </fieldset>
          ))}
        </section>
        <footer className="quiz-footer"><p>{message || 'You can review your answers before submitting.'}</p>{!submitted && <button type="button" className="quiz-submit-button" onClick={submit} disabled={submitting}><Send size={16} />{submitting ? 'Submitting...' : 'Submit quiz'}</button>}</footer>
      </div>
    </main>
  );
}