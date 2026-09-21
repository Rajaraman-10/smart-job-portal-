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

let refreshPromise = null;

const clearStoredSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userType');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:session-expired'));
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }
        const data = await response.json();
        if (!data.access) {
          return false;
        }
        localStorage.setItem('accessToken', data.access);
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
        }
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const apiFetch = async (url, options = {}) => {
  let response = await fetch(url, options);
  if (response.status !== 401 || url.endsWith('/auth/token/refresh/')) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (refreshed) {
    response = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), ...authHeaders() },
    });
  }

  if (response.status === 401) {
    clearStoredSession();
  }
  return response;
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

export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE_URL}/auth/request-password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleJsonResponse(response, 'Failed to send reset code');
}

export async function resetPassword(email, otp, newPassword) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, new_password: newPassword }),
  });
  return handleJsonResponse(response, 'Failed to reset password');
}

export async function fetchUserProfile() {
  const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load profile');
  }
  return response.json();
}

export async function updateUserProfile(profileData) {
  const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to update profile';
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

export async function loginWithGoogle(idToken, userType) {
  const response = await fetch(`${API_BASE_URL}/auth/google-login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken, user_type: userType }),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || data.detail || 'Google login failed');
    }
    const text = await response.text();
    throw new Error(text || 'Google login failed');
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

export async function fetchApplications(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ).toString();
  const response = await apiFetch(`${API_BASE_URL}/applications/${query ? `?${query}` : ''}`, {
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

export async function fetchRecommendedJobs() {
  const response = await apiFetch(`${API_BASE_URL}/jobs/recommended/`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!response.ok) throw new Error('Failed to load recommended jobs');
  return response.json();
}

export async function compareCandidates(applicationIds) {
  const response = await apiFetch(`${API_BASE_URL}/applications/compare/?ids=${applicationIds.join(',')}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!response.ok) throw new Error('Failed to compare candidates');
  return response.json();
}

export async function submitInterviewFeedback(interviewId, payload) {
  const response = await apiFetch(`${API_BASE_URL}/interviews/${interviewId}/feedback/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(extractApiError(data, 'Failed to save interview feedback'));
  }
  return response.json();
}

export async function exportApplicationsReport(filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ).toString();
  const response = await apiFetch(`${API_BASE_URL}/analytics/export/${query ? `?${query}` : ''}`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Failed to export report');
  return response.blob();
}

export async function fetchSubscriptionPlans() {
  const response = await fetch(`${API_BASE_URL}/subscription-plans/`);
  if (!response.ok) throw new Error('Failed to load subscription plans');
  return response.json();
}

export async function fetchSubscription() {
  const response = await apiFetch(`${API_BASE_URL}/subscription/`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!response.ok) throw new Error('Failed to load subscription');
  return response.json();
}

export async function createSubscriptionTransaction(planId, idempotencyKey) {
  const response = await apiFetch(`${API_BASE_URL}/subscription/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ plan_id: planId, idempotency_key: idempotencyKey }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(extractApiError(data, 'Failed to create subscription checkout'));
  }
  return response.json();
}

export async function fetchAdminDashboard() {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load admin dashboard');
  }
  return response.json();
}

export async function fetchAuditLog() {
  const response = await fetch(`${API_BASE_URL}/admin/audit-log/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load audit log');
  }
  return response.json();
}

export async function fetchUsers() {
  const response = await fetch(`${API_BASE_URL}/users/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load users');
  }
  return response.json();
}

