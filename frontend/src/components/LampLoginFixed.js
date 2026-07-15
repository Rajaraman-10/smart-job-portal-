import React, { useState } from 'react';
import './LampLogin.css';
import { login as apiLogin, requestOtp as apiRequestOtp, verifyOtp as apiVerifyOtp } from '../services/api';

export default function LampLogin({ onLoginSuccess }) {
  const [isOn, setIsOn] = useState(false);
  const [step, setStep] = useState('role'); // 'role' | 'auth'
  const [selectedRole, setSelectedRole] = useState(null); // 'jobseeker' | 'recruiter'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('email'); // 'email' or 'otp'
  const [message, setMessage] = useState('');

  const handleSignIn = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      if (res.access) {
        if (selectedRole && res.user_type && res.user_type !== selectedRole) {
          setError(`❌ This account is registered as a ${res.user_type === 'recruiter' ? 'Recruiter' : 'Job Seeker'}. Please login with the correct role.`);
          return;
        }
        localStorage.setItem('accessToken', res.access);
        localStorage.setItem('refreshToken', res.refresh || '');
        localStorage.setItem('userType', res.user_type || 'jobseeker');
        localStorage.setItem('user', JSON.stringify(res.user || {}));
        onLoginSuccess?.(res.access, res.refresh, res.user_type, res.user);
      } else {
        setError('Login failed: unexpected response');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await apiRequestOtp(email);
      setMessage('✅ OTP sent to your email.');
      setOtpStep('otp');
      setOtp('');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setMessage('');
    if (!email || !otp) {
      setError('Please enter email and OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await apiVerifyOtp(email, otp);
      if (res.access) {
        if (selectedRole && res.user_type && res.user_type !== selectedRole) {
          setError(`❌ This account is registered as a ${res.user_type === 'recruiter' ? 'Recruiter' : 'Job Seeker'}. Please login with the correct role.`);
          return;
        }
        localStorage.setItem('accessToken', res.access);
        localStorage.setItem('refreshToken', res.refresh || '');
        localStorage.setItem('userType', res.user_type || 'jobseeker');
        localStorage.setItem('user', JSON.stringify(res.user || {}));
        setMessage('✅ Login successful!');
        onLoginSuccess?.(res.access, res.refresh, res.user_type, res.user);
      } else {
        setError('Login failed: unexpected response');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => setIsOn(v => !v);
  const toggleEye = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
  };

  if (step === 'role') {
    return (
      <div className="ll-page">
        <div className="ll-hint">Choose your role</div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 800 }}>
          <button
            onClick={() => { setSelectedRole('jobseeker'); setStep('auth'); setError(''); setMessage(''); }}
            style={{ flex: 1, padding: 24, borderRadius: 12, background: 'linear-gradient(135deg,#0366d6,#0256b8)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 28 }}>🔍</div>
            <h3>Job Seeker</h3>
            <div>Explore opportunities and track applications</div>
          </button>

          <button
            onClick={() => { setSelectedRole('recruiter'); setStep('auth'); setError(''); setMessage(''); }}
            style={{ flex: 1, padding: 24, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 28 }}>👔</div>
            <h3>Recruiter</h3>
            <div>Post jobs and manage applicants</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ll-page">
      <div className="ll-hint" id="hint">Pull the string to toggle login</div>

      <div className="ll-stage">
        <div className="ll-lamp-wrap" id="lampWrap" onClick={toggle}>
          <div className={`ll-glow ${isOn ? 'on' : ''}`} id="glow" />
          <div className={`ll-beam ${isOn ? 'on' : ''}`} id="beam" />

          <svg className="ll-lamp" width="220" height="380" viewBox="0 0 220 380" aria-hidden>
            <ellipse className="shade" id="shadeTop" cx="110" cy="60" rx="70" ry="14" fill="#e9e2d3" />
            <path className="shade" id="shadeBody" d="M 55 60 L 40 78 L 180 78 L 165 60 Z" fill="#d8cfba" />
            <circle className={`ll-bulb ${isOn ? 'on' : 'off'}`} id="bulb" cx="110" cy="72" r="10" />
            <rect x="106" y="78" width="8" height="230" fill="#26262c" />
            <rect x="60" y="300" width="100" height="10" rx="4" fill="#26262c" />
            <rect x="30" y="310" width="160" height="8" rx="4" fill="#1c1c20" />

            <g className="ll-cord" id="cordGroup" onClick={(e) => { e.stopPropagation(); toggle(); }} role="button" tabIndex={0} aria-label="Toggle lamp">
              <line x1="140" y1="90" x2="140" y2="145" stroke="#8a8a90" strokeWidth="2" />
              <ellipse className="ll-knob" id="knob" cx="140" cy="152" rx="7" ry="10" fill="#c9a24a" />
            </g>
          </svg>
        </div>

        <div className="ll-card-slot">
          <div className={`ll-card ${isOn ? 'on' : ''}`} id="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <button className="back-btn" onClick={() => { setStep('role'); setSelectedRole(null); setError(''); setMessage(''); }}>← Change Role</button>
              <h2 style={{ margin: 0 }}>Welcome back</h2>
              <div style={{ width: 72 }} />
            </div>

            {error && <div className="error-message" style={{ color: '#ffb4b4', marginBottom: 8 }}>{error}</div>}
            <div style={{ marginBottom: 6, color: 'var(--ll-muted)' }}>{selectedRole ? `Signing in as ${selectedRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'}` : 'Select a role'}</div>
            <div className="ll-field">
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {otpStep === 'email' ? (
              <>
                <div className="ll-field">
                  <input type="password" id="pw1" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button className="ll-eye" type="button" onClick={() => toggleEye('pw1')} aria-label="Toggle password visibility">👁️</button>
                </div>
                <div className="ll-forgot"><a href="#">Forgot password?</a></div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ll-signin" onClick={handleSignIn} disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
                  <button className="ll-signin" onClick={handleRequestOtp} disabled={loading} style={{ background: 'transparent', border: '1px solid var(--ll-border)', color: 'var(--ll-text)' }}>{loading ? 'Sending...' : 'Send OTP'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="ll-field">
                  <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ll-signin" onClick={handleVerifyOtp} disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
                  <button className="ll-signin" onClick={() => { setOtpStep('email'); setMessage(''); setError(''); }} style={{ background: 'transparent', border: '1px solid var(--ll-border)', color: 'var(--ll-text)' }}>Change Email</button>
                </div>
              </>
            )}

            <div style={{ marginTop: 12 }}>{message && <span style={{ color: '#9be7a0' }}>{message}</span>}</div>

            <div className="ll-divider">or</div>

            <button className="ll-google" type="button" aria-label="Continue with Google">
              <svg viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-14 4.1-17.7 10.7z"/>
                <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.4l-6.3-5.2C29.4 34.9 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.9 39.9 16.4 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.2C39.9 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
