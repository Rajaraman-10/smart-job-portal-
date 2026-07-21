
import React, { useState } from "react";
import {
  LayoutGrid,
  Building2,
  Briefcase,
  User,
  CalendarDays,
  MessagesSquare,
  Bell,
  Star,
  Search,
  LogOut,
  ChevronRight,
} from "lucide-react";

const SIDEBAR = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Search Jobs", icon: Search },
  { label: "Saved Jobs", icon: Star },
  { label: "Applied Jobs", icon: Briefcase },
  { label: "Interviews", icon: CalendarDays },
  { label: "Notifications", icon: Bell },
  { label: "Messages", icon: MessagesSquare },
  { label: "Profile", icon: User },
  { label: "Settings", icon: LogOut },
];

const FEATURED_JOBS_DEFAULT = [
  {
    position: "Python Developer",
    company: "Google",
    location: "Coimbatore, Tamil Nadu",
    salary: "₹5 - 8 LPA",
    tags: ["Python", "Django", "SQL"],
    match: 89,
    age: "2 days ago",
  },
  {
    position: "Backend Developer",
    company: "Microsoft",
    location: "Bangalore, Karnataka",
    salary: "₹6 - 10 LPA",
    tags: ["Java", "Spring Boot", "MySQL"],
    match: 85,
    age: "1 day ago",
  },
  {
    position: "Software Engineer Intern",
    company: "Swiggy",
    location: "Remote",
    salary: "₹15,000 - 20,000 / month",
    tags: ["JavaScript", "React", "Node.js"],
    match: 78,
    age: "3 days ago",
  },
];

const INTERVIEWS_DEFAULT = [
  {
    time: "10:00 AM - 10:45 AM",
    date: "18 Jul 2026, Friday",
    name: "Rajaraman R",
    title: "Python Developer",
    method: "Google Meet",
  },
  {
    time: "01:00 PM - 01:45 PM",
    date: "18 Jul 2026, Friday",
    name: "Kaviya S",
    title: "Python Developer",
    method: "Google Meet",
  },
  {
    time: "02:00 PM - 02:45 PM",
    date: "19 Jul 2026, Saturday",
    name: "Vijay Prakash",
    title: "Frontend Developer",
    method: "Google Meet",
  },
];

const RECENT_APPLICATIONS_DEFAULT = [
  { job: "Python Developer", company: "Google", status: "Under Review", appliedOn: "16 Jul 2026" },
  { job: "Java Developer", company: "Infosys", status: "Shortlisted", appliedOn: "14 Jul 2026" },
  { job: "Data Analyst", company: "TCS", status: "Rejected", appliedOn: "10 Jul 2026" },
  { job: "Frontend Developer", company: "Zoho", status: "Interview Scheduled", appliedOn: "08 Jul 2026" },
];

const RECOMMENDED_COURSES = [
  { title: "Django for Beginners", progress: 90 },
  { title: "React - The Complete Guide", progress: 75 },
  { title: "SQL Bootcamp", progress: 60 },
  { title: "AWS Cloud Practitioner", progress: 40 },
];

const STAGES = [
  { label: "Applied", complete: true },
  { label: "Recruiter Viewed", complete: true },
  { label: "Shortlisted", complete: false },
  { label: "Interview", complete: false },
  { label: "Offer", complete: false },
];