export async function toggleUserActive(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-active/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    let errorMsg = 'Failed to update user status';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      // ignore parse failure
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function fetchCompanies() {
  const response = await fetch(`${API_BASE_URL}/companies/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load companies');
  }
  return response.json();
}

async function handleJsonResponse(response, fallback) {
  if (!response.ok) {
    let errorMsg = fallback;
    try {
      const errorData = await response.json();
      errorMsg = extractApiError(errorData, fallback);
    } catch (e) {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function updateCompany(companyId, payload) {
  const response = await fetch(`${API_BASE_URL}/companies/${companyId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(response, 'Failed to update company profile');
}

export async function uploadCompanyLogo(companyId, file) {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await fetch(`${API_BASE_URL}/companies/${companyId}/logo/`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  return handleJsonResponse(response, 'Failed to upload company logo');
}

export async function submitCompanyVerification(companyId, payload) {
  const response = await fetch(`${API_BASE_URL}/companies/${companyId}/verification/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(response, 'Failed to submit verification');
}

export async function fetchRecruiterProfile() {
  const response = await fetch(`${API_BASE_URL}/auth/recruiter-profile/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  return handleJsonResponse(response, 'Failed to load recruiter profile');
}

export async function updateRecruiterProfile(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/recruiter-profile/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(response, 'Failed to update recruiter profile');
}

export async function verifyRecruiterEmailOtp(otp) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-recruiter-email/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ otp }),
  });
  return handleJsonResponse(response, 'Failed to verify email');
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

export async function fetchConversations() {
  const response = await apiFetch(`${API_BASE_URL}/conversations/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load conversations');
  }
  return response.json();
}

export async function fetchMessages(conversationId) {
  const response = await fetch(`${API_BASE_URL}/messages/?conversation=${conversationId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load messages');
  }
  return response.json();
}

export async function createMessage(applicationId, message) {
  // Ensure a conversation exists for this application. The backend Message API
  // expects a `conversation` field, not `application`. Try to find an existing
  // conversation first, otherwise create one, then post the message.
  try {
    const convResp = await fetch(`${API_BASE_URL}/conversations/?application=${applicationId}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    if (!convResp.ok) throw new Error('Failed to lookup conversation');
    const convList = await convResp.json();
    let conversationId = convList && convList.length ? convList[0].id : null;

    if (!conversationId) {
      const createConvResp = await fetch(`${API_BASE_URL}/conversations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ application: applicationId }),
      });
      if (!createConvResp.ok) {
        const err = await createConvResp.text();
        throw new Error(err || 'Failed to create conversation');
      }
      const created = await createConvResp.json();
      conversationId = created.id;
    }

    const response = await fetch(`${API_BASE_URL}/messages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ conversation: conversationId, content: message }),
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
  } catch (err) {
    throw new Error(err.message || 'Failed to send message');
  }
}

export async function fetchInterviews() {
  const response = await apiFetch(`${API_BASE_URL}/interviews/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    let errorMessage = 'Failed to load interviews';
    try {
      const data = await response.json();
      errorMessage = extractApiError(data, errorMessage);
    } catch {
      // Keep the fallback for non-JSON responses.
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function fetchInterviewByRoom(roomId) {
  const response = await fetch(`${API_BASE_URL}/interviews/${roomId}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load interview room');
  }
  return response.json();
}

export async function fetchApplicationDetail(applicationId) {
  const response = await apiFetch(`${API_BASE_URL}/applications/${applicationId}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    let errorMessage = 'Failed to load application details';
    try {
      const errorData = await response.json();
      errorMessage = extractApiError(errorData, errorMessage);
    } catch {
      // Keep the fallback when the server does not return JSON.
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

async function workflowRequest(url, options = {}, fallbackMessage) {
  const response = await apiFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    let errorMessage = fallbackMessage;
    try {
      errorMessage = extractApiError(await response.json(), fallbackMessage);
    } catch {
      // Keep the fallback for non-JSON responses.
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export function fetchApplicationWorkflow(applicationId) {
  return workflowRequest(`${API_BASE_URL}/applications/${applicationId}/workflow/`, {}, 'Failed to load application workflow');
}

export function publishTechnicalQuiz(applicationId, questions, passingScore = 70) {
  return workflowRequest(
    `${API_BASE_URL}/applications/${applicationId}/workflow/`,
    { method: 'PUT', body: JSON.stringify({ questions, passing_score: passingScore }) },
    'Failed to publish technical quiz',
  );
}

export function submitTechnicalQuiz(applicationId, answers) {
  return workflowRequest(
    `${API_BASE_URL}/applications/${applicationId}/workflow/`,
    { method: 'POST', body: JSON.stringify({ answers }) },
    'Failed to submit technical quiz',
  );
}

export function sendOfferLetter(applicationId, offer) {
  return workflowRequest(
    `${API_BASE_URL}/applications/${applicationId}/offer/`,
    { method: 'PUT', body: JSON.stringify(offer) },
    'Failed to send offer letter',
  );
}

export function respondToOffer(applicationId, offerStatus) {
  return workflowRequest(
    `${API_BASE_URL}/applications/${applicationId}/offer/`,
    { method: 'POST', body: JSON.stringify({ status: offerStatus }) },
    'Failed to update offer letter',
  );
}

export async function fetchQuizByToken(token) {
  const response = await fetch(`${API_BASE_URL}/quiz/access/${encodeURIComponent(token)}/`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Quiz is unavailable');
  return data;
}

export async function submitQuizByToken(token, answers) {
  const response = await fetch(`${API_BASE_URL}/quiz/access/${encodeURIComponent(token)}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Failed to submit quiz');
  return data;
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

export async function uploadJobQuizPdf(jobId, pdf) {
  const formData = new FormData();
  formData.append('pdf', pdf);
  const response = await apiFetch(`${API_BASE_URL}/jobs/${jobId}/quiz-question-set/`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Failed to parse quiz PDF');
  return data;
}

export async function previewJobQuizPdf(pdf) {
  const formData = new FormData();
  formData.append('pdf', pdf);
  const response = await apiFetch(`${API_BASE_URL}/jobs/quiz-question-set/preview/`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Failed to preview quiz PDF');
  return data;
}

export async function updateJobQuizQuestions(jobId, questions) {
  const response = await apiFetch(`${API_BASE_URL}/jobs/${jobId}/quiz-question-set/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ questions }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Failed to publish quiz questions');
  return data;
}

export async function resendQuizEmail(applicationId) {
  const response = await apiFetch(`${API_BASE_URL}/applications/${applicationId}/quiz/resend/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Failed to resend quiz email');
  return data;
}

export async function updateApplicationResume(applicationId, { resumeFile, resumeText } = {}) {
  const formData = new FormData();
  if (resumeFile) {
    formData.append('resume_file', resumeFile);
  }
  if (resumeText !== undefined && resumeText !== null) {
    formData.append('resume', resumeText);
  }
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });
  const responseData = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(responseData.detail || 'Failed to update resume');
    error.code = responseData.code;
    error.resumeEditCount = responseData.resume_edit_count;
    error.freeLimit = responseData.free_limit;
    throw error;
  }
  return responseData;
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
  const response = await apiFetch(`${API_BASE_URL}/bookmarks/`, {
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

export async function fetchResumes() {
  const response = await apiFetch(`${API_BASE_URL}/resumes/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load resumes');
  }
  return response.json();
}

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('profile_photo', file);
  const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });
  if (!response.ok) {
    let errorMsg = 'Failed to upload photo';
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

export async function uploadResume(file, label) {
  const formData = new FormData();
  formData.append('file', file);
  if (label) {
    formData.append('label', label);
  }
  const response = await fetch(`${API_BASE_URL}/resumes/`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });
  if (!response.ok) {
    let errorMsg = 'Failed to upload resume';
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

export async function deleteResume(resumeId) {
  const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    let errorMsg = 'Failed to delete resume';
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

export async function setPrimaryResume(resumeId) {
  const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}/set_primary/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    let errorMsg = 'Failed to set primary resume';
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

export async function fetchNotifications() {
  const response = await apiFetch(`${API_BASE_URL}/notifications/`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load notifications');
  }
  return response.json();
}

export async function markNotificationRead(notificationId) {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/mark-read/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    let errorMsg = 'Failed to mark notification read';
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
