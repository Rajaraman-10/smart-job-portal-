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
    <div className="login-container">
      <div className="login-box">
        <h1>
          <span className="logo-icon">⭐</span>
          vipseekers
        </h1>
        <h2>{isRegister ? 'Create Account' : 'Login'}</h2>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {isRegister ? (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name">Full Name:</label>
              <input 
                id="name" 
                type="text" 
                placeholder="Enter your full name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                disabled={loading} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input 
                id="email" 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="userType">I am a:</label>
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

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input 
                id="password" 
                type="password" 
                placeholder="Enter password (min 6 characters)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input 
                id="confirmPassword" 
                type="password" 
                placeholder="Confirm password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                disabled={loading} 
                required 
              />
            </div>

            <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
            
            <p className="toggle-auth">
              Already have an account? <button type="button" onClick={() => { setIsRegister(false); setError(''); setMessage(''); }} disabled={loading}>Login</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input 
                id="email" 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input 
                id="password" 
                type="password" 
                placeholder="Enter password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading} 
                required 
              />
            </div>

            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            
            <p className="toggle-auth">
              Don't have an account? <button type="button" onClick={() => { setIsRegister(true); setError(''); setMessage(''); setEmail(''); setPassword(''); }} disabled={loading}>Register</button>
            </p>
          </form>
        )}

        <div className="login-footer">
          <p>Email + Password Login | No OTP needed</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

