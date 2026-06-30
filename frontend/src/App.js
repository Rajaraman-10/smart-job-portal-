import { useEffect, useState } from 'react';
import { API_BASE_URL, fetchJobs, fetchApplications, fetchApplicationsGroupedByJob, fetchApplicationDetail, createApplication, updateApplication, createJob } from './services/api';
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
  const [applications, setApplications] = useState([]);
  const [groupedApplications, setGroupedApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedApplicationDetail, setSelectedApplicationDetail] = useState(null);
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

  const openApplicationDetail = async (applicationId) => {
    try {
      const detail = await fetchApplicationDetail(applicationId);
      setSelectedApplicationId(applicationId);
      setSelectedApplicationDetail(detail);
      setApplications((prev) => prev.map((app) => (app.id === detail.id ? detail : app)));
      setMessage('');
    } catch (error) {
      console.error('Failed to load application detail:', error);
      setMessage(`❌ ${error.message}`);
    }
  };

  const closeApplicationDetail = () => {
    setSelectedApplicationId(null);
    setSelectedApplicationDetail(null);
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

  const recruiterJobs = jobs.filter((job) => Number(job.recruiter) === Number(currentUser?.id));
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
    try {
      const newJob = await createJob({
        title: jobTitle,
        company: jobCompany,
        location: jobLocation,
        salary: jobSalary,
        description: jobDescription,
      });
      setJobs([newJob, ...jobs]);
      setFilteredJobs([newJob, ...filteredJobs]);
      setMessage('✅ Job posted successfully!');
      setJobTitle('');
      setJobDescription('');
      setJobLocation('');
      setJobCompany('');
      setJobSalary('');
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
            <button
              className={userType === 'jobseeker' ? 'active' : ''}
              onClick={() => setUserType('jobseeker')}
            >
              Job Seeker
            </button>
            <button
              className={userType === 'recruiter' ? 'active' : ''}
              onClick={() => setUserType('recruiter')}
            >
              Post Job
            </button>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <div className="nav-user-section">
              <span className="user-info">👤 {userType}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {userType === 'jobseeker' ? (
        <div className="jobseeker-section">
          {/* Hero Section */}
          <section className="hero">
            <div className="hero-content">
              <h1>Find Your Dream Job</h1>
              <p>Search and apply to thousands of jobs from top companies</p>
                <div className="hero-banner">
                    </div>
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <h3>Total Applications</h3>
                  <p>{totalApplications}</p>
                </div>
                <div className="dashboard-card">
                  <h3>Pending</h3>
                  <p>{pendingApplications}</p>
                </div>
                <div className="dashboard-card">
                  <h3>Approved</h3>
                  <p>{approvedApplications}</p>
                </div>
              </div>
              <div className="search-box">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="Job title or company name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button className="search-btn">Search</button>
              </div>
              <div className="search-hint">
                Search by title, company, or location. Use filters below to narrow results.
              </div>
            </div>
          </section>

          <section className="jobs-layout">
            <aside className="sidebar">
              <div className="sidebar-panel">
                <div className="sidebar-header">
                  <h3>Dashboard</h3>
                  <p>Your application summary</p>
                </div>
                <div className="dashboard-summary">
                  <div className="dashboard-card">
                    <h4>Total Applied</h4>
                    <p>{totalApplications}</p>
                  </div>
                  <div className="dashboard-card">
                    <h4>Pending</h4>
                    <p>{pendingApplications}</p>
                  </div>
                  <div className="dashboard-card">
                    <h4>Approved</h4>
                    <p>{approvedApplications}</p>
                  </div>
                </div>
                <div className="sidebar-header">
                  <h3>Categories</h3>
                  <p>Browse jobs by category and refine the list instantly.</p>
                </div>
                <div className="sidebar-category-list">
                  {[
                    'All Jobs',
                    'IT Jobs',
                    'Development',
                    'Design',
                    'Marketing',
                    'Sales',
                  ].map((cat) => (
                    <button
                      key={cat}
                      className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
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
                          <span className="job-company">{job.company}</span>
                        </div>
                        <p className="job-location">📍 {job.location}</p>
                        {job.salary && <p className="job-salary">💰 {job.salary}</p>}
                        <p className="job-description">{job.description.substring(0, 100)}...</p>
                        <div className="job-footer">
                        <button
                              className="apply-btn"
                              onClick={() => setSelectedJobId(job.id)}
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
          <MyApplicationsModule
            applications={applications}
            filteredApplications={filteredApplications}
            showMyApplications={showMyApplications}
            setShowMyApplications={setShowMyApplications}
            applicationsView={applicationsView}
            setApplicationsView={setApplicationsView}
            applicationsSearch={applicationsSearch}
            setApplicationsSearch={setApplicationsSearch}
            totalApplications={totalApplications}
            pendingApplications={pendingApplications}
            viewedApplications={viewedApplications}
            approvedApplications={approvedApplications}
            rejectedApplications={rejectedApplications}
          />
        </div>
      ) : (
        <div className="recruiter-section">
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
                <h2>Post a New Job</h2>
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
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={jobCompany}
                      onChange={(e) => setJobCompany(e.target.value)}
                      placeholder="e.g., Tech Corp"
                      required
                    />
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
                  <button type="submit" className="submit-btn">
                    Post Job
                  </button>
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
                          <div key={application.id} className="applicant-card">
                            <div className="applicant-card-top">
                              <div>
                                <div className="applicant-name">
                                  {application.applicant_name || `Applicant ${application.applicant}`}
                                </div>
                                <div className="applicant-meta">
                                  {application.status} • Applied on {new Date(application.applied_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="applicant-top-actions">
                                <button
                                  className="view-details-btn"
                                  onClick={() => openApplicationDetail(application.id)}
                                >
                                  View details
                                </button>
                                <div className={`status-badge ${application.status.toLowerCase()}`}>
                                  {application.status}
                                </div>
                              </div>
                            </div>
                            <div className="applicant-details-grid">
                              <div>
                                <p><strong>Resume</strong></p>
                                {application.resume_file ? (
                                  <a className="resume-link" href={getResumeUrl(application.resume_file)} target="_blank" rel="noreferrer">
                                    Download PDF
                                  </a>
                                ) : application.resume ? (
                                  <p>{application.resume.substring(0, 140)}{application.resume.length > 140 ? '...' : ''}</p>
                                ) : (
                                  <p>Not provided</p>
                                )}
                              </div>
                              <div>
                                <p><strong>Cover Letter</strong></p>
                                <p>{application.cover_letter || 'Not provided'}</p>
                              </div>
                            </div>
                            {application.status === 'Pending' && (
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
      {selectedJobId && (
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application Details</h2>
              <button className="close-btn" onClick={closeApplicationDetail}>
                ×
              </button>
            </div>
            <div className="modal-body application-detail-modal">
              <p><strong>Applicant:</strong> {selectedApplicationDetail.applicant_name || selectedApplicationDetail.applicant}</p>
              <p><strong>Email:</strong> {selectedApplicationDetail.applicant_email || 'Not provided'}</p>
              <p><strong>Status:</strong> {selectedApplicationDetail.status}</p>
              <p><strong>Applied on:</strong> {new Date(selectedApplicationDetail.applied_at).toLocaleDateString()}</p>
              <div className="form-group">
                <label>Resume</label>
                {selectedApplicationDetail.resume_file ? (
                  <a className="resume-link" href={getResumeUrl(selectedApplicationDetail.resume_file)} target="_blank" rel="noreferrer">
                    Download PDF
                  </a>
                ) : selectedApplicationDetail.resume ? (
                  <p>{selectedApplicationDetail.resume.substring(0, 260)}{selectedApplicationDetail.resume.length > 260 ? '...' : ''}</p>
                ) : (
                  <p>Not provided</p>
                )}
              </div>
              <div className="form-group">
                <label>Cover Letter</label>
                <p>{selectedApplicationDetail.cover_letter || 'Not provided'}</p>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeApplicationDetail}>
                  Close
                </button>
              </div>
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
