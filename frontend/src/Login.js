import React, { useState } from 'react';
import { sendOTP, verifyOTP } from './services/api';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [userType, setUserType] = useState('jobseeker');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [returnedOtp, setReturnedOtp] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setReturnedOtp('');
    setLoading(true);
    try {
      const res = await sendOTP(mobileNumber);
      const code = res.otp_code || '';
      setReturnedOtp(code);
      setOtp(code);
      setMessage('✅ OTP generated successfully. It has been filled in below.');
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await verifyOTP(mobileNumber, otp, userType);
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
        <h2>Login with Phone or Google</h2>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        {returnedOtp && (
          <div className="success-message">
            <strong>OTP:</strong> {returnedOtp}
          </div>
        )}

        <form onSubmit={handleSendOTP}>
          <div className="form-group">
            <label htmlFor="userType">I am a:</label>
            <select id="userType" value={userType} onChange={(e) => setUserType(e.target.value)} disabled={loading}>
              <option value="jobseeker">Job Seeker</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Mobile Number:</label>
            <input id="mobile" type="tel" placeholder="Enter your 10-digit mobile number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} disabled={loading} pattern="[0-9]{10}" required />
          </div>

          <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
        </form>

        <form onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <label htmlFor="otp">Enter OTP:</label>
            <input id="otp" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loading} maxLength="6" pattern="[0-9]{6}" required />
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Login'}</button>
        </form>

        <div className="login-footer">
          <p>For development: if SMS not configured OTP will appear in server logs.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

