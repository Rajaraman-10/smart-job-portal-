import React, { useState } from 'react';
import { register, requestOtp, verifyOtp } from './services/api';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [step, setStep] = useState('role'); // 'role', 'auth'
  const [selectedRole, setSelectedRole] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('email');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyCoverImage, setCompanyCoverImage] = useState('');
  const [companyEmployees, setCompanyEmployees] = useState('');
  const [companyRating, setCompanyRating] = useState('');
  const [mobile, setMobile] = useState('');
  const [workStatus, setWorkStatus] = useState('experienced');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (password !== confirmPassword) {
      setError('❌ Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('❌ Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const companyDetails = isJobSeeker
        ? {}
        : {
            company_website: companyWebsite,
            company_industry: companyIndustry,
            company_size: companySize,
            company_description: companyDescription,
            company_location: companyLocation,
            company_logo: companyLogo,
            company_cover_image: companyCoverImage,
            company_employees: companyEmployees,
            company_rating: companyRating ? Number(companyRating) : null,
          };
      const res = await register(name, email, password, selectedRole, isJobSeeker ? '' : companyName, companyDetails);
      setMessage('✅ Registration successful! Please log in.');
      setIsRegister(false);
      setName('');
      setCompanyName('');
      setCompanyWebsite('');
      setCompanyIndustry('');
      setCompanySize('');
      setCompanyDescription('');
      setCompanyLocation('');
      setCompanyLogo('');
      setCompanyCoverImage('');
      setCompanyEmployees('');
      setCompanyRating('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setMobile('');
      setWorkStatus('experienced');
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await requestOtp(email);
      setMessage('✅ OTP sent to your email.');
      setOtpStep('otp');
      setOtp('');
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await verifyOtp(email, otp);

      if (res.user_type !== selectedRole) {
        setError(`❌ This account is registered as a ${res.user_type === 'recruiter' ? 'Recruiter' : 'Job Seeker'}. Please login with the correct role.`);
        setLoading(false);
        return;
      }

      localStorage.setItem('accessToken', res.access);
      localStorage.setItem('refreshToken', res.refresh);
      localStorage.setItem('userType', res.user_type);
      localStorage.setItem('user', JSON.stringify(res.user));
      setMessage('✅ Login successful!');
      onLoginSuccess(res.access, res.refresh, res.user_type, res.user);
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="login-page">
        <div className="role-selection-container">
          <div className="role-selection-content">
            <h1 className="role-title">Welcome to vipseekers</h1>
            <p className="role-subtitle">Choose your role to get started</p>

            <div className="role-cards">
              <button
                className={`role-card job-seeker-card ${selectedRole === 'jobseeker' ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedRole('jobseeker');
                  setStep('auth');
                  setIsRegister(false);
                  setError('');
                  setMessage('');
                }}
                disabled={loading}
              >
                <div className="role-icon">🔍</div>
                <h2>Job Seeker</h2>
                <ul className="role-benefits">
                  <li>✓ Explore job opportunities</li>
                  <li>✓ Track applications</li>
                  <li>✓ Get notifications</li>
                </ul>
                <span className="role-cta">Continue as Job Seeker</span>
              </button>

              <button
                className={`role-card recruiter-card ${selectedRole === 'recruiter' ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedRole('recruiter');
                  setStep('auth');
                  setIsRegister(false);
                  setError('');
                  setMessage('');
                }}
                disabled={loading}
              >
                <div className="role-icon">👔</div>
                <h2>Recruiter</h2>
                <ul className="role-benefits">
                  <li>✓ Post job openings</li>
                  <li>✓ Manage applicants</li>
                  <li>✓ Build your team</li>
                </ul>
                <span className="role-cta">Continue as Recruiter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isJobSeeker = selectedRole === 'jobseeker';
  const roleLabel = isJobSeeker ? 'Job Seeker' : 'Recruiter';

  return (
    <div className="login-page">
      {isRegister ? (
        <div className="login-container register-container">
          <div className="login-benefits" style={{
            background: isJobSeeker 
              ? 'linear-gradient(135deg, #0366d6 0%, #0256b8 100%)'
              : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
          }}>
            <div className="benefits-content">
              <div className="benefits-icon">{isJobSeeker ? '🚀' : '💼'}</div>
              <h2>On registering as a {roleLabel}, you can</h2>
              <ul className="benefits-list">
                {isJobSeeker ? (
                  <>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Build your profile and let recruiters find you</strong></div>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Get job postings delivered right to your email</strong></div>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Find a job and grow your career</strong></div>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Post unlimited job openings</strong></div>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Access qualified candidates instantly</strong></div>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Manage hiring and build your team</strong></div>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="login-box register-box">
            <div className="form-header">
              <button 
                className="back-btn" 
                onClick={() => setStep('role')}
                disabled={loading}
              >
                ← Change Role
              </button>
              <h2>Create your {roleLabel} account</h2>
              <p>Join thousands of professionals on vipseekers</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="name">Full name<span className="required">*</span></label>
                <input 
                  id="name" 
                  type="text" 
                  placeholder="What is your name?" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  disabled={loading} 
                  required 
                />
              </div>

              {!isJobSeeker && (
                <>
                  <div className="form-group">
                    <label htmlFor="companyName">Company Name<span className="required">*</span></label>
                    <input
                      id="companyName"
                      type="text"
                      placeholder="Enter your company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <small>Recruiters from the same company will share one dashboard.</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="companyWebsite">Company Website</label>
                    <input
                      id="companyWebsite"
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="companyIndustry">Industry</label>
                    <input
                      id="companyIndustry"
                      type="text"
                      placeholder="e.g. Software"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="companySize">Company Size</label>
                    <input
                      id="companySize"
                      type="text"
                      placeholder="e.g. 50-200 employees"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="companyLocation">Headquarters / Main Location</label>
                    <input
                      id="companyLocation"
                      type="text"
                      placeholder="e.g. New York, NY or Remote (HQ)"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="companyEmployees">Employee Count</label>
                    <input
                      id="companyEmployees"
                      type="text"
                      placeholder="e.g. 80-100"
                      value={companyEmployees}
                      onChange={(e) => setCompanyEmployees(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="companyRating">Rating</label>
                    <input
                      id="companyRating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      placeholder="4.7"
                      value={companyRating}
                      onChange={(e) => setCompanyRating(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="companyLogo">Company Logo URL</label>
                    <input
                      id="companyLogo"
                      type="url"
                      placeholder="https://.../logo.png"
                      value={companyLogo}
                      onChange={(e) => setCompanyLogo(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="companyCoverImage">Company Cover Image URL</label>
                    <input
                      id="companyCoverImage"
                      type="url"
                      placeholder="https://.../cover.jpg"
                      value={companyCoverImage}
                      onChange={(e) => setCompanyCoverImage(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="companyDescription">About the Company</label>
                    <textarea
                      id="companyDescription"
                      placeholder="Describe your company, mission, and culture"
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      disabled={loading}
                      rows="4"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="email">Email ID<span className="required">*</span></label>
                <input 
                  id="email" 
                  type="email" 
                  placeholder="Tell us your Email ID" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={loading} 
                  required 
                />
                <small>We'll send relevant jobs and updates to this email</small>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password<span className="required">*</span></label>
                <input 
                  id="password" 
                  type="password" 
                  placeholder="(Minimum 6 characters)" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={loading} 
                  required 
                />
                <small>This helps your account stay protected</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password<span className="required">*</span></label>
                <input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Re-enter your password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  disabled={loading} 
                  required 
                />
              </div>

              {isJobSeeker && (
                <>
                  <div className="form-group">
                    <label htmlFor="mobile">Mobile number<span className="required">*</span></label>
                    <div className="mobile-input">
                      <span className="country-code">+91</span>
                      <input 
                        id="mobile" 
                        type="tel" 
                        placeholder="Enter your mobile number" 
                        value={mobile} 
                        onChange={(e) => setMobile(e.target.value)} 
                        disabled={loading} 
                        required 
                      />
                    </div>
                    <small>Recruiters will contact you on this number</small>
                  </div>

                  <div className="form-group">
                    <label>Work status<span className="required">*</span></label>
                    <div className="work-status-options">
                      <button
                        type="button"
                        className={`work-status-btn ${workStatus === 'experienced' ? 'active' : ''}`}
                        onClick={() => setWorkStatus('experienced')}
                        disabled={loading}
                      >
                        <div className="status-icon">💼</div>
                        <div className="status-text">
                          <strong>I'm experienced</strong>
                          <p>I have work experience (excluding internships)</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`work-status-btn ${workStatus === 'fresher' ? 'active' : ''}`}
                        onClick={() => setWorkStatus('fresher')}
                        disabled={loading}
                      >
                        <div className="status-icon">🎓</div>
                        <div className="status-text">
                          <strong>I'm a fresher</strong>
                          <p>I am a student / Haven't worked after graduation</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="form-divider">Or</div>
            <button type="button" className="btn-google" disabled={loading}>
              <span className="google-icon">G</span>
              Continue with Google
            </button>

            <p className="toggle-auth">
              Already have an account? <button type="button" onClick={() => { setIsRegister(false); setError(''); setMessage(''); }} disabled={loading}>Login</button>
            </p>
          </div>
        </div>
      ) : (
        <div className="login-container">
          <div className="login-benefits" style={{
            background: isJobSeeker 
              ? 'linear-gradient(135deg, #0366d6 0%, #0256b8 100%)'
              : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
          }}>
            <div className="benefits-content">
              <div className="benefits-icon">{isJobSeeker ? '👋' : '🎯'}</div>
              <h2>Welcome back, {roleLabel}!</h2>
              <ul className="benefits-list">
                {isJobSeeker ? (
                  <>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Access all your applications</strong></div>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Get personalized recommendations</strong></div>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Connect with top companies</strong></div>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Review qualified applications</strong></div>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Manage your job postings</strong></div>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <div><strong>Build your team efficiently</strong></div>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="login-box">
            <div className="form-header">
              <button 
                className="back-btn" 
                onClick={() => setStep('role')}
                disabled={loading}
              >
                ← Change Role
              </button>
              <h2>Login to your {roleLabel} account</h2>
              <p>Access your opportunities on vipseekers</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <form onSubmit={otpStep === 'email' ? handleRequestOtp : handleVerifyOtp}>
              <div className="form-group">
                <label htmlFor="email">Email ID<span className="required">*</span></label>
                <input 
                  id="email" 
                  type="email" 
                  placeholder="Tell us your Email ID" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={loading} 
                  required 
                />
              </div>

              {otpStep === 'otp' && (
                <div className="form-group">
                  <label htmlFor="otp">OTP<span className="required">*</span></label>
                  <input 
                    id="otp" 
                    type="text" 
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    disabled={loading} 
                    required 
                  />
                </div>
              )}

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (otpStep === 'email' ? 'Sending OTP...' : 'Verifying OTP...') : (otpStep === 'email' ? 'Send OTP' : 'Verify & Login')}
              </button>

              {otpStep === 'otp' && (
                <button
                  type="button"
                  className="btn-google"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  style={{ marginTop: '0.75rem' }}
                >
                  Resend OTP
                </button>
              )}
            </form>

            <div className="form-divider">Or</div>
            <button type="button" className="btn-google" disabled={loading}>
              <span className="google-icon">G</span>
              Continue with Google
            </button>

            <p className="toggle-auth">
              Don't have an account? <button type="button" onClick={() => { setIsRegister(true); setError(''); setMessage(''); setEmail(''); setPassword(''); }} disabled={loading}>Register</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
