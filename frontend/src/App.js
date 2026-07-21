import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL, fetchJobs, fetchApplications, fetchApplicationsGroupedByJob, fetchApplicationDetail, createApplication, updateApplication, createJob, updateJob, createMessage, deleteJob, fetchBookmarks, fetchNotifications, fetchUserProfile, updateUserProfile, markNotificationRead, fetchConversations, fetchMessages, fetchInterviews, createConversation, fetchAnalytics, fetchAdminDashboard, fetchUsers, fetchCompanies } from './services/api';
import LampLogin from './components/LampLogin';
import MyApplicationsModule from './MyApplicationsModule';
import BookmarkButton from './BookmarkButton';
import { InterviewScheduler, InterviewSummary } from './InterviewPanel';
import JobPortalDashboard from './JobPortalDashboard';
import RecruiterLayout from './recruiter/pages/RecruiterLayout';
import RecruiterDashboardPage from './recruiter/pages/RecruiterDashboardPage';
import RecruiterPostJobPage from './recruiter/pages/RecruiterPostJobPage';
import RecruiterManageJobsPage from './recruiter/pages/RecruiterManageJobsPage';
import RecruiterApplicationsPage from './recruiter/pages/RecruiterApplicationsPage';
import RecruiterInterviewsPage from './recruiter/pages/RecruiterInterviewsPage';
import RecruiterMessagesPage from './recruiter/pages/RecruiterMessagesPage';
import RecruiterAnalyticsPage from './recruiter/pages/RecruiterAnalyticsPage';
import RecruiterCompanyProfilePage from './recruiter/pages/RecruiterCompanyProfilePage';
import RecruiterPlaceholderPage from './recruiter/pages/RecruiterPlaceholderPage';
import AdminLayout from './admin/pages/AdminLayout';
import AdminDashboardPage from './admin/pages/AdminDashboardPage';
import AdminApplicationsPage from './admin/pages/AdminApplicationsPage';
import AdminUsersPage from './admin/pages/AdminUsersPage';
import AdminCompaniesPage from './admin/pages/AdminCompaniesPage';
import ProtectedRoute from './components/ui/ProtectedRoute';
import './App.css';
import './JobPortalDashboard.css';

