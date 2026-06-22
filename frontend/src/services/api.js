export const API_BASE_URL = 'https://smart-job-portal-2jkd.onrender.com';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function sendOTP(mobileNumber) {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number: mobileNumber }),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to send OTP');
    }
    const text = await response.text();
    throw new Error(text || 'Failed to send OTP');
  }
  return contentType.includes('application/json') ? response.json() : { message: await response.text() };
}

export async function verifyOTP(mobileNumber, otpCode, userType) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number: mobileNumber, otp_code: otpCode, user_type: userType }),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to verify OTP');
    }
    const text = await response.text();
    throw new Error(text || 'Failed to verify OTP');
  }
  return contentType.includes('application/json') ? response.json() : { message: await response.text() };
}

export async function fetchJobs() {
  const response = await fetch(`${API_BASE_URL}/jobs/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load jobs');
  }
  return response.json();
}

export async function fetchApplications() {
  const response = await fetch(`${API_BASE_URL}/applications/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load applications');
  }
  return response.json();
}

export async function fetchAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load analytics');
  }
  return response.json();
}

export async function createJob(jobData) {
  const response = await fetch(`${API_BASE_URL}/jobs/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(jobData),
  });
  if (!response.ok) {
    throw new Error('Failed to post job');
  }
  return response.json();
}

export async function createApplication(application) {
  const isFormData = application instanceof FormData;
  const headers = isFormData
    ? { ...authHeaders() }
    : {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };
  const response = await fetch(`${API_BASE_URL}/applications/`, {
    method: 'POST',
    headers,
    body: isFormData ? application : JSON.stringify(application),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to submit application';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function updateApplication(applicationId, data) {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to update application';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}
