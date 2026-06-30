import React from 'react';

const statusMeta = {
  Pending: { label: 'Pending Review', tone: 'pending' },
  Viewed: { label: 'Viewed', tone: 'viewed' },
  Approved: { label: 'Approved', tone: 'approved' },
  Rejected: { label: 'Rejected', tone: 'rejected' },
};

function MyApplicationsModule({
  applications,
  filteredApplications,
  showMyApplications,
  setShowMyApplications,
  applicationsView,
  setApplicationsView,
  applicationsSearch,
  setApplicationsSearch,
  totalApplications,
  pendingApplications,
  viewedApplications,
  approvedApplications,
  rejectedApplications,
}) {
  const summaryCards = [
    { label: 'Total', value: totalApplications, tone: 'primary' },
    { label: 'Pending', value: pendingApplications, tone: 'pending' },
    { label: 'Viewed', value: viewedApplications, tone: 'viewed' },
    { label: 'Approved', value: approvedApplications, tone: 'approved' },
  ];

  return (
    <section className="my-applications-section">
      <div className="jobs-container applications-module">
        <div className="applications-module-header">
          <div>
            <div className="applications-module-eyebrow">Career Dashboard</div>
            <h2>My Applications</h2>
            <p className="applications-subtitle">
              Keep track of every opportunity, recruiter update, and decision in one place.
            </p>
          </div>
          <button
            className="toggle-applications-btn"
            onClick={() => setShowMyApplications((prev) => !prev)}
          >
            {showMyApplications ? 'Hide applications' : 'Show applications'}
          </button>
        </div>

        <div className="applications-metrics">
          {summaryCards.map((item) => (
            <div key={item.label} className={`metric-card metric-${item.tone}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        {showMyApplications ? (
          <>
            <div className="applications-toolbar">
              <div className="search-field">
                <span className="search-field-icon">⌕</span>
                <input
                  type="text"
                  className="search-input applications-search"
                  placeholder="Search by job, company, or status"
                  value={applicationsSearch}
                  onChange={(e) => setApplicationsSearch(e.target.value)}
                />
              </div>
              <div className="applications-filters">
                {['all', 'Pending', 'Viewed', 'Approved', 'Rejected'].map((filter) => (
                  <button
                    key={filter}
                    className={`filter-chip ${applicationsView === filter ? 'active' : ''}`}
                    onClick={() => setApplicationsView(filter)}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </button>
                ))}
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="empty-state">
                <h3>No applications yet</h3>
                <p>Apply to a role to start building your professional application history.</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="empty-state">
                <h3>No matches found</h3>
                <p>Try a different keyword or status filter.</p>
              </div>
            ) : (
              <div className="applications-grid">
                {filteredApplications.map((application) => {
                  const meta = statusMeta[application.status] || statusMeta.Pending;
                  return (
                    <article key={application.id} className="application-card">
                      <div className="application-card-accent" />
                      <div className="application-card-header">
                        <div className="application-card-title-wrap">
                          <div className="application-card-icon">↗</div>
                          <div>
                            <h3>{application.job_title || `Job ${application.job}`}</h3>
                            <p className="job-company">{application.job_company}</p>
                          </div>
                        </div>
                        <span className={`status-badge ${application.status.toLowerCase()}`}>
                          {application.status}
                        </span>
                      </div>

                      <div className="application-card-body">
                        <div className="application-card-row">
                          <span>Applied</span>
                          <strong>{new Date(application.applied_at).toLocaleDateString()}</strong>
                        </div>
                        <div className="application-card-row">
                          <span>Status</span>
                          <strong>{meta.label}</strong>
                        </div>
                        {application.viewed_at && (
                          <div className="application-card-row">
                            <span>Updated</span>
                            <strong>{new Date(application.viewed_at).toLocaleString()}</strong>
                          </div>
                        )}
                      </div>

                      <div className="application-card-footer">
                        <span className="application-card-tag">Application</span>
                        <span className="application-card-tag subtle">{application.status === 'Viewed' ? 'Reviewed' : 'In progress'}</span>
                      </div>

                      <p className="application-note">
                        <strong>Cover letter:</strong> {application.cover_letter || 'Not provided'}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="applications-hidden-box">
            <p>Your applications are hidden. Click the button to show them.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default MyApplicationsModule;
