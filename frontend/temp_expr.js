const foo =       {userType === 'jobseeker' ? (
        companyPageCompany ? (
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
                          <button className="view-details-btn" onClick={() => openApplicationDetail(job.id)}>
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
        </div>;