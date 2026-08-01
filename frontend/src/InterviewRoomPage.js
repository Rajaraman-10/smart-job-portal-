import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { fetchInterviewByRoom } from './services/api';

export default function InterviewRoomPage({ currentUser }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadInterview = async () => {
      if (!roomId) {
        setError('No interview room was provided.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchInterviewByRoom(roomId);
        if (active) {
          setInterview(data);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load the interview room.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInterview();
    return () => {
      active = false;
    };
  }, [roomId]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 text-center">
          <h1 className="text-2xl font-semibold">Please sign in to join this interview.</h1>
          <button type="button" onClick={() => navigate('/login')} className="mt-4 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white">
            Go to login
          </button>
        </div>
      </div>
    );
  }

  const isParticipant = interview && (
    Number(interview.recruiter) === Number(currentUser.id) ||
    Number(interview.candidate) === Number(currentUser.id)
  );

  if (!loading && !isParticipant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 text-center">
          <h1 className="text-2xl font-semibold">You do not have access to this interview room.</h1>
          <button type="button" onClick={() => navigate('/')} className="mt-4 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white">
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  const roomName = interview?.room_name || roomId;
  const meetingUrl = interview?.meeting_url || interview?.meeting_link || `https://meet.jit.si/${roomName}`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Virtual Interview</p>
              <h1 className="mt-2 text-2xl font-semibold">{interview?.application?.job_title || 'Interview Room'}</h1>
              <p className="mt-1 text-sm text-slate-300">
                {interview?.interview_date ? new Date(interview.interview_date).toLocaleDateString() : 'TBD'}
                {interview?.interview_time ? ` • ${interview.interview_time}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => navigate('/')} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">
              Back to dashboard
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-8 text-center text-slate-200">Preparing your interview room…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-200">{error}</div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl">
            <JitsiMeeting
              domain="meet.jit.si"
              roomName={roomName}
              configOverwrite={{
                startWithAudioMuted: true,
                startWithVideoMuted: false,
                disableInviteFunctions: true,
                enableClosePage: false,
              }}
              interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                SHOW_PROMOTIONAL_CLOSE_PAGE: false,
              }}
              userInfo={{ displayName: currentUser?.full_name || currentUser?.first_name || currentUser?.username || 'Guest' }}
              getIFrameRef={(node) => {
                if (node) {
                  node.style.height = '720px';
                  node.style.width = '100%';
                  node.style.border = '0';
                  node.style.borderRadius = '16px';
                }
              }}
            />
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
          <p className="font-medium text-white">Meeting link</p>
          <a href={meetingUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-emerald-300 hover:text-emerald-200">
            {meetingUrl}
          </a>
        </div>
      </div>
    </div>
  );
}
