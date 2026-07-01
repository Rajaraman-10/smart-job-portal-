import { useEffect, useState } from 'react';
import { API_BASE_URL, fetchJobs, fetchApplications, fetchApplicationsGroupedByJob, fetchApplicationDetail, createApplication, updateApplication, createJob, updateJob, createMessage } from './services/api';
import Login from './Login';
import MyApplicationsModule from './MyApplicationsModule';
import './App.css';

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
  const [theme, setTheme] = useState('light');

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
  const [message, setMessage] = useState('');
  const [showMyApplications, setShowMyApplications] = useState(true);
  const [applicationsView, setApplicationsView] = useState('all');
  const [applicationsSearch, setApplicationsSearch] = useState('');
  const [recruiterPage, setRecruiterPage] = useState('postJob');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobSalary, setJobSalary] = useState('');
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

  const totalApplications = applications.length;
  const pendingApplications = applications.filter((application) => application.status === 'Pending').length;
  const approvedApplications = applications.filter((application) => application.status === 'Approved').length;
  const viewedApplications = applications.filter((application) => application.status === 'Viewed').length;
  const rejectedApplications = applications.filter((application) => application.status === 'Rejected').length;

  const filteredApplications = applications.filter((application) => {
    const matchesView = applicationsView === 'all' || application.status === applicationsView;
    const query = applicationsSearch.toLowerCase();
    const matchesSearch = !query || [
      application.job_title,
      application.job_company,
      application.status,
    ].join(' ').toLowerCase().includes(query);
    return matchesView && matchesSearch;
  });

  // Check if user is already logged in on component mount
  useEffect(() => {
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUserType = localStorage.getItem('userType');
    const savedUser = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedAccessToken && savedRefreshToken && savedUserType && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const normalizedUserType = savedUserType === 'recruiter' ? 'recruiter' : 'jobseeker';
      setAccessToken(savedAccessToken);
      setRefreshToken(savedRefreshToken);
      setUserType(normalizedUserType);
      setCurrentUser(parsedUser);
      setIsAuthenticated(true);
      if (normalizedUserType === 'recruiter') {
        setRecruiterPage('applications');
      }
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
      if (userType === 'recruiter') {
        refreshGroupedApplications();
      } else {
        setGroupedApplications([]);
      }
    }
  }, [isAuthenticated, userType]);

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

  const handleLoginSuccess = (token, refresh, userType, user) => {
    const normalizedUserType = userType === 'recruiter' ? 'recruiter' : 'jobseeker';
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('userType', normalizedUserType);
    localStorage.setItem('user', JSON.stringify(user || {}));
    setAccessToken(token);
    setRefreshToken(refresh);
    setUserType(normalizedUserType);
    setCurrentUser(user || null);
    setIsAuthenticated(true);
    if (normalizedUserType === 'recruiter') {
      setRecruiterPage('applications');
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
    setIsAuthenticated(false);
    setAnalyticsData(null);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const refreshApplications_func = () => {
    fetchApplications().then(setApplications).catch(console.error);
  };

  const refreshGroupedApplications = async () => {
    try {
      const grouped = await fetchApplicationsGroupedByJob();
      setGroupedApplications(grouped);
      setLastGroupedRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh grouped applications:', error);
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

  const approveApplication = async (applicationId) => {
    try {
      await updateApplication(applicationId, { status: 'Approved' });
      refreshApplications_func();
      refreshGroupedApplications();
      setMessage('✅ Application approved! Email sent to applicant.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      console.error('Approval error:', error);
    }
  };

  const rejectApplication = async (applicationId) => {
    try {
      await updateApplication(applicationId, { status: 'Rejected' });
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
  const recruiterPendingCount = recruiterApplications.filter((application) => application.status === 'Pending').length;
  const recruiterViewedCount = recruiterApplications.filter((application) => application.status === 'Viewed').length;
  const recruiterApprovedCount = recruiterApplications.filter((application) => application.status === 'Approved').length;
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
    if (!applicantName.trim()) {
      setMessage('❌ Please enter your name');
      return;
    }
    if (!applicantEmail.trim()) {
      setMessage('❌ Please enter your email');
      return;
    }

    const payload = {
      job: jobId,
      applicant_name: applicantName.trim(),
      applicant_email: applicantEmail.trim(),
      resume,
      cover_letter: coverLetter,
      status: 'Pending',
    };
    try {
      await createApplication(payload);
      refreshApplications_func();
      triggerApplicationUpdate();
      setMessage('✅ Application submitted successfully!');
      setSelectedJobId(null);
      setApplicantName('');
      setApplicantEmail('');
      setCoverLetter('');
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
    setCompanyLogo(job.company_meta?.logo || '');
    setCompanyCoverImage(job.company_meta?.cover_image || '');
    setCompanyWebsite(job.company_meta?.website || '');
    setCompanyIndustry(job.company_meta?.industry || '');
    setCompanySize(job.company_meta?.size || '');
    setCompanyRating(job.company_meta?.rating?.toString() || '');
    setCompanyEmployees(job.company_meta?.employees || '');
    setCompanyDescription(job.company_meta?.description || '');
    setRecruiterPage('postJob');
    setMessage('Editing existing job. Save changes or cancel to continue.');
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
        <Login onLoginSuccess={handleLoginSuccess} />
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
                  className={recruiterPage === 'postJob' ? 'active' : ''}
                  onClick={() => setRecruiterPage('postJob')}
                >
                  Post Job
                </button>
                <button
                  className={recruiterPage === 'applications' ? 'active' : ''}
                  onClick={() => setRecruiterPage('applications')}
                >
                  Applications
                </button>
                <button
                  className={recruiterPage === 'analytics' ? 'active' : ''}
                  onClick={() => setRecruiterPage('analytics')}
                >
                  Dashboard
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
          <div className="jobseeker-section">
            <section className="hero">
            <div className="hero-content">
              <div className="hero-top">
                <div>
                  <span className="hero-eyebrow">Job Seeker Dashboard</span>
                  <h1>Find the right role for your next step.</h1>
                  <p>Search jobs, manage applications, and move ahead with confidence.</p>
                </div>
                <div className="hero-cta">
                  <span>Welcome back, {currentUser?.first_name || currentUser?.username || 'talent'}.</span>
                  <p>Latest opportunities and application status are updated in real time.</p>
                </div>
              </div>

              <div className="hero-stats-grid">
                <div className="hero-stat-card">
                  <span>Total applications</span>
                  <strong>{totalApplications}</strong>
                </div>
                <div className="hero-stat-card">
                  <span>Pending review</span>
                  <strong>{pendingApplications}</strong>
                </div>
                <div className="hero-stat-card">
                  <span>Viewed by recruiter</span>
                  <strong>{viewedApplications}</strong>
                </div>
                <div className="hero-stat-card">
                  <span>Approved</span>
                  <strong>{approvedApplications}</strong>
                </div>
              </div>

              <div className="search-card">
                <div className="search-box">
                  <div className="search-input-group">
                    <label>What are you looking for?</label>
                    <input
                      type="text"
                      placeholder="Job title or company name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="search-input-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="City, state or remote"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <button className="search-btn">Search</button>
                </div>
                <div className="search-hint">
                  Search by job title, company, or location. Filter results to match your priorities.
                </div>
              </div>
            </div>
          </section>

          <section className="jobs-layout">
            <aside className="sidebar">
              <div className="sidebar-panel dashboard-sidebar">
                <div className="sidebar-brand">
                  <div className="brand-logo">J</div>
                  <div>
                    <h3>Jobie</h3>
                    <p>Job Portal</p>
                  </div>
                </div>
                <div className="sidebar-search-pill">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search Job"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <nav className="sidebar-nav">
                  {['Dashboard', 'Search Job', 'Applications', 'Message', 'Statistics', 'News'].map((item) => (
                    <button key={item} type="button" className="sidebar-nav-btn">
                      {item}
                    </button>
                  ))}
                </nav>
                <div className="sidebar-section">
                  <h4>Saved sections</h4>
                  <p className="sidebar-caption">Quick access to the pages you use most.</p>
                  <div className="sidebar-category-list">
                    {['Saved Jobs', 'Interview Prep', 'Profile', 'Settings'].map((item) => (
                      <button key={item} className="category-btn">
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sidebar-section">
                  <h4>Categories</h4>
                  <p className="sidebar-caption">Browse jobs by category</p>
                  <div className="sidebar-category-list">
                    {['All Jobs', 'IT Jobs', 'Development', 'Design', 'Marketing', 'Sales'].map((cat) => (
                      <button
                        key={cat}
                        className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sidebar-stat">
                  {filteredJobs.length} open role{filteredJobs.length === 1 ? '' : 's'}
                </div>
              </div>
            </aside>

            <div className="jobs-section">
              <div className="jobs-container">
                <h2>Recent Job Openings ({filteredJobs.length})</h2>
                {filteredJobs.length === 0 ? (
                  <p className="no-jobs">No jobs found. Try adjusting your search.</p>
                ) : (
                  <div className="jobs-grid">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="job-card">
                        <div className="job-header">
                          <h3>{job.title}</h3>
                          <button type="button" className="job-company-link" onClick={() => openCompanyPage(job.company)}>
                            {job.company}
                          </button>
                        </div>
                        <p className="job-location">📍 {job.location}</p>
                        {job.salary && <p className="job-salary">💰 {job.salary}</p>}
                        <p className="job-description">{job.description.substring(0, 100)}...</p>
                        <div className="job-footer">
                          <button
                            className="apply-btn"
                            onClick={() => {
                              if (userType === 'jobseeker') {
                                openCompanyPage(job.company);
                              } else {
                                setSelectedJobId(job.id);
                              }
                            }}
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
          </div>
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
        <div className="recruiter-section">
          <div className="recruiter-header">
            <div>
              <span className="section-eyebrow">Recruiter workspace</span>
              <h2>Your hiring dashboard</h2>
              <p>Post jobs, review applicants, and manage hiring from one polished recruiter experience.</p>
            </div>
            <div className="recruiter-header-actions">
              <button
                className={recruiterPage === 'postJob' ? 'page-btn active' : 'page-btn'}
                onClick={() => setRecruiterPage('postJob')}
              >
                Post Job
              </button>
              <button
                className={recruiterPage === 'applications' ? 'page-btn active' : 'page-btn'}
                onClick={() => setRecruiterPage('applications')}
              >
                Applications {recruiterApplicationCount > 0 ? `(${recruiterApplicationCount})` : ''}
              </button>
              <button
                className={recruiterPage === 'analytics' ? 'page-btn active' : 'page-btn'}
                onClick={() => setRecruiterPage('analytics')}
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="recruiter-metrics-grid">
            <div className="metric-card recruiter-metric-card">
              <span>Posted Jobs</span>
              <strong>{recruiterJobs.length}</strong>
            </div>
            <div className="metric-card recruiter-metric-card">
              <span>Total Applicants</span>
              <strong>{recruiterApplicationCount}</strong>
            </div>
            <div className="metric-card recruiter-metric-card">
              <span>Pending Reviews</span>
              <strong>{recruiterPendingCount}</strong>
            </div>
            <div className="metric-card recruiter-metric-card">
              <span>Viewed Applications</span>
              <strong>{recruiterViewedCount}</strong>
            </div>
          </div>

          <div className="page-switcher">
            <button
              className={recruiterPage === 'postJob' ? 'page-btn active' : 'page-btn'}
              onClick={() => setRecruiterPage('postJob')}
            >
              Post Job
            </button>
            <button
              className={recruiterPage === 'applications' ? 'page-btn active' : 'page-btn'}
              onClick={() => setRecruiterPage('applications')}
            >
              Applications {recruiterApplicationCount > 0 ? `(${recruiterApplicationCount})` : ''}
            </button>
            <button
              className={recruiterPage === 'analytics' ? 'page-btn active' : 'page-btn'}
              onClick={() => setRecruiterPage('analytics')}
            >
              Dashboard
            </button>
          </div>
          {recruiterPage === 'postJob' ? (
            <section className="post-job-section">
              <div className="post-job-container">
                <h2>{editingJobId ? 'Edit Job Posting' : 'Post a New Job'}</h2>
                <form onSubmit={postJob} className="job-form">
                  <div className="form-group">
                    <label>Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Senior Developer"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <div className="company-profile-note">
                      Jobs will be posted for <strong>{recruiterCompanyName || 'your company'}</strong>.
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      placeholder="e.g., New York, NY"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Salary</label>
                    <input
                      type="text"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      placeholder="e.g., $80,000 - $120,000 per year"
                    />
                  </div>
                  <div className="form-group">
                    <label>Job Description</label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Describe the job role and requirements"
                      rows="6"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="submit-btn">
                      {editingJobId ? 'Save Changes' : 'Post Job'}
                    </button>
                    {editingJobId && (
                      <button type="button" className="cancel-btn" onClick={resetJobForm}>
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
                <div className="posted-jobs-panel">
                  <h3>Your posted jobs</h3>
                  {recruiterJobStats.length === 0 ? (
                    <p className="no-jobs">You haven't posted any jobs yet.</p>
                  ) : (
                    <div className="posted-jobs-grid">
                      {recruiterJobStats.map(({ job, applicationCount }) => (
                        <div key={job.id} className="posted-job-card">
                          <div className="posted-job-header">
                            <h4>{job.title}</h4>
                            <span className="applications-count">
                              {applicationCount} applicant{applicationCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p>{job.company} • {job.location}</p>
                          {job.salary && <p>Salary: {job.salary}</p>}
                          <p>{job.description.substring(0, 100)}{job.description.length > 100 ? '...' : ''}</p>
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => startJobEdit(job)}
                          >
                            Edit job
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : recruiterPage === 'applications' ? (
            <section className="applications-page">
              <div className="dashboard-header">
                <h2>Applications Received</h2>
                <p>{recruiterApplicationBanner}</p>
                <div className="applications-controls">
                  <button className="refresh-btn" onClick={refreshGroupedApplications}>
                    Refresh applications
                  </button>
                  {lastGroupedRefresh && (
                    <span className="last-updated">
                      Last updated {lastGroupedRefresh.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="applications-panel">
                {displayedRecruiterGroups.length === 0 ? (
                  <p>No applications yet.</p>
                ) : (
                  displayedRecruiterGroups.map(({ job, applications }) => (
                    <div key={job.id} className="job-applications-card">
                      <div className="job-applications-header">
                        <div>
                          <h3>{job.title}</h3>
                          <p className="job-company-label">
                            {job.company} • {job.location} {job.salary && `• ${job.salary}`}
                          </p>
                        </div>
                        <span className="applications-count">
                          {applications.length} applicant{applications.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="applicant-list">
                        {applications.map((application) => (
                          <div key={application.id} className="application-card">
                            <div className="application-card-accent" />
                            <div className="application-card-header">
                              <div className="application-card-title-wrap">
                                <div className="application-card-icon">
                                  {application.applicant_name ? application.applicant_name.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div>
                                  <h3>{application.applicant_name || `Applicant ${application.applicant}`}</h3>
                                  <div className="application-card-row">
                                    <span>{application.job_title || job.title}</span>
                                    <span>{new Date(application.applied_at).toLocaleDateString()}</span>
                                  </div>
                                  <div className={`application-card-unread ${application.unread_message_count ? 'active' : 'inactive'}`}>
                                    {application.unread_message_count ? `${application.unread_message_count} unread` : 'No unread'}
                                  </div>
                                </div>
                              </div>
                              <div className="application-card-footer">
                                <span className={`application-card-tag ${application.status.toLowerCase()}`}>
                                  {application.status}
                                </span>
                                <button
                                  className="view-details-btn"
                                  onClick={() => openApplicationDetail(application.id)}
                                >
                                  View details
                                </button>
                              </div>
                            </div>
                            <div className="application-card-body">
                              <div className="application-card-row">
                                <strong>Resume</strong>
                                {application.resume_file ? (
                                  <a className="resume-link" href={getResumeUrl(application.resume_file)} target="_blank" rel="noreferrer">
                                    Download PDF
                                  </a>
                                ) : application.resume ? (
                                  `${application.resume.substring(0, 140)}${application.resume.length > 140 ? '...' : ''}`
                                ) : (
                                  'Not provided'
                                )}
                              </div>
                              <div className="application-card-row">
                                <strong>Cover Letter</strong>
                                {application.cover_letter || 'Not provided'}
                              </div>
                            </div>
                            {(application.status === 'Pending' || application.status === 'Viewed') && (
                              <div className="applicant-actions">
                                <button
                                  className="approve-btn"
                                  onClick={() => approveApplication(application.id)}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  className="reject-btn"
                                  onClick={() => rejectApplication(application.id)}
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : recruiterPage === 'analytics' ? (
            <section className="analytics-page">
              <div className="analytics-card-grid">
                <div className="analytics-card">
                  <h3>Total Jobs</h3>
                  <p>{analyticsData?.job_count ?? '—'}</p>
                </div>
                <div className="analytics-card">
                  <h3>Total Applications</h3>
                  <p>{analyticsData?.application_count ?? '—'}</p>
                </div>
                <div className="analytics-card">
                  <h3>Active Users</h3>
                  <p>{analyticsData?.user_count ?? '—'}</p>
                </div>
                <div className="analytics-card">
                  <h3>Pending Applications</h3>
                  <p>{analyticsData?.pending_applications ?? '—'}</p>
                </div>
                <div className="analytics-card">
                  <h3>Approved Applications</h3>
                  <p>{analyticsData?.approved_applications ?? '—'}</p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
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
                <div className={`status-pill status-pill--${selectedApplicationDetail.status.toLowerCase()}`}>
                  {selectedApplicationDetail.status}
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
                  {selectedApplicationDetail.status === 'Pending' && (
                    <>
                      <button className="approve-btn" onClick={() => approveApplication(selectedApplicationDetail.id)}>
                        Approve
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

                <section className="detail-section chat-section">
                  <div className="chat-header">
                    <strong>Messages</strong>
                    <span>{selectedApplicationDetail.messages?.length ?? 0} messages</span>
                  </div>
                  {!selectedApplicationDetail ? null : selectedApplicationDetail.status === 'Pending' ? (
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
                      placeholder={selectedApplicationDetail.status === 'Pending' ? 'Wait until this application is reviewed before sending a message.' : 'Write a message to the recruiter/applicant'}
                      rows={3}
                      disabled={selectedApplicationDetail.status === 'Pending'}
                    />
                    <button
                      type="button"
                      className="chat-send-btn"
                      onClick={sendApplicationMessage}
                      disabled={selectedApplicationDetail.status === 'Pending' || !applicationMessageText.trim()}
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
