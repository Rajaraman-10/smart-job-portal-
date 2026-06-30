import React, { useState } from 'react';
import { register, login } from './services/api';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [userType, setUserType] = useState('jobseeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
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
      const res = await register(name, email, password, userType);
      setMessage('✅ Registration successful! Please log in.');
      setIsRegister(false);
      setName('');
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await login(email, password);
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

  return (
    <div className="login-page">
      {isRegister ? (
        <div className="login-container register-container">
          <div className="login-benefits">
            <div className="benefits-content">
              <div className="benefits-icon">👤</div>
              <h2>On registering, you can</h2>
              <ul className="benefits-list">
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Build your profile and let recruiters find you</strong>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Get job postings delivered right to your email</strong>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Find a job and grow your career</strong>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="login-box register-box">
            <div className="form-header">
              <h2>Create your account</h2>
              <p>Join thousands of professionals finding their dream role</p>
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

              <div className="form-group form-group-select">
                <label htmlFor="userType">I am a<span className="required">*</span></label>
                <select 
                  id="userType" 
                  value={userType} 
                  onChange={(e) => setUserType(e.target.value)} 
                  disabled={loading}
                >
                  <option value="jobseeker">Job Seeker</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </div>

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
          <div className="login-benefits">
            <div className="benefits-content">
              <div className="benefits-icon">🚀</div>
              <h2>Welcome back!</h2>
              <ul className="benefits-list">
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Access all your applications and updates</strong>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Get personalized job recommendations</strong>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Connect with top recruiters instantly</strong>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="login-box">
            <div className="form-header">
              <h2>Login to your account</h2>
              <p>Access your job applications and opportunities</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <form onSubmit={handleLogin}>
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

              <div className="form-group">
                <label htmlFor="password">Password<span className="required">*</span></label>
                <input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={loading} 
                  required 
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
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

