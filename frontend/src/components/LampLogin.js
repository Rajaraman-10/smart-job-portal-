import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Search, Briefcase, ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import './LampLogin.css';
import { login as apiLogin, register as apiRegister, requestOtp as apiRequestOtp, verifyOtp as apiVerifyOtp, loginWithGoogle as apiLoginWithGoogle, requestPasswordReset as apiRequestPasswordReset, resetPassword as apiResetPassword } from '../services/api';
import logo from '../assets/logo.png';

const ROLES = [
  { id: 'jobseeker', label: 'Job Seeker', description: 'Explore opportunities and track applications', icon: Search, accent: '#2563eb' },
  { id: 'recruiter', label: 'Recruiter', description: 'Post jobs and manage applicants', icon: Briefcase, accent: '#7c3aed' },
  { id: 'admin', label: 'Admin', description: 'Review platform activity and manage workflows', icon: ShieldCheck, accent: '#ea580c' },
];

const ROLE_LABELS = { jobseeker: 'Job Seeker', recruiter: 'Recruiter', admin: 'Admin' };

const RECRUITER_FORM_DEFAULTS = {
  job_title: '',
  phone_number: '',
  linkedin_url: '',
  company_name: '',
  company_website: '',
  company_phone: '',
  company_address: '',
  company_city: '',
  company_state: '',
  company_country: 'India',
  company_industry: '',
  company_size: '',
  company_year_founded: '',
  company_description: '',
  company_registration_number: '',
  company_gstin: '',
};

