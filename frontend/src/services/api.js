const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000/api';
    }
  }

  return 'https://smart-job-portal-2jkd.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const extractApiError = (data, fallback) => {
  if (!data) {
    return fallback;
  }
  if (typeof data === 'string') {
    return data;
  }
  if (data.error) {
    return data.error;
  }
  if (data.detail) {
    return data.detail;
  }
  if (Array.isArray(data)) {
    return data.join(', ');
  }
  if (typeof data === 'object') {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue)) {
      return firstValue.join(', ');
    }
    if (typeof firstValue === 'string') {
      return firstValue;
    }
    return JSON.stringify(data);
  }
  return fallback;
};

export async function register(name, email, password, userType, companyName = '', companyDetails = {}) {
  const payload = {
    name,
    email,
    password,
    user_type: userType,
    company_name: companyName,
    ...companyDetails,
  };

  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(extractApiError(data, 'Registration failed'));
    }
    const text = await response.text();
    throw new Error(text || 'Registration failed');
  }
  return contentType.includes('application/json') ? response.json() : { message: await response.text() };
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || data.detail || 'Login failed');
    }
    const text = await response.text();
    throw new Error(text || 'Login failed');
  }
  return contentType.includes('application/json') ? response.json() : { message: await response.text() };
}

export async function requestOtp(email) {
  const response = await fetch(`${API_BASE_URL}/auth/request-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || data.detail || 'Failed to send OTP');
    }
    const text = await response.text();
    throw new Error(text || 'Failed to send OTP');
  }
  return contentType.includes('application/json') ? response.json() : { message: await response.text() };
}

export async function verifyOtp(email, otp) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || data.detail || 'Invalid OTP');
    }
    const text = await response.text();
    throw new Error(text || 'Invalid OTP');
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

export async function fetchApplicationsGroupedByJob() {
  const response = await fetch(`${API_BASE_URL}/applications/grouped-by-job/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load applications grouped by job');
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
    let errorMsg = 'Failed to post job';
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('user');
      errorMsg = 'Your session expired. Please log in again as a recruiter.';
    } else {
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.error || JSON.stringify(errorData);
      } catch (e) {
        errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function updateJob(jobId, jobData) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(jobData),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to update job';
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('user');
      errorMsg = 'Your session expired. Please log in again as a recruiter.';
    } else {
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.error || JSON.stringify(errorData);
      } catch (e) {
        errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorMsg);
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

export async function createMessage(applicationId, message) {
  const response = await fetch(`${API_BASE_URL}/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ application: applicationId, content: message }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to send message';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.error || JSON.stringify(errorData);
    } catch (e) {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function fetchApplicationDetail(applicationId) {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load application details');
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

export async function deleteJob(jobId) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    let errorMsg = 'Failed to delete job';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return true;
}

export async function fetchBookmarks() {
  const response = await fetch(`${API_BASE_URL}/bookmarks/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load bookmarks');
  }
  return response.json();
}

export async function addBookmark(jobId) {
  const response = await fetch(`${API_BASE_URL}/bookmarks/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ job: jobId }),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to save bookmark';
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

export async function removeBookmark(bookmarkId) {
  const response = await fetch(`${API_BASE_URL}/bookmarks/${bookmarkId}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    let errorMsg = 'Failed to remove bookmark';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return true;
}

export async function scheduleInterview(payload) {
  const response = await fetch(`${API_BASE_URL}/interviews/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to schedule interview';
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