export default function JobPortalDashboard({ currentUser = {}, applications = [], bookmarks = [], jobs = [], onApplyJob, onLogout }) {
  const [search, setSearch] = useState("");
  const [openSection, setOpenSection] = useState("Search Jobs");
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const displayName = currentUser?.full_name || currentUser?.company_name || currentUser?.username || "Rajaram";
  const totalApplied = applications.length;
  const totalSaved = bookmarks.length;
  const totalShortlisted = applications.filter((app) => ["Viewed", "Approved", "Shortlisted", "Interview Scheduled"].includes(app.status)).length;
  const totalInterviews = applications.filter((app) => Array.isArray(app.interviews) && app.interviews.length > 0).length;

  const searchResults = jobs.length > 0
    ? jobs
        .filter((job) =>
          job.title?.toLowerCase().includes(search.toLowerCase()) ||
          job.company?.toLowerCase().includes(search.toLowerCase()) ||
          job.location?.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 6)
    : FEATURED_JOBS_DEFAULT;

  const recommendedJobs = searchResults.length > 0
    ? searchResults.slice(0, 3).map((job) => ({
        id: job.id,
        position: job.title || "Unknown Role",
        company: job.company || "Company",
        location: job.location || "Remote",
        salary: job.salary || "Not listed",
        tags: job.company_meta?.skills || [],
        match: 80,
        age: job.created_at ? new Date(job.created_at).toLocaleDateString() : "1 day ago",
      }))
    : FEATURED_JOBS_DEFAULT;

  const savedJobs = bookmarks.length > 0
    ? bookmarks.map((bookmark) => ({
        id: bookmark.job?.id || bookmark.job,
        title: bookmark.job?.title || "Saved Job",
        company: bookmark.job?.company || "Company",
        location: bookmark.job?.location || "Remote",
        salary: bookmark.job?.salary || "Not listed",
      }))
    : [];

  const appliedJobs = applications.length > 0
    ? applications.map((application) => ({
        id: application.id,
        title: application.job_title || "Applied Role",
        company: application.job_company || "Company",
        status: application.status || "Pending",
        appliedOn: application.applied_at ? new Date(application.applied_at).toLocaleDateString() : "Recently",
      }))
    : [];

  const recentApplications = appliedJobs.length > 0
    ? appliedJobs.slice(0, 4)
    : RECENT_APPLICATIONS_DEFAULT;

  const upcomingInterviews = applications.filter((app) => app.status === "INTERVIEW_SCHEDULED").map((application) => ({
    job: application.job_title || "Interview Role",
    company: application.job_company || "Company",
    date: application.interviews?.[0]?.interview_date || "TBD",
    time: application.interviews?.[0]?.interview_time || "TBD",
    status: application.status,
  }));

  const messageThreads = applications.slice(0, 4).map((application) => ({
    id: application.id,
    title: application.job_title || "Message Thread",
    company: application.job_company || "Company",
    latest: application.messages?.length > 0 ? application.messages[application.messages.length - 1].content : "No messages yet",
    unread: application.unread_message_count || 0,
  }));

  const renderSectionHeader = () => {
    if (activeMenu === "Dashboard") return null;
    return (
      <div className="dashboard-section-header">
        <div>
          <h2>{activeMenu}</h2>
          <p className="dashboard-section-description">
            {activeMenu === "Search Jobs" && "Browse open roles and apply with one click."}
            {activeMenu === "Saved Jobs" && "Your bookmarked positions are saved here."}
            {activeMenu === "Applied Jobs" && "Track the status of your job applications."}
            {activeMenu === "Interviews" && "Upcoming interviews and next steps."}
            {activeMenu === "Notifications" && "Recent updates from recruiters and your applications."}
            {activeMenu === "Messages" && "Messages from recruiters and hiring teams."}
            {activeMenu === "Profile" && "Review and update your candidate profile."}
            {activeMenu === "Settings" && "Account and application preferences."}
          </p>
        </div>
        {activeMenu === "Search Jobs" && (
          <button className="dashboard-cta-btn" type="button" onClick={() => setSearch("")}>Clear search</button>
        )}
      </div>
    );
  };

  const renderMainContent = () => {
    switch (activeMenu) {
      case "Search Jobs":
        return (
          <>
            {renderSectionHeader()}
            <div className="dashboard-job-grid">
              {searchResults.length === 0 ? (
                <div className="empty-state">No jobs match your search.</div>
              ) : (
                searchResults.map((job) => (
                  <div key={job.id || `${job.position}-${job.company}`} className="dashboard-job-card">
                    <div>
                      <h3>{job.title || job.position}</h3>
                      <p>{job.company}</p>
                      <p className="dashboard-job-meta">{job.location} • {job.salary}</p>
                    </div>
                    <div className="dashboard-job-card-footer">
                      <button className="dashboard-action-btn" type="button" onClick={() => onApplyJob?.(job.id)}>
                        Apply
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        );
      case "Saved Jobs":
        return (
          <>
            {renderSectionHeader()}
            {savedJobs.length === 0 ? (
              <div className="empty-state">No saved jobs yet. Use the Search Jobs section to bookmark roles.</div>
            ) : (
              <div className="dashboard-card-list">
                {savedJobs.map((job) => (
                  <div key={job.id} className="dashboard-card dashboard-simple-card">
                    <div>
                      <h3>{job.title}</h3>
                      <p>{job.company}</p>
                    </div>
                    <button className="dashboard-action-btn" type="button" onClick={() => onApplyJob?.(job.id)}>
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case "Applied Jobs":
        return (
          <>
            {renderSectionHeader()}
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {appliedJobs.length === 0 ? (
                    <tr><td colSpan="4">No applications yet.</td></tr>
                  ) : (
                    appliedJobs.map((app, index) => (
                      <tr key={`${app.id}-${index}`}>
                        <td>{app.title}</td>
                        <td>{app.company}</td>
                        <td>{app.status}</td>
                        <td>{app.appliedOn}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      case "Interviews":
        return (
          <>
            {renderSectionHeader()}
            {upcomingInterviews.length === 0 ? (
              <div className="empty-state">No interviews scheduled yet.</div>
            ) : (
              <div className="dashboard-card-list">
                {upcomingInterviews.map((interview, index) => (
                  <div key={`${interview.job}-${index}`} className="dashboard-card dashboard-simple-card">
                    <div>
                      <h3>{interview.job}</h3>
                      <p>{interview.company}</p>
                      <p>{interview.date} • {interview.time}</p>
                    </div>
                    <span className="dashboard-stage-pill">{interview.status}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case "Notifications":
        return (
          <>
            {renderSectionHeader()}
            <div className="dashboard-card-list">
              <div className="dashboard-card dashboard-simple-card">
                <div>
                  <h3>New application update</h3>
                  <p>Your application has been viewed by the recruiter.</p>
                </div>
                <span className="dashboard-stage-pill">Today</span>
              </div>
              <div className="dashboard-card dashboard-simple-card">
                <div>
                  <h3>Profile suggestion</h3>
                  <p>Complete your profile to improve your match rate.</p>
                </div>
                <span className="dashboard-stage-pill">Yesterday</span>
              </div>
            </div>
          </>
        );
      case "Messages":
        return (
          <>
            {renderSectionHeader()}
            <div className="dashboard-card-list">
              {messageThreads.length === 0 ? (
                <div className="empty-state">No message threads yet.</div>
              ) : (
                messageThreads.map((thread) => (
                  <div key={thread.id} className="dashboard-card dashboard-simple-card">
                    <div>
                      <h3>{thread.title}</h3>
                      <p>{thread.company}</p>
                      <p>{thread.latest}</p>
                    </div>
                    {thread.unread > 0 && <span className="dashboard-stage-pill">{thread.unread} new</span>}
                  </div>
                ))
              )}
            </div>
          </>
        );
      case "Profile":
        return (
          <>
            {renderSectionHeader()}
            <div className="dashboard-card dashboard-simple-card">
              <div>
                <h3>{displayName}</h3>
                <p>{currentUser.email || "No email provided"}</p>
                <p>{currentUser?.company_name ? "Job Seeker" : "Candidate"}</p>
              </div>
            </div>
          </>
        );
      case "Settings":
        return (
          <>
            {renderSectionHeader()}
            <div className="dashboard-card dashboard-simple-card">
              <div>
                <h3>Account settings</h3>
                <p>Manage account preferences and security options.</p>
              </div>
              <button className="dashboard-action-btn" type="button">Edit settings</button>
            </div>
          </>
        );
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => (
    <>
      <div className="dashboard-grid dashboard-kpi-grid">
        {[
          { label: "Applied Jobs", value: totalApplied, accent: "#2563eb", bg: "#eff6ff" },
          { label: "Shortlisted", value: totalShortlisted, accent: "#16a34a", bg: "#dcfce7" },
          { label: "Interviews", value: totalInterviews, accent: "#7c3aed", bg: "#ede9fe" },
          { label: "Saved Jobs", value: totalSaved, accent: "#ea580c", bg: "#ffedd5" },
          { label: "Profile Completion", value: "85%", accent: "#0f766e", bg: "#ccfbf1" },
        ].map((card) => (
          <div key={card.label} className="dashboard-kpi-card">
            <div className="dashboard-kpi-icon" style={{ background: card.bg, color: card.accent }}>
              <Briefcase size={18} />
            </div>
            <div>
              <div className="dashboard-kpi-label">{card.label}</div>
              <div className="dashboard-kpi-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid dashboard-top-row">
        <section className="dashboard-card dashboard-recommended-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Recommended Jobs</h2>
              <p>Jobs matched to your skills and preferences.</p>
            </div>
            <button className="dashboard-link-btn" type="button" onClick={() => setActiveMenu("Search Jobs")}>View all</button>
          </div>
          <div className="recommended-list">
            {recommendedJobs.map((job, index) => (
              <div key={`${job.position}-${index}`} className="recommended-job-card">
                <div className="recommended-job-header">
                  <div>
                    <div className="recommended-job-title">{job.position}</div>
                    <div className="recommended-company">{job.company}</div>
                  </div>
                  <div className="recommended-job-match">{job.match}% Match</div>
                </div>
                <div className="recommended-job-details">
                  <span>{job.location}</span>
                  <span>{job.salary}</span>
                </div>
                <div className="recommended-job-tags">
                  {job.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="recommended-job-tag">{tag}</span>
                  ))}
                </div>
                <div className="recommended-job-footer">
                  <span>{job.age}</span>
                  <button className="dashboard-action-btn" type="button" onClick={() => onApplyJob?.(job.id)}>
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card dashboard-progress-card">
          <div className="dashboard-card-header">
            <h2>Application Progress</h2>
          </div>
          <div className="dashboard-progress-list">
            {STAGES.map((stage) => (
              <div key={stage.label} className={`dashboard-progress-step ${stage.complete ? "complete" : "pending"}`}>
                <div className="dashboard-progress-dot" />
                <div>
                  <div>{stage.label}</div>
                  <div className="dashboard-progress-status">{stage.complete ? "Complete" : "Pending"}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card dashboard-interview-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Upcoming Interview</h2>
              <p>Prepare for your next conversation.</p>
            </div>
            <button className="dashboard-link-btn" type="button" onClick={() => setActiveMenu("Interviews")}>View all</button>
          </div>
          <div className="dashboard-interview-list">
            {upcomingInterviews.length === 0 ? (
              <div className="empty-state">No interviews scheduled.</div>
            ) : (
              upcomingInterviews.map((item, index) => (
                <div key={`${item.job}-${index}`} className="dashboard-interview-item">
                  <div>
                    <div className="dashboard-interview-time">{item.time}</div>
                    <div className="dashboard-interview-date">{item.date}</div>
                  </div>
                  <div>
                    <div className="dashboard-interview-name">{item.job}</div>
                    <div className="dashboard-interview-title">{item.company}</div>
                  </div>
                  <div className="dashboard-interview-method">{item.status || "Scheduled"}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="dashboard-grid dashboard-bottom-row">
        <section className="dashboard-card dashboard-table-card">
          <div className="dashboard-card-header">
            <h2>Recent Applications</h2>
            <button className="dashboard-link-btn" type="button" onClick={() => setActiveMenu("Applied Jobs")}>View all</button>
          </div>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app, index) => (
                  <tr key={`${app.job}-${index}`}>
                    <td>{app.job}</td>
                    <td>{app.company}</td>
                    <td><span className={`dashboard-stage-pill ${app.status.toLowerCase().replace(/ /g, '-')}`}>{app.status}</span></td>
                    <td>{app.appliedOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-card dashboard-summary-card dashboard-score-card">
          <div className="dashboard-card-header">
            <h2>Your Profile</h2>
          </div>
          <div className="dashboard-score-section">
            <div className="dashboard-score-label">Profile Completion</div>
            <div className="dashboard-score-value">85%</div>
            <div className="dashboard-score-bar">
              <div className="dashboard-score-fill" style={{ width: '85%' }} />
            </div>
          </div>
          <div className="dashboard-score-section">
            <div className="dashboard-score-label">Resume Score</div>
            <div className="dashboard-score-value dashboard-score-value-large">82 / 100</div>
            <p>Good score! Improve your resume to get better opportunities.</p>
            <button className="dashboard-cta-btn dashboard-improve-btn" type="button">Improve Resume</button>
          </div>
          <div className="dashboard-course-list">
            <div className="dashboard-course-header">
              <h3>Recommended Courses</h3>
              <button className="dashboard-link-btn" type="button">View all</button>
            </div>
            {RECOMMENDED_COURSES.map((course) => (
              <div key={course.title} className="dashboard-course-row">
                <div>
                  <strong>{course.title}</strong>
                </div>
                <span>{course.progress}% Complete</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );

  return (
    <div className="dashboard-root">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo-row">
          <div className="dashboard-logo">VS</div>
          <div>
            <div className="dashboard-brand">Vipseekers</div>
          </div>
        </div>

        <div className="dashboard-sidebar-search">
          <Search size={16} />
          <input
            placeholder="Search jobs, skills, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="dashboard-menu">
          {SIDEBAR.map((item) => {
            const isExpanded = item.children && openSection === item.label;
            const active = activeMenu === item.label;
            return (
              <div key={item.label} className="dashboard-menu-group">
                <button
                  type="button"
                  className={`dashboard-menu-item ${active ? "active" : ""}`}
                  onClick={() => {
                    setActiveMenu(item.label);
                    if (item.children) setOpenSection(item.label);
                  }}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                  {item.children && <ChevronRight size={14} className={isExpanded ? "expanded" : ""} />}
                </button>
                {item.children && isExpanded && (
                  <div className="dashboard-submenu">
                    {item.children.map((child) => (
                      <button
                        key={child}
                        type="button"
                        className={`dashboard-submenu-item ${activeMenu === child ? "active" : ""}`}
                        onClick={() => setActiveMenu(child)}
                      >
                        {child}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="dashboard-logout-btn" type="button" onClick={() => onLogout?.()}>
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <div className="dashboard-frame">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1>Welcome back, {displayName}!</h1>
            <p>Find the best job opportunities and build your dream career.</p>
          </div>

          <div className="dashboard-header-right">
            <button className="dashboard-cta-btn" type="button" onClick={() => setActiveMenu("Search Jobs")}>Search Jobs</button>
            <button className="dashboard-icon-btn" type="button"><Bell size={18} /></button>
            <button className="dashboard-icon-btn" type="button"><MessagesSquare size={18} /></button>
            <div className="dashboard-user-pill">
              <div className="dashboard-user-avatar">{displayName.charAt(0)}</div>
              <div>
                <div className="dashboard-user-name">{displayName}</div>
                <div className="dashboard-user-role">Job Seeker</div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