export default function LampLogin({ onLoginSuccess, onBack }) {
  const [step, setStep] = useState('role'); // 'role' | 'auth' | 'signup'
  const [selectedRole, setSelectedRole] = useState(null); // 'jobseeker' | 'recruiter' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('email'); // 'email' or 'otp'
  const [message, setMessage] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [recruiterForm, setRecruiterForm] = useState(RECRUITER_FORM_DEFAULTS);
  const updateRecruiterField = (field, value) => setRecruiterForm((prev) => ({ ...prev, [field]: value }));

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'reset' | 'done'
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

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
          setError(`❌ This account is registered as a ${ROLE_LABELS[res.user_type] || res.user_type}. Please login with the correct role.`);
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
          setError(`❌ This account is registered as a ${ROLE_LABELS[res.user_type] || res.user_type}. Please login with the correct role.`);
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

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setError('');
    setMessage('');
    if (!selectedRole) {
      setError('Please select a role before using Google sign-in.');
      return;
    }

    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setError('Google login did not return a credential token. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiLoginWithGoogle(idToken, selectedRole);
      if (res.access) {
        localStorage.setItem('accessToken', res.access);
        localStorage.setItem('refreshToken', res.refresh || '');
        localStorage.setItem('userType', res.user_type || 'jobseeker');
        localStorage.setItem('user', JSON.stringify(res.user || {}));
        onLoginSuccess?.(res.access, res.refresh, res.user_type, res.user);
      } else {
        setError('Google login failed: unexpected response');
      }
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setError('Google login failed. Please try again.');
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    setError('');
    setMessage('');
    if (!signupName || !signupEmail || !signupPassword) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    if (selectedRole === 'recruiter' && !recruiterForm.company_name.trim()) {
      setError('Company name is required.');
      return;
    }
    setLoading(true);
    try {
      const companyDetails = selectedRole === 'recruiter' ? {
        job_title: recruiterForm.job_title,
        phone_number: recruiterForm.phone_number,
        linkedin_url: recruiterForm.linkedin_url,
        company_website: recruiterForm.company_website,
        company_phone: recruiterForm.company_phone,
        company_address: recruiterForm.company_address,
        company_city: recruiterForm.company_city,
        company_state: recruiterForm.company_state,
        company_country: recruiterForm.company_country,
        company_industry: recruiterForm.company_industry,
        company_size: recruiterForm.company_size,
        company_year_founded: recruiterForm.company_year_founded ? Number(recruiterForm.company_year_founded) : null,
        company_description: recruiterForm.company_description,
        company_registration_number: recruiterForm.company_registration_number,
        company_gstin: recruiterForm.company_gstin,
      } : {};
      const res = await apiRegister(signupName, signupEmail, signupPassword, selectedRole, recruiterForm.company_name, companyDetails);
      if (res.access) {
        localStorage.setItem('accessToken', res.access);
        localStorage.setItem('refreshToken', res.refresh || '');
        localStorage.setItem('userType', res.user_type || selectedRole);
        localStorage.setItem('user', JSON.stringify(res.user || {}));
        onLoginSuccess?.(res.access, res.refresh, res.user_type, res.user);
      } else {
        setError('Registration failed: unexpected response');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (roleId) => {
    setSelectedRole(roleId);
    setStep('auth');
    setError('');
    setMessage('');
  };

  const goToSignup = () => {
    setStep('signup');
    setError('');
    setMessage('');
  };

  const goToForgotPassword = () => {
    setForgotEmail(email);
    setForgotStep('email');
    setForgotOtp('');
    setForgotNewPassword('');
    setStep('forgot');
    setError('');
    setMessage('');
  };

  const handleRequestPasswordReset = async (e) => {
    e?.preventDefault();
    setError('');
    if (!forgotEmail) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await apiRequestPasswordReset(forgotEmail);
      setForgotStep('reset');
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setError('');
    if (!forgotOtp || !forgotNewPassword) {
      setError('Please enter the code and a new password');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await apiResetPassword(forgotEmail, forgotOtp, forgotNewPassword);
      setForgotStep('done');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="ll-page">
        <div className="ll-brand">
          <img src={logo} alt="VIP Jobseeker" />
        </div>
        <h1 className="ll-title">Welcome to VIP Jobseeker</h1>
        <p className="ll-subtitle">Choose how you'd like to continue</p>

        <div className="ll-role-grid">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className="ll-role-card"
              onClick={() => selectRole(role.id)}
            >
              <div className="ll-role-icon" style={{ background: `${role.accent}1a`, color: role.accent }}>
                <role.icon size={22} />
              </div>
              <h3>{role.label}</h3>
              <p>{role.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <div className="ll-page">
        {onBack && (
          <button type="button" className="ll-back-home" onClick={onBack}>
            <ArrowLeft size={14} /> Back to home
          </button>
        )}

        <div className="ll-brand ll-brand-sm">
          <img src={logo} alt="VIP Jobseeker" />
        </div>

        <div className={`ll-card ${selectedRole === 'recruiter' ? 'll-card-wide' : ''}`}>
          <div className="ll-card-header">
            <button
              type="button"
              className="ll-change-role"
              onClick={() => { setStep('role'); setSelectedRole(null); setError(''); setMessage(''); }}
            >
              <ArrowLeft size={13} /> Change role
            </button>
            <h2>Create your account</h2>
            <p className="ll-role-indicator">Signing up as {ROLE_LABELS[selectedRole]}</p>
          </div>

          {error && <div className="ll-alert ll-alert-error">{error}</div>}

          <form onSubmit={handleSignup}>
            <div className="ll-field">
              <label htmlFor="su-name">Full name</label>
              <input id="su-name" type="text" placeholder="Your full name" value={signupName} onChange={(e) => setSignupName(e.target.value)} />
            </div>
            <div className="ll-field">
              <label htmlFor="su-email">{selectedRole === 'recruiter' ? 'Work email' : 'Email address'}</label>
              <input id="su-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
            </div>
            <div className="ll-field">
              <label htmlFor="su-password">Password</label>
              <div className="ll-input-wrap">
                <input
                  id="su-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <button type="button" className="ll-eye" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {selectedRole === 'recruiter' && (
              <>
                <div className="ll-field-row">
                  <div className="ll-field">
                    <label>Phone number</label>
                    <input type="tel" value={recruiterForm.phone_number} onChange={(e) => updateRecruiterField('phone_number', e.target.value)} />
                  </div>
                  <div className="ll-field">
                    <label>Job title / designation</label>
                    <input type="text" value={recruiterForm.job_title} onChange={(e) => updateRecruiterField('job_title', e.target.value)} />
                  </div>
                </div>
                <div className="ll-field">
                  <label>LinkedIn profile <span className="ll-optional">(optional)</span></label>
                  <input type="text" placeholder="https://linkedin.com/in/..." value={recruiterForm.linkedin_url} onChange={(e) => updateRecruiterField('linkedin_url', e.target.value)} />
                </div>

                <div className="ll-section-title">Company information</div>

                <div className="ll-field">
                  <label>Company name</label>
                  <input type="text" value={recruiterForm.company_name} onChange={(e) => updateRecruiterField('company_name', e.target.value)} />
                </div>
                <div className="ll-field-row">
                  <div className="ll-field">
                    <label>Company website</label>
                    <input type="text" placeholder="https://yourcompany.com" value={recruiterForm.company_website} onChange={(e) => updateRecruiterField('company_website', e.target.value)} />
                  </div>
                  <div className="ll-field">
                    <label>Company phone</label>
                    <input type="tel" value={recruiterForm.company_phone} onChange={(e) => updateRecruiterField('company_phone', e.target.value)} />
                  </div>
                </div>
                <div className="ll-field">
                  <label>Address</label>
                  <input type="text" value={recruiterForm.company_address} onChange={(e) => updateRecruiterField('company_address', e.target.value)} />
                </div>
                <div className="ll-field-row ll-field-row-3">
                  <div className="ll-field">
                    <label>City</label>
                    <input type="text" value={recruiterForm.company_city} onChange={(e) => updateRecruiterField('company_city', e.target.value)} />
                  </div>
                  <div className="ll-field">
                    <label>State</label>
                    <input type="text" value={recruiterForm.company_state} onChange={(e) => updateRecruiterField('company_state', e.target.value)} />
                  </div>
                  <div className="ll-field">
                    <label>Country</label>
                    <input type="text" value={recruiterForm.company_country} onChange={(e) => updateRecruiterField('company_country', e.target.value)} />
                  </div>
                </div>
                <div className="ll-field-row">
                  <div className="ll-field">
                    <label>Industry</label>
                    <input type="text" value={recruiterForm.company_industry} onChange={(e) => updateRecruiterField('company_industry', e.target.value)} />
                  </div>
                  <div className="ll-field">
                    <label>Company size</label>
                    <input type="text" placeholder="e.g. 51-200 employees" value={recruiterForm.company_size} onChange={(e) => updateRecruiterField('company_size', e.target.value)} />
                  </div>
                </div>
                <div className="ll-field">
                  <label>Year founded</label>
                  <input type="number" min="1800" max="2100" value={recruiterForm.company_year_founded} onChange={(e) => updateRecruiterField('company_year_founded', e.target.value)} />
                </div>
                <div className="ll-field">
                  <label>Company description</label>
                  <textarea rows="3" value={recruiterForm.company_description} onChange={(e) => updateRecruiterField('company_description', e.target.value)} />
                </div>
                <div className="ll-field-row">
                  <div className="ll-field">
                    <label>CIN <span className="ll-optional">(optional — if registered under MCA)</span></label>
                    <input type="text" value={recruiterForm.company_registration_number} onChange={(e) => updateRecruiterField('company_registration_number', e.target.value)} />
                  </div>
                  <div className="ll-field">
                    <label>GSTIN <span className="ll-optional">(optional)</span></label>
                    <input type="text" value={recruiterForm.company_gstin} onChange={(e) => updateRecruiterField('company_gstin', e.target.value)} />
                  </div>
                </div>
                <p className="ll-hint-text">
                  You can upload your logo and complete verification later from your dashboard — none of this blocks you from getting started.
                </p>
              </>
            )}

            <button className="ll-btn-primary ll-btn-full" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="ll-switch-mode">
            Already have an account?{' '}
            <button type="button" className="ll-link-btn" onClick={() => { setStep('auth'); setError(''); setMessage(''); }}>Sign in</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'forgot') {
    return (
      <div className="ll-page">
        {onBack && (
          <button type="button" className="ll-back-home" onClick={onBack}>
            <ArrowLeft size={14} /> Back to home
          </button>
        )}

        <div className="ll-brand ll-brand-sm">
          <img src={logo} alt="VIP Jobseeker" />
        </div>

        <div className="ll-card">
          <div className="ll-card-header">
            <button
              type="button"
              className="ll-change-role"
              onClick={() => { setStep('auth'); setError(''); setMessage(''); }}
            >
              <ArrowLeft size={13} /> Back to sign in
            </button>
            <h2>Reset your password</h2>
            <p className="ll-role-indicator">
              {forgotStep === 'email' && "We'll email you a reset code."}
              {forgotStep === 'reset' && `Enter the code we sent to ${forgotEmail}.`}
              {forgotStep === 'done' && 'Your password has been updated.'}
            </p>
          </div>

          {error && <div className="ll-alert ll-alert-error">{error}</div>}

          {forgotStep === 'email' && (
            <form onSubmit={handleRequestPasswordReset}>
              <div className="ll-field">
                <label htmlFor="forgot-email">Email address</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <button className="ll-btn-primary ll-btn-full" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          )}

          {forgotStep === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <div className="ll-field">
                <label htmlFor="forgot-otp">Reset code</label>
                <input
                  id="forgot-otp"
                  type="text"
                  placeholder="6-digit code"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                />
              </div>
              <div className="ll-field">
                <label htmlFor="forgot-password">New password</label>
                <div className="ll-input-wrap">
                  <input
                    id="forgot-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a new password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                  />
                  <button type="button" className="ll-eye" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="ll-btn-row">
                <button className="ll-btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
                <button
                  type="button"
                  className="ll-btn-secondary"
                  onClick={() => { setForgotStep('email'); setError(''); }}
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {forgotStep === 'done' && (
            <>
              <div className="ll-alert ll-alert-success">Password updated successfully.</div>
              <button
                type="button"
                className="ll-btn-primary ll-btn-full"
                onClick={() => { setStep('auth'); setEmail(forgotEmail); setPassword(''); setError(''); setMessage(''); }}
              >
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ll-page">
      {onBack && (
        <button type="button" className="ll-back-home" onClick={onBack}>
          <ArrowLeft size={14} /> Back to home
        </button>
      )}

      <div className="ll-brand ll-brand-sm">
        <img src={logo} alt="VIP Jobseeker" />
      </div>

      <div className="ll-card">
        <div className="ll-card-header">
          <button
            type="button"
            className="ll-change-role"
            onClick={() => { setStep('role'); setSelectedRole(null); setError(''); setMessage(''); }}
          >
            <ArrowLeft size={13} /> Change role
          </button>
          <h2>Welcome back</h2>
          <p className="ll-role-indicator">
            {selectedRole ? `Signing in as ${ROLE_LABELS[selectedRole]}` : 'Select a role'}
          </p>
        </div>

        {error && <div className="ll-alert ll-alert-error">{error}</div>}
        {message && <div className="ll-alert ll-alert-success">{message}</div>}

        <div className="ll-field">
          <label htmlFor="ll-email">Email address</label>
          <input
            id="ll-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {otpStep === 'email' ? (
          <>
            <div className="ll-field">
              <label htmlFor="ll-password">Password</label>
              <div className="ll-input-wrap">
                <input
                  id="ll-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="ll-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="ll-forgot">
              <button type="button" className="ll-link-inline" onClick={goToForgotPassword}>Forgot password?</button>
            </div>

            <div className="ll-btn-row">
              <button className="ll-btn-primary" onClick={handleSignIn} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <button className="ll-btn-secondary" onClick={handleRequestOtp} disabled={loading}>
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="ll-field">
              <label htmlFor="ll-otp">One-time passcode</label>
              <input
                id="ll-otp"
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className="ll-btn-row">
              <button className="ll-btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button
                className="ll-btn-secondary"
                onClick={() => { setOtpStep('email'); setMessage(''); setError(''); }}
              >
                Change email
              </button>
            </div>
          </>
        )}

        <div className="ll-divider">or</div>

        <div className="ll-google-wrap">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
          />
        </div>

        <div className="ll-switch-mode">
          Don't have an account?{' '}
          <button type="button" className="ll-link-btn" onClick={goToSignup}>Sign up</button>
        </div>
      </div>
    </div>
  );
}