function App() {
  // Helper function to construct resume URL
  const getResumeUrl = (resumePath) => {
    if (!resumePath) return '';
    if (resumePath.startsWith('http')) return resumePath;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/media/${resumePath}`;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [userType, setUserType] = useState('jobseeker');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    mobile_number: '',
    headline: '',
    city: '',
    country: '',
    career_level: 'Experienced',
    total_experience: '',
    current_company: '',
    current_job_title: '',
    expected_salary: '',
    preferred_job_type: 'Full-time',
    preferred_work_mode: 'Remote',
    skills: '',
  });
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();
  const location = useLocation();

  // Job and application state
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Jobs');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [resume, setResume] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applicantSkills, setApplicantSkills] = useState('');
  const [message, setMessage] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showMyApplications, setShowMyApplications] = useState(true);
  const [applicationsView, setApplicationsView] = useState('all');
  const [applicationsSearch, setApplicationsSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [recruiterCompanyProfile, setRecruiterCompanyProfile] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobCategory, setJobCategory] = useState('General');
  const [jobRequiredSkills, setJobRequiredSkills] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyCoverImage, setCompanyCoverImage] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyRating, setCompanyRating] = useState('');
  const [companyEmployees, setCompanyEmployees] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [editingJobId, setEditingJobId] = useState(null);
  const [companyPageCompany, setCompanyPageCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [groupedApplications, setGroupedApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedApplicationDetail, setSelectedApplicationDetail] = useState(null);
  const [applicationMessageText, setApplicationMessageText] = useState('');
  const [lastGroupedRefresh, setLastGroupedRefresh] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminCompanies, setAdminCompanies] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const totalApplications = applications.length;
  const pendingApplications = applications.filter((application) => ['APPLIED'].includes(application.status)).length;
  const approvedApplications = applications.filter((application) => ['SELECTED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_SENT', 'JOINED'].includes(application.status)).length;
  const viewedApplications = applications.filter((application) => ['RECRUITER_VIEWED'].includes(application.status)).length;
  const rejectedApplications = applications.filter((application) => ['REJECTED'].includes(application.status)).length;

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    const normalized = status.replace(/_/g, ' ');
    return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const statusViewMap = {
    all: null,
    Pending: ['APPLIED'],
    Viewed: ['RECRUITER_VIEWED'],
    Approved: ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_SENT', 'SELECTED', 'JOINED'],
    Rejected: ['REJECTED'],
  };

  const filteredApplications = applications.filter((application) => {
    const activeStatuses = statusViewMap[applicationsView];
    const matchesView = !activeStatuses || activeStatuses.includes(application.status);
    const query = applicationsSearch.toLowerCase();
    const matchesSearch = !query || [
      application.job_title,
      application.job_company,
      application.status,
    ].join(' ').toLowerCase().includes(query);
    return matchesView && matchesSearch;
  });

  const dashboardProgress = totalApplications > 0
    ? Math.round(((approvedApplications + viewedApplications) / totalApplications) * 100)
    : 0;
  const dashboardTrackerRows = applications.slice(0, 4).map((application) => ({
    id: application.id,
    title: application.job_title || 'Application',
    company: application.job_company || 'Company',
    date: application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'Recently updated',
    status: application.status || 'Pending',
  }));
  const featuredJobs = filteredJobs.slice(0, 4);
  const visibleJobs = showSavedOnly
    ? filteredJobs.filter((job) => bookmarks.some((bookmark) => Number(bookmark.job) === Number(job.id)))
    : filteredJobs;

  const markNotificationsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) => prev.map((notification) => (
        notification.id === notificationId ? { ...notification, is_read: true } : notification
      )));
      setUnreadNotificationCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUserType = localStorage.getItem('userType');
    const savedUser = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedAccessToken && savedRefreshToken && savedUserType && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const normalizedUserType = savedUserType === 'recruiter' || savedUserType === 'admin' ? savedUserType : 'jobseeker';
      setAccessToken(savedAccessToken);
      setRefreshToken(savedRefreshToken);
      setUserType(normalizedUserType);
      setCurrentUser(parsedUser);
      setIsAuthenticated(true);
    }

    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }
  }, []);

  // Fetch data only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs().then(setJobs).catch(console.error);
      refreshApplications_func();
      refreshNotifications();
      if (userType === 'recruiter') {
        refreshGroupedApplications();
      } else {
        setGroupedApplications([]);
        fetchBookmarks().then(setBookmarks).catch(console.error);
      }
    }
  }, [isAuthenticated, userType]);

  useEffect(() => {
    if (!isAuthenticated || userType !== 'admin') {
      return;
    }

    let active = true;
    setAdminLoading(true);
    Promise.all([fetchAdminDashboard(), fetchUsers(), fetchCompanies()])
      .then(([dashboardData, usersData, companiesData]) => {
        if (!active) return;
        setAdminDashboard(dashboardData);
        setAdminUsers(usersData);
        setAdminCompanies(companiesData);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setAdminLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, userType]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (currentUser?.profile) {
      setUserProfile(currentUser.profile);
      return;
    }

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError('');
      try {
        const profile = await fetchUserProfile();
        setUserProfile(profile);
      } catch (error) {
        setProfileError(error.message || 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    setProfileForm({
      mobile_number: userProfile.mobile_number || '',
      headline: userProfile.headline || '',
      city: userProfile.city || '',
      country: userProfile.country || '',
      career_level: userProfile.career_level || 'Experienced',
      total_experience: userProfile.total_experience != null ? String(userProfile.total_experience) : '',
      current_company: userProfile.current_company || '',
      current_job_title: userProfile.current_job_title || '',
      expected_salary: userProfile.expected_salary || '',
      preferred_job_type: userProfile.preferred_job_type || 'Full-time',
      preferred_work_mode: userProfile.preferred_work_mode || 'Remote',
      skills: Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : (userProfile.skills || ''),
    });
  }, [userProfile]);

  useEffect(() => {
    if (isAuthenticated && userType === 'recruiter') {
      const interval = setInterval(refreshGroupedApplications, 15000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated, userType]);

  useEffect(() => {
    if (isAuthenticated && userType === 'jobseeker') {
      const interval = setInterval(refreshApplications_func, 15000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated, userType]);

  useEffect(() => {
    if (!isAuthenticated || userType !== 'recruiter') {
      return;
    }

    let active = true;
    setAnalyticsLoading(true);
    fetchAnalytics()
      .then((data) => {
        if (!active) return;
        setAnalyticsData(data);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setAnalyticsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, userType]);

  const handleLoginSuccess = (token, refresh, loginUserType, user) => {
    const normalizedUserType = loginUserType === 'recruiter' || loginUserType === 'admin' ? loginUserType : 'jobseeker';
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('userType', normalizedUserType);
    localStorage.setItem('user', JSON.stringify(user || {}));
    setAccessToken(token);
    setRefreshToken(refresh);
    setUserType(normalizedUserType);
    setCurrentUser(user || null);
    setUserProfile(user?.profile || null);
    setIsAuthenticated(true);
    if (normalizedUserType === 'recruiter') {
      navigate('/recruiter/dashboard');
    } else if (normalizedUserType === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    setAccessToken(null);
    setRefreshToken(null);
    setUserType('jobseeker');
    setCurrentUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    setAnalyticsData(null);
    setBookmarks([]);
    navigate('/login');
  };

  const parseListInput = (value) => value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const handleProfileFormChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileError('');
    setProfileSaveMessage('');
    setProfileLoading(true);

    try {
      const payload = {
        ...profileForm,
        total_experience: profileForm.total_experience ? Number(profileForm.total_experience) : null,
        skills: parseListInput(profileForm.skills),
      };
      const updatedProfile = await updateUserProfile(payload);
      setUserProfile(updatedProfile);
      const updatedUser = { ...currentUser, profile: updatedProfile };
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfileSaveMessage('✅ Profile updated successfully.');
    } catch (error) {
      setProfileError(error.message || 'Failed to save profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const refreshApplications_func = () => {
    fetchApplications().then(setApplications).catch(console.error);
  };

  // load interviews when recruiter is authenticated
  useEffect(() => {
    if (!isAuthenticated || userType !== 'recruiter') return;
    let active = true;
    fetchInterviews()
      .then((data) => { if (active) setInterviews(data); })
      .catch(console.error);
    return () => { active = false; };
  }, [isAuthenticated, userType]);

  const refreshGroupedApplications = async () => {
    try {
      const grouped = await fetchApplicationsGroupedByJob();
      setGroupedApplications(grouped);
      setLastGroupedRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh grouped applications:', error);
    }
  };

  const refreshNotifications = async () => {
    try {
      const list = await fetchNotifications();
      setNotifications(list);
      setUnreadNotificationCount(list.filter((item) => !item.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const triggerApplicationUpdate = () => {
    const now = Date.now().toString();
    localStorage.setItem('lastApplicationUpdate', now);
    window.dispatchEvent(new Event('applicationUpdate'));
  };

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'lastApplicationUpdate' && userType === 'recruiter') {
        refreshGroupedApplications();
      }
    };

    const onApplicationUpdate = () => {
      if (userType === 'recruiter') {
        refreshGroupedApplications();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('applicationUpdate', onApplicationUpdate);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('applicationUpdate', onApplicationUpdate);
    };
  }, [userType]);

  const openApplicationDetail = async (applicationId) => {
    try {
      const detail = await fetchApplicationDetail(applicationId);
      setSelectedApplicationId(applicationId);
      setSelectedApplicationDetail(detail);
      setApplications((prev) => prev.map((app) => (app.id === detail.id ? detail : app)));
      setMessage('');
      refreshApplications_func();
      if (userType === 'recruiter') {
        refreshGroupedApplications();
      }
    } catch (error) {
      console.error('Failed to load application detail:', error);
      setMessage(`❌ ${error.message}`);
    }
  };

  const closeApplicationDetail = () => {
    setSelectedApplicationId(null);
    setSelectedApplicationDetail(null);
    setApplicationMessageText('');
  };

  const sendApplicationMessage = async () => {
    if (!selectedApplicationDetail || !applicationMessageText.trim()) {
      return;
    }

    try {
      const newMessage = await createMessage(selectedApplicationDetail.id, applicationMessageText.trim());
      setSelectedApplicationDetail((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), newMessage],
      }));
      setApplicationMessageText('');
      setMessage('✅ Message sent');
      setTimeout(() => setMessage(''), 2500);
      refreshApplications_func();
      if (userType === 'recruiter') {
        refreshGroupedApplications();
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    }
  };

  const shortlistApplication = async (applicationId) => {
    try {
      await updateApplication(applicationId, { status: 'SHORTLISTED' });
      refreshApplications_func();
      refreshGroupedApplications();
      setMessage('✅ Application shortlisted. Candidate notified.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      console.error('Shortlist error:', error);
    }
  };

  const rejectApplication = async (applicationId) => {
    try {
      await updateApplication(applicationId, { status: 'REJECTED' });
      refreshApplications_func();
      refreshGroupedApplications();
      setMessage('✅ Application rejected.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      console.error('Rejection error:', error);
    }
  };

  const recruiterCompanyName = currentUser?.company_name || '';

  useEffect(() => {
    if (currentUser?.company_name && !jobCompany) {
      setJobCompany(currentUser.company_name);
    }
  }, [currentUser?.company_name, jobCompany]);

  const recruiterJobs = recruiterCompanyName
    ? jobs.filter((job) => job.company?.toLowerCase() === recruiterCompanyName.toLowerCase())
    : jobs.filter((job) => Number(job.recruiter) === Number(currentUser?.id));
  const recruiterApplications = applications.filter((application) =>
    recruiterJobs.some((job) => Number(job.id) === Number(application.job))
  );

  const applicationsByJob = recruiterJobs.reduce((acc, job) => {
    acc[Number(job.id)] = { job, applications: [] };
    return acc;
  }, {});

  recruiterApplications.forEach((application) => {
    const jobId = Number(application.job);
    if (applicationsByJob[jobId]) {
      applicationsByJob[jobId].applications.push(application);
    }
  });

  const filteredJobsByRecruiter = Object.values(applicationsByJob).filter(
    (group) => group.applications.length > 0
  );

  const jobApplicationCountMap = recruiterApplications.reduce((map, application) => {
    const jobId = Number(application.job);
    map[jobId] = (map[jobId] || 0) + 1;
    return map;
  }, {});

  const recruiterJobStats = recruiterJobs.map((job) => ({
    job,
    applicationCount: jobApplicationCountMap[Number(job.id)] || 0,
  }));

  const displayedRecruiterGroups = groupedApplications.length > 0 ? groupedApplications : filteredJobsByRecruiter;
  const recruiterApplicationCount = displayedRecruiterGroups.reduce(
    (total, group) => total + group.applications.length,
    0
  );
  const recruiterPendingCount = recruiterApplications.filter((application) => application.status === 'APPLIED').length;
  const recruiterViewedCount = recruiterApplications.filter((application) => application.status === 'RECRUITER_VIEWED').length;
  const recruiterApprovedCount = recruiterApplications.filter((application) => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_SENT', 'SELECTED', 'JOINED'].includes(application.status)).length;
  const recruiterApplicationBanner = recruiterApplicationCount > 0
    ? `You have ${recruiterApplicationCount} application${recruiterApplicationCount !== 1 ? 's' : ''} across your posted jobs.`
    : 'No applications yet for your posted jobs.';

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      );
    }

    if (locationFilter) {
      const locationQuery = locationFilter.toLowerCase();
      filtered = filtered.filter((job) => job.location.toLowerCase().includes(locationQuery));
    }

    if (selectedCategory && selectedCategory !== 'All Jobs') {
      const categoryQuery = selectedCategory.toLowerCase().replace(' jobs', '');
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(categoryQuery) ||
          job.company.toLowerCase().includes(categoryQuery) ||
          job.description.toLowerCase().includes(categoryQuery)
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, selectedCategory]);

  const apply = async (jobId) => {
    if (!jobId) {
      setMessage('❌ No job selected to apply for.');
      return;
    }
    if (!applicantName.trim()) {
      setMessage('❌ Please enter your name');
      return;
    }
    if (!applicantEmail.trim()) {
      setMessage('❌ Please enter your email');
      return;
    }

    try {
      const payload = resumeFile
        ? new FormData()
        : {
            job: jobId,
            applicant_name: applicantName.trim(),
            applicant_email: applicantEmail.trim(),
            resume,
            cover_letter: coverLetter,
            skills: applicantSkills.trim(),
            status: 'APPLIED',
          };

      if (resumeFile) {
        payload.append('job', jobId);
        payload.append('applicant_name', applicantName.trim());
        payload.append('applicant_email', applicantEmail.trim());
        payload.append('resume', resume);
        payload.append('resume_file', resumeFile);
        payload.append('cover_letter', coverLetter);
        payload.append('skills', applicantSkills.trim());
        payload.append('status', 'APPLIED');
      }

      await createApplication(payload);
      refreshApplications_func();
      triggerApplicationUpdate();
      setMessage('✅ Application submitted successfully!');
      setSelectedJobId(null);
      setApplicantName('');
      setApplicantEmail('');
      setResume('');
      setResumeFile(null);
      setCoverLetter('');
      setApplicantSkills('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      console.error('Application submission error:', error);
    }
  };

  const resetJobForm = () => {
    setEditingJobId(null);
    setJobTitle('');
    setJobDescription('');
    setJobLocation('');
    setJobCompany(currentUser?.company_name || '');
    setJobSalary('');
    setJobCategory('General');
    setJobRequiredSkills('');
    setCompanyLogo('');
    setCompanyCoverImage('');
    setCompanyWebsite('');
    setCompanyIndustry('');
    setCompanySize('');
    setCompanyRating('');
    setCompanyEmployees('');
    setCompanyDescription('');
  };

  const openCompanyPage = (companyName) => {
    setSelectedJobId(null);
    setCompanyPageCompany(companyName);
  };

  const closeCompanyPage = () => {
    setCompanyPageCompany(null);
    setSelectedJobId(null);
  };

  const companyJobs = companyPageCompany
    ? jobs.filter((job) => job.company.toLowerCase() === companyPageCompany.toLowerCase())
    : [];

  const isEmptyCompanyMeta = (meta) => {
    if (!meta) return true;
    return Object.values(meta).every(
      (value) => value === '' || value === null || value === undefined
    );
  };

  const companyProfile = companyPageCompany
    ? companyJobs[0] && !isEmptyCompanyMeta(companyJobs[0].company_meta)
      ? companyJobs[0].company_meta
      : {
          name: companyPageCompany,
          logo: '',
          cover_image: '',
          website: '',
          industry: '',
          size: '',
          employees: '',
          rating: '',
          description: '',
          location: '',
        }
    : null;

  const showProfileOnboarding = isAuthenticated && !profileLoading && userType !== 'admin' && userProfile && !userProfile.profile_completed;
  const showProfileLoading = isAuthenticated && profileLoading && !userProfile;

  const companySelectedJob = companyPageCompany && selectedJobId
    ? companyJobs.find((job) => job.id === selectedJobId)
    : null;

  const companyGallery = companyProfile?.gallery?.length
    ? companyProfile.gallery
    : companyProfile?.cover_image
    ? [companyProfile.cover_image]
    : [
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1555696954-8b76b42baa74?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      ];

  const companyBadges = [
    ...new Set(
      [
        companyJobs.some((job) => job.location?.toLowerCase().includes('remote')) && 'Remote',
        companyJobs.some((job) => job.location?.toLowerCase().includes('hybrid')) && 'Hybrid',
        companyJobs.some((job) => !job.location?.toLowerCase().includes('remote') && !job.location?.toLowerCase().includes('hybrid')) && 'Onsite',
      ].filter(Boolean)
    ),
  ];

  const companyStats = {
    positions: companyJobs.length,
    employees: companyProfile?.employees || 'N/A',
    rating: companyProfile?.rating ? `${companyProfile.rating}/5` : 'N/A',
    location: companyProfile?.location || 'Remote',
  };

  const startJobEdit = (job) => {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobDescription(job.description || '');
    setJobLocation(job.location || '');
    setJobCompany(job.company || '');
    setJobSalary(job.salary || '');
    setJobCategory(job.category || 'General');
    setJobRequiredSkills(job.required_skills || '');
    setCompanyLogo(job.company_meta?.logo || '');
    setCompanyCoverImage(job.company_meta?.cover_image || '');
    setCompanyWebsite(job.company_meta?.website || '');
    setCompanyIndustry(job.company_meta?.industry || '');
    setCompanySize(job.company_meta?.size || '');
    setCompanyRating(job.company_meta?.rating?.toString() || '');
    setCompanyEmployees(job.company_meta?.employees || '');
    setCompanyDescription(job.company_meta?.description || '');
    navigate('/recruiter/post-job');
    setMessage('Editing existing job. Save changes or cancel to continue.');
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job posting and its applications?')) {
      return;
    }

    try {
      await deleteJob(jobId);
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      setFilteredJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      setMessage('✅ Job deleted successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      console.error(error);
    }
  };

  const postJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDescription || !jobLocation || !jobCompany) {
      setMessage('❌ Please fill all fields');
      return;
    }
    if (!isAuthenticated || userType !== 'recruiter') {
      setMessage('❌ Please log in as a recruiter to post jobs.');
      return;
    }

    const companyMetaPayload = {
      name: jobCompany,
      logo: companyLogo,
      cover_image: companyCoverImage,
      website: companyWebsite,
      industry: companyIndustry,
      size: companySize,
      description: companyDescription,
      employees: companyEmployees,
      rating: companyRating ? Number(companyRating) : null,
      location: jobLocation,
    };

    try {
      if (editingJobId) {
        const updatedJob = await updateJob(editingJobId, {
          title: jobTitle,
          company: jobCompany,
          location: jobLocation,
          salary: jobSalary,
          description: jobDescription,
          company_meta: companyMetaPayload,
        });
        setJobs((prevJobs) => prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
        setFilteredJobs((prevJobs) => prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
        setMessage('✅ Job updated successfully!');
        resetJobForm();
      } else {
        const newJob = await createJob({
          title: jobTitle,
          company: jobCompany,
          location: jobLocation,
          salary: jobSalary,
          description: jobDescription,
          company_meta: companyMetaPayload,
        });
        setJobs([newJob, ...jobs]);
        setFilteredJobs([newJob, ...filteredJobs]);
        setMessage('✅ Job posted successfully!');
        resetJobForm();
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      console.error(error);
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <LampLogin onLoginSuccess={handleLoginSuccess} />
      ) : showProfileLoading ? (
        <div className={`App ${theme}`}>
          <div className="profile-onboarding-screen">
            <div className="onboarding-card">
              <h1>Loading your profile...</h1>
              <p>Please wait while we load your account details.</p>
            </div>
          </div>
        </div>
      ) : showProfileOnboarding ? (
        <div className={`App ${theme}`}>
          <div className="profile-onboarding-screen">
            <div className="onboarding-card">
              <div className="onboarding-header">
                <div>
                  <h1>Complete your professional profile</h1>
                  <p>Finish these details once so you can access the dashboard and job matches.</p>
                </div>
                <div className="profile-status-tag">{userType === 'recruiter' ? 'Recruiter' : 'Job Seeker'}</div>
              </div>
              {profileError && <div className="error-message">{profileError}</div>}
              {profileSaveMessage && <div className="success-message">{profileSaveMessage}</div>}
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile number</label>
                    <input
                      type="tel"
                      value={profileForm.mobile_number}
                      onChange={(e) => handleProfileFormChange('mobile_number', e.target.value)}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Headline</label>
                    <input
                      type="text"
                      value={profileForm.headline}
                      onChange={(e) => handleProfileFormChange('headline', e.target.value)}
                      placeholder="e.g. Product Designer with 5+ years experience"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => handleProfileFormChange('city', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => handleProfileFormChange('country', e.target.value)}
                      placeholder="Country"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Current title</label>
                    <input
                      type="text"
                      value={profileForm.current_job_title}
                      onChange={(e) => handleProfileFormChange('current_job_title', e.target.value)}
                      placeholder="Current job title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Current company</label>
                    <input
                      type="text"
                      value={profileForm.current_company}
                      onChange={(e) => handleProfileFormChange('current_company', e.target.value)}
                      placeholder="Current employer"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Total experience</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={profileForm.total_experience}
                      onChange={(e) => handleProfileFormChange('total_experience', e.target.value)}
                      placeholder="Years"
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected salary</label>
                    <input
                      type="text"
                      value={profileForm.expected_salary}
                      onChange={(e) => handleProfileFormChange('expected_salary', e.target.value)}
                      placeholder="e.g. $90,000 per year"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Preferred job type</label>
                    <select
                      value={profileForm.preferred_job_type}
                      onChange={(e) => handleProfileFormChange('preferred_job_type', e.target.value)}
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Internship</option>
                      <option>Contract</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Preferred work mode</label>
                    <select
                      value={profileForm.preferred_work_mode}
                      onChange={(e) => handleProfileFormChange('preferred_work_mode', e.target.value)}
                    >
                      <option>Remote</option>
                      <option>Hybrid</option>
                      <option>On-site</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Skills</label>
                  <input
                    type="text"
                    value={profileForm.skills}
                    onChange={(e) => handleProfileFormChange('skills', e.target.value)}
                    placeholder="Comma-separated skills"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={profileLoading}>
                    {profileLoading ? 'Saving...' : 'Save profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className={`App ${theme}`}>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">⭐</span>
            vipseekers
          </div>
          <div className="nav-links">
            {userType === 'recruiter' ? (
              <>
                <button
                  className={location.pathname === '/recruiter/post-job' ? 'active' : ''}
                  onClick={() => navigate('/recruiter/post-job')}
                >
                  Post Job
                </button>
                <button
                  className={location.pathname === '/recruiter/applications' ? 'active' : ''}
                  onClick={() => navigate('/recruiter/applications')}
                >
                  Applications
                </button>
                <button
                  className={location.pathname === '/recruiter/dashboard' ? 'active' : ''}
                  onClick={() => navigate('/recruiter/dashboard')}
                >
                  Dashboard
                </button>
              </>
            ) : userType === 'admin' ? (
              <>
                <button
                  className={location.pathname === '/admin/dashboard' ? 'active' : ''}
                  onClick={() => navigate('/admin/dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={location.pathname === '/admin/applications' ? 'active' : ''}
                  onClick={() => navigate('/admin/applications')}
                >
                  Applications
                </button>
                <button
                  className={location.pathname === '/admin/users' ? 'active' : ''}
                  onClick={() => navigate('/admin/users')}
                >
                  Users
                </button>
                <button
                  className={location.pathname === '/admin/companies' ? 'active' : ''}
                  onClick={() => navigate('/admin/companies')}
                >
                  Companies
                </button>
              </>
            ) : (
              <span className="nav-role-badge">🔍 Job Seeker</span>
            )}
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <div className="nav-user-section">
              <span className="user-info">👤 {currentUser?.username || currentUser?.email}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {userType === 'jobseeker' ? (
        <>
          {companyPageCompany ? (
          <div className="company-page-view">
            <div className="company-page-header">
              <div className="company-page-back">
                <button className="back-btn" onClick={closeCompanyPage}>← Back to jobs</button>
              </div>
              <div className="company-page-hero" style={{ backgroundImage: companyProfile?.cover_image ? `url(${companyProfile.cover_image})` : 'linear-gradient(135deg, #2563eb 0%, #0f172a 100%)' }}>
                <div className="company-page-banner">
                  <div className="company-logo-group">
                    {companyProfile?.logo ? (
                      <img src={companyProfile.logo} alt="Company logo" className="company-logo" />
                    ) : (
                      <div className="company-logo company-logo-placeholder">{companyProfile?.name?.charAt(0)}</div>
                    )}
                    <div className="company-title-group">
                      <h2>{companyProfile?.name}</h2>
                      <p>{companyProfile?.industry || 'Company profile'} • {companyProfile?.location || 'Remote'}</p>
                    </div>
                  </div>
                  <div className="company-banner-actions">
                    <div>
                      {companyProfile?.website ? (
                        <a href={companyProfile.website} target="_blank" rel="noreferrer" className="company-website-link">
                          Visit website
                        </a>
                      ) : (
                        <span className="company-no-website">Website not provided</span>
                      )}
                    </div>
                    {companyJobs[0] && (
                      <button className="company-apply-cta" onClick={() => setSelectedJobId(companyJobs[0].id)}>
                        Apply to {companyJobs[0].title}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="company-page-body">
              <div className="company-overview-card">
                <div className="company-row company-row--top">
                  <div>
                    <h3>About {companyProfile?.name}</h3>
                    <p>{companyProfile?.description || 'No company description provided yet.'}</p>
                  </div>
                  <div className="company-badges-row">
                    {companyBadges.map((badge) => (
                      <span key={badge} className="company-badge">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="company-stats-row">
                  <div className="company-stat-card">
                    <span>Open roles</span>
                    <strong>{companyStats.positions}</strong>
                  </div>
                  <div className="company-stat-card">
                    <span>Employees</span>
                    <strong>{companyStats.employees}</strong>
                  </div>
                  <div className="company-stat-card">
                    <span>Rating</span>
                    <strong>{companyStats.rating}</strong>
                  </div>
                  <div className="company-stat-card">
                    <span>Location</span>
                    <strong>{companyStats.location}</strong>
                  </div>
                </div>
                <div className="company-meta-grid">
                  <div className="company-meta-item">
                    <span>Website</span>
                    <strong>{companyProfile?.website ? <a href={companyProfile.website} target="_blank" rel="noreferrer">{companyProfile.website}</a> : 'Not provided'}</strong>
                  </div>
                  <div className="company-meta-item">
                    <span>Industry</span>
                    <strong>{companyProfile?.industry || 'Not provided'}</strong>
                  </div>
                  <div className="company-meta-item">
                    <span>Size</span>
                    <strong>{companyProfile?.size || 'Not provided'}</strong>
                  </div>
                  <div className="company-meta-item">
                    <span>Employees</span>
                    <strong>{companyProfile?.employees || 'Not provided'}</strong>
                  </div>
                  <div className="company-meta-item">
                    <span>Rating</span>
                    <strong>{companyProfile?.rating ? `${companyProfile.rating}/5` : 'No rating'}</strong>
                  </div>
                </div>
              </div>

              <div className="company-gallery-card">
                <h3>Gallery</h3>
                <div className="company-gallery-grid">
                  {companyGallery.map((imageUrl, index) => (
                    <div key={index} className="company-gallery-item">
                      <img src={imageUrl} alt={`Gallery ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="company-jobs-section">
                <div className="company-jobs-header">
                  <h3>Open positions at {companyProfile?.name}</h3>
                  <span>{companyJobs.length} job{companyJobs.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="company-jobs-grid">
                  {companyJobs.length === 0 ? (
                    <div className="empty-state">
                      <p>No jobs currently listed for this company.</p>
                    </div>
                  ) : (
                    companyJobs.map((job) => (
                      <div key={job.id} className="company-job-card">
                        <div>
                          <div className="company-job-company"><strong>{job.title}</strong></div>
                          <p>{job.location} • {job.salary || 'Salary not listed'}</p>
                          <p className="company-job-description">{(job.description || '').substring(0, 120)}{(job.description || '').length > 120 ? '...' : ''}</p>
                        </div>
                        <div className="company-job-actions">
                          <BookmarkButton job={job} bookmarks={bookmarks} onChange={setBookmarks} />
                          <button className="apply-btn" onClick={() => setSelectedJobId(job.id)}>
                            Apply
                          </button>
                          <button className="view-details-btn" onClick={() => setSelectedJobId(job.id)}>
                            View details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {companyJobs.length > 0 && (
                  <div className="company-apply-banner">
                    <div>
                      <p>Ready to join {companyProfile?.name}? Apply to the latest opening now.</p>
                    </div>
                    <button className="apply-btn" onClick={() => setSelectedJobId(companyJobs[0].id)}>
                      Apply to {companyJobs[0].title}
                    </button>
                  </div>
                )}

                {companySelectedJob && (
                  <div className="company-application-panel">
                    <div className="company-application-panel-header">
                      <div>
                        <h3>Apply to {companySelectedJob.title}</h3>
                        <p>{companySelectedJob.company} • {companySelectedJob.location}</p>
                      </div>
                      <button className="close-btn company-panel-close-btn" onClick={() => setSelectedJobId(null)}>
                        ×
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Your Name</label>
                      <input
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Your Email</label>
                      <input
                        type="email"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Resume</label>
                      <textarea
                        value={resume}
                        onChange={(e) => setResume(e.target.value)}
                        placeholder="Paste your resume text here"
                        rows="4"
                      />
                      <div className="file-upload-row">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setResumeFile(e.target.files[0] ?? null)}
                          className="file-input"
                        />
                        <span className="file-hint">Or upload a PDF instead of pasting text.</span>
                      </div>
                      {resumeFile && <p className="file-selected">Selected file: {resumeFile.name}</p>}
                    </div>
                    <div className="form-group">
                      <label>Cover Letter</label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Write a cover letter"
                        rows="4"
                      />
                    </div>
                    <div className="form-group">
                      <label>Skills</label>
                      <textarea
                        value={applicantSkills}
                        onChange={(e) => setApplicantSkills(e.target.value)}
                        placeholder="e.g. React, Node.js, Python"
                        rows="3"
                      />
                    </div>
                    <div className="company-application-panel-footer">
                      <button className="cancel-btn" onClick={() => setSelectedJobId(null)}>
                        Cancel
                      </button>
                      <button className="submit-btn" onClick={() => apply(companySelectedJob.id)}>
                        Submit Application
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <JobPortalDashboard
            currentUser={currentUser}
            applications={applications}
            bookmarks={bookmarks}
            jobs={filteredJobs}
            onApplyJob={setSelectedJobId}
            onLogout={handleLogout}
          />
        )}
          <MyApplicationsModule
            applications={applications}
            filteredApplications={filteredApplications}
            showMyApplications={showMyApplications}
            setShowMyApplications={setShowMyApplications}
            applicationsView={applicationsView}
            setApplicationsView={setApplicationsView}
            applicationsSearch={applicationsSearch}
            setApplicationsSearch={setApplicationsSearch}
            onViewDetails={openApplicationDetail}
          />
        </>
      ) : (
        <Routes>
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} userType={userType} allowedRole="admin" />}>
            <Route path="/admin/*" element={<AdminLayout currentUser={currentUser} onLogout={handleLogout} />}>
              <Route
                index
                element={<Navigate to="dashboard" replace />}
              />
              <Route
                path="dashboard"
                element={<AdminDashboardPage dashboard={adminDashboard} loading={adminLoading} />}
              />
              <Route
                path="applications"
                element={<AdminApplicationsPage applications={applications} loading={adminLoading} onViewApplication={openApplicationDetail} />}
              />
              <Route
                path="users"
                element={<AdminUsersPage users={adminUsers} loading={adminLoading} />}
              />
              <Route
                path="companies"
                element={<AdminCompaniesPage companies={adminCompanies} loading={adminLoading} />}
              />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} userType={userType} allowedRole="recruiter" />}>
            <Route path="/recruiter/*" element={<RecruiterLayout currentUser={currentUser} onLogout={handleLogout} />}>
              <Route
                index
                element={<Navigate to="dashboard" replace />}
              />
              <Route
                path="dashboard"
                element={
                  <RecruiterDashboardPage
                    jobs={recruiterJobs}
                    applications={recruiterApplications}
                    loading={analyticsLoading}
                    onQuickAction={(slug) => {
                      if (slug === 'post-job') navigate('/recruiter/post-job');
                      if (slug === 'applications') navigate('/recruiter/applications');
                      if (slug === 'interviews') navigate('/recruiter/interviews');
                    }}
                  />
                }
              />
              <Route
                path="post-job"
                element={
                  <RecruiterPostJobPage
                    form={{
                      jobTitle,
                      jobDescription,
                      jobLocation,
                      jobCompany,
                      jobSalary,
                      jobCategory,
                      jobRequiredSkills,
                      companyLogo,
                      companyCoverImage,
                      companyWebsite,
                      companyIndustry,
                      companySize,
                      companyRating,
                      companyEmployees,
                      companyDescription,
                    }}
                    onFieldChange={(field, value) => {
                      const setters = {
                        jobTitle: setJobTitle,
                        jobDescription: setJobDescription,
                        jobLocation: setJobLocation,
                        jobCompany: setJobCompany,
                        jobSalary: setJobSalary,
                        jobCategory: setJobCategory,
                        jobRequiredSkills: setJobRequiredSkills,
                        companyLogo: setCompanyLogo,
                        companyCoverImage: setCompanyCoverImage,
                        companyWebsite: setCompanyWebsite,
                        companyIndustry: setCompanyIndustry,
                        companySize: setCompanySize,
                        companyRating: setCompanyRating,
                        companyEmployees: setCompanyEmployees,
                        companyDescription: setCompanyDescription,
                      };
                      setters[field]?.(value);
                    }}
                    onSubmit={postJob}
                    onCancel={() => {
                      resetJobForm();
                      navigate('/recruiter/dashboard');
                    }}
                    isEditing={Boolean(editingJobId)}
                    recruiterCompanyName={recruiterCompanyName}
                  />
                }
              />
              <Route
                path="manage-jobs"
                element={
                  <RecruiterManageJobsPage
                    jobs={recruiterJobs}
                    loading={recruiterJobs.length === 0 && isAuthenticated}
                    onEdit={(job) => {
                      if (job) startJobEdit(job);
                      else {
                        resetJobForm();
                        navigate('/recruiter/post-job');
                      }
                    }}
                    onDelete={(job) => handleDeleteJob(job.id)}
                  />
                }
              />
              <Route
                path="applications"
                element={
                  <RecruiterApplicationsPage
                    applications={recruiterApplications}
                    loading={applications.length === 0 && isAuthenticated}
                    onViewProfile={openApplicationDetail}
                    onShortlist={shortlistApplication}
                    onReject={rejectApplication}
                    onSchedule={() => navigate('/recruiter/interviews')}
                    onQuickAction={(slug) => navigate(`/recruiter/${slug}`)}
                  />
                }
              />
              <Route
                path="interviews"
                element={
                  <RecruiterInterviewsPage
                    interviews={interviews}
                    loading={interviews.length === 0 && isAuthenticated}
                    onStart={(interview) => {
                      // placeholder: open meeting link or mark started
                      window.open(interview.meeting_link || '#', '_blank');
                    }}
                    onReschedule={(interview) => {
                      // simple reschedule flow: navigate to application detail
                      openApplicationDetail(interview.application);
                    }}
                    onCancel={async (interview) => {
                      try {
                        // mark interview cancelled via API
                        const token = localStorage.getItem('accessToken');
                        await fetch(`${API_BASE_URL}/interviews/${interview.id}/`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify({ status: 'CANCELLED' }),
                        });
                        setInterviews((prev) => prev.filter((i) => i.id !== interview.id));
                        setMessage('✅ Interview cancelled');
                        setTimeout(() => setMessage(''), 2500);
                      } catch (err) {
                        setMessage(`❌ ${err.message}`);
                      }
                    }}
                  />
                }
              />
              <Route
                path="messages"
                element={
                  <RecruiterMessagesPage
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={setSelectedConversation}
                    messages={conversationMessages}
                    onSendMessage={() => {} }
                    loading={conversations.length === 0 && isAuthenticated}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                  />
                }
              />
              <Route
                path="company-profile"
                element={
                  <RecruiterCompanyProfilePage
                    companyProfile={recruiterCompanyProfile}
                    loading={!recruiterCompanyProfile && isAuthenticated}
                    onSave={(profile) => { setRecruiterCompanyProfile(profile); }}
                  />
                }
              />
              <Route
                path="analytics"
                element={<RecruiterAnalyticsPage analytics={analyticsData} loading={analyticsLoading} />}
              />
              <Route
                path="subscription"
                element={<RecruiterPlaceholderPage title="Subscription" description="Subscription is coming soon." actionLabel="Upgrade now" onAction={() => {}} />}
              />
              <Route
                path="settings"
                element={<RecruiterPlaceholderPage title="Settings" description="Recruiter settings are coming soon." actionLabel="Manage settings" onAction={() => {}} />}
              />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={userType === 'admin' ? '/admin/dashboard' : '/recruiter/dashboard'} replace />} />
        </Routes>
      )}

      {/* Application Modal */}
      {!companyPageCompany && selectedJobId && (
        <div className="modal-overlay" onClick={() => setSelectedJobId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apply for Job</h2>
              <button className="close-btn" onClick={() => setSelectedJobId(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Email</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div className="form-group">
                <label>Resume</label>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder="Paste your resume text here"
                  rows="5"
                />
                <div className="file-upload-row">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setResumeFile(e.target.files[0] ?? null)}
                    className="file-input"
                  />
                  <span className="file-hint">Or upload a PDF instead of pasting text.</span>
                </div>
                {resumeFile && <p className="file-selected">Selected file: {resumeFile.name}</p>}
              </div>
              <div className="form-group">
                <label>Cover Letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Write a cover letter"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Skills</label>
                <textarea
                  value={applicantSkills}
                  onChange={(e) => setApplicantSkills(e.target.value)}
                  placeholder="e.g. React, Node.js, Python"
                  rows="3"
                />
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setSelectedJobId(null)}>
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  onClick={() => apply(selectedJobId)}
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Alert */}
      {message && <div className="alert">{message}</div>}

      {selectedApplicationId && selectedApplicationDetail && (
        <div className="modal-overlay" onClick={closeApplicationDetail}>
          <div className="modal application-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">Application Detail</span>
                <h2>{selectedApplicationDetail.job_title || 'Application details'}</h2>
                <p className="modal-subtitle">{selectedApplicationDetail.job_company || 'Review the candidate profile and continue the conversation.'}</p>
              </div>
              <button className="close-btn" onClick={closeApplicationDetail}>
                ×
              </button>
            </div>
            <div className="modal-body application-detail-grid">
              <div className="detail-summary">
                <div className={`status-pill status-pill--${selectedApplicationDetail.status.toLowerCase().replace(/[_\s]+/g, '-')}`}>
                  {formatStatus(selectedApplicationDetail.status)}
                </div>
                <div className="detail-row">
                  <span>Applicant</span>
                  <strong>{selectedApplicationDetail.applicant_name || selectedApplicationDetail.applicant}</strong>
                </div>
                <div className="detail-row">
                  <span>Email</span>
                  <strong>{selectedApplicationDetail.applicant_email || 'Not provided'}</strong>
                </div>
                <div className="detail-row">
                  <span>Applied On</span>
                  <strong>{new Date(selectedApplicationDetail.applied_at).toLocaleDateString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Viewed</span>
                  <strong>{selectedApplicationDetail.viewed_at ? new Date(selectedApplicationDetail.viewed_at).toLocaleString() : 'Not yet'}</strong>
                </div>
                <div className="detail-actions">
                      {['APPLIED', 'RECRUITER_VIEWED'].includes(selectedApplicationDetail.status) && (
                    <>
                      <button className="approve-btn" onClick={() => shortlistApplication(selectedApplicationDetail.id)}>
                        Shortlist
                      </button>
                      <button className="reject-btn" onClick={() => rejectApplication(selectedApplicationDetail.id)}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="detail-body">
                <section className="detail-section">
                  <h3>Resume</h3>
                  {selectedApplicationDetail.resume_file ? (
                    <a className="resume-link" href={getResumeUrl(selectedApplicationDetail.resume_file)} target="_blank" rel="noreferrer">
                      Download PDF
                    </a>
                  ) : selectedApplicationDetail.resume ? (
                    <p>{selectedApplicationDetail.resume}</p>
                  ) : (
                    <p>Resume not provided.</p>
                  )}
                </section>

                <section className="detail-section">
                  <h3>Cover Letter</h3>
                  <p>{selectedApplicationDetail.cover_letter || 'Not provided'}</p>
                </section>

                <section className="detail-section">
                  <h3>Skills</h3>
                  <p>{selectedApplicationDetail.skills || 'Not provided'}</p>
                </section>

                <section className="detail-section">
                  <h3>Interview planning</h3>
                  <InterviewSummary interviews={selectedApplicationDetail.interviews || []} />
                  {userType === 'recruiter' ? (
                    <InterviewScheduler
                      applicationId={selectedApplicationDetail.id}
                      existingInterviews={selectedApplicationDetail.interviews || []}
                      onScheduled={(interview) => {
                        setSelectedApplicationDetail((prev) => ({
                          ...prev,
                          interviews: [...(prev?.interviews || []), interview],
                        }));
                        setApplications((prev) => prev.map((application) => (
                          application.id === selectedApplicationDetail.id
                            ? { ...application, interviews: [...(application.interviews || []), interview] }
                            : application
                        )));
                      }}
                    />
                  ) : null}
                </section>

                <section className="detail-section chat-section">
                  <div className="chat-header">
                    <strong>Messages</strong>
                    <span>{selectedApplicationDetail.messages?.length ?? 0} messages</span>
                  </div>
                  {!selectedApplicationDetail ? null : selectedApplicationDetail.status === 'APPLIED' ? (
                    <div className="chat-disabled-note">
                      Messaging opens once the recruiter has reviewed this application.
                    </div>
                  ) : null}
                  <div className="chat-messages">
                    {(selectedApplicationDetail.messages || []).length > 0 ? (
                      selectedApplicationDetail.messages.map((msg) => (
                        <div key={msg.id} className={`chat-message ${msg.sender === currentUser?.id ? 'sent' : 'received'}`}>
                          <div className="chat-message-header">
                            <span className="chat-sender">{msg.sender_name}</span>
                            <span className="chat-time">{new Date(msg.created_at).toLocaleString()}</span>
                          </div>
                          <div className="chat-content">{msg.content}</div>
                          <div className="chat-message-meta">
                            {msg.sender === currentUser?.id ? (
                              msg.is_read ? <span className="chat-read">Seen</span> : <span className="chat-sent">Sent</span>
                            ) : (
                              !msg.is_read && <span className="chat-unread">New</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-chat">No messages yet. Start the conversation here.</div>
                    )}
                  </div>
                  <div className="chat-input-row">
                    <textarea
                      value={applicationMessageText}
                      onChange={(e) => setApplicationMessageText(e.target.value)}
                      placeholder={selectedApplicationDetail.status === 'APPLIED' ? 'Wait until this application is reviewed before sending a message.' : 'Write a message to the recruiter/applicant'}
                      rows={3}
                      disabled={selectedApplicationDetail.status === 'APPLIED'}
                    />
                    <button
                      type="button"
                      className="chat-send-btn"
                      onClick={sendApplicationMessage}
                      disabled={selectedApplicationDetail.status === 'APPLIED' || !applicationMessageText.trim()}
                    >
                      Send message
                    </button>
                  </div>
                </section>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeApplicationDetail}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    )}
  </>
  );
}

export default App;
