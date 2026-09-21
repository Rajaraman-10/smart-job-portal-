
import React, { useRef, useState } from "react";
import {
  LayoutGrid,
  Briefcase,
  User,
  CalendarDays,
  MessagesSquare,
  Bell,
  Star,
  Search,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Moon,
  Sun,
  UserCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Camera,
} from "lucide-react";
import BookmarkButton from "./BookmarkButton";
import logoMark from "./assets/logo-mark.png";

const SIDEBAR = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Search Jobs", icon: Search },
  { label: "Saved Jobs", icon: Star },
  { label: "My Applications", icon: Briefcase },
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

const RECENT_APPLICATIONS_DEFAULT = [
  { job: "Python Developer", company: "Google", status: "Under Review", appliedOn: "16 Jul 2026" },
  { job: "Java Developer", company: "Infosys", status: "Shortlisted", appliedOn: "14 Jul 2026" },
  { job: "Data Analyst", company: "TCS", status: "Rejected", appliedOn: "10 Jul 2026" },
  { job: "Frontend Developer", company: "Zoho", status: "Interview Scheduled", appliedOn: "08 Jul 2026" },
];

const AVATAR_PALETTE = [
  { bg: "#dbeafe", fg: "#1d4ed8" },
  { bg: "#dcfce7", fg: "#15803d" },
  { bg: "#ede9fe", fg: "#6d28d9" },
  { bg: "#ffedd5", fg: "#c2410c" },
  { bg: "#fce7f3", fg: "#be185d" },
  { bg: "#ccfbf1", fg: "#0f766e" },
];

function getAvatarStyle(seed) {
  const str = String(seed || "?");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return { background: palette.bg, color: palette.fg };
}

function Avatar({ src, initial, className }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <div className={className}>
        <img src={src} alt="" onError={() => setBroken(true)} />
      </div>
    );
  }
  return <div className={className}>{initial}</div>;
}

function getInitials(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function formatRelativeDate(input) {
  if (!input) return "Recently";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

export default function JobPortalDashboard({
  currentUser = {},
  applications = [],
  bookmarks = [],
  jobs = [],
  onApplyJob,
  onLogout,
  userProfile = null,
  profileForm = {},
  onProfileFieldChange,
  onSaveProfile,
  profileLoading = false,
  profileSaveMessage = '',
  profileError = '',
  resumes = [],
  onUploadResume,
  onDeleteResume,
  onSetPrimaryResume,
  resumeManagerStatus = '',
  profilePhotoUrl = '',
  onUploadProfilePhoto,
  photoUploadStatus = '',
  notifications = [],
  unreadNotificationCount = 0,
  onMarkNotificationRead,
  conversations = [],
  conversationsLoading = false,
  selectedConversation = null,
  conversationMessages = [],
  messagesLoading = false,
  messageSendError = '',
  onSelectConversation,
  onSendMessage,
  onBookmarksChange,
  theme = 'light',
  onToggleTheme,
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [workModeFilter, setWorkModeFilter] = useState("All");
  const [experienceFilter, setExperienceFilter] = useState("All");
  const [minSalaryFilter, setMinSalaryFilter] = useState("");
  const [postedWithinFilter, setPostedWithinFilter] = useState("Any");
  const [openSection, setOpenSection] = useState("Search Jobs");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const resumeInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const displayName = currentUser?.full_name || currentUser?.company_name || currentUser?.username || "Rajaram";
  const greetingName = displayName.includes("@") ? displayName.split("@")[0] : displayName.split(" ")[0];
  const totalApplied = applications.length;
  const totalSaved = bookmarks.length;
  const totalViewed = applications.filter((app) => app.status && !["Applied", "Under Review", "APPLIED"].includes(app.status)).length;
  const totalShortlisted = applications.filter((app) => ["Viewed", "Approved", "Shortlisted", "Interview Scheduled"].includes(app.status)).length;
  const totalInterviews = applications.filter((app) => Array.isArray(app.interviews) && app.interviews.length > 0).length;
  const totalUnreadMessages = conversations.reduce((sum, c) => sum + (c.unread_messages || 0), 0);
  const profileStrength = userProfile?.profile_completion_score ?? 0;
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  const primaryResume = resumes.find((r) => r.is_primary) || resumes[0] || null;
  const skillsList = Array.isArray(userProfile?.skills) && userProfile.skills.length > 0
    ? userProfile.skills
    : (profileForm.skills || "").split(",").map((s) => s.trim()).filter(Boolean);

  const profileChecklist = [
    { label: "Basic Information", done: Boolean(profileForm.mobile_number && profileForm.city) },
    { label: "Skills", done: skillsList.length > 0 },
    { label: "Experience", done: Boolean(profileForm.total_experience || profileForm.current_job_title) },
    { label: "Resume", done: Boolean(primaryResume) },
  ];

  const jobCategories = ["All", ...Array.from(new Set(jobs.map((job) => job.category).filter(Boolean)))];

  const searchResults = jobs.length > 0
    ? jobs
        .filter((job) =>
          job.title?.toLowerCase().includes(search.toLowerCase()) ||
          job.company?.toLowerCase().includes(search.toLowerCase()) ||
          job.location?.toLowerCase().includes(search.toLowerCase())
        )
        .filter((job) => categoryFilter === "All" || job.category === categoryFilter)
        .filter((job) => workModeFilter === "All" || job.work_mode === workModeFilter)
        .filter((job) => experienceFilter === "All" || job.experience_level === experienceFilter)
        .filter((job) => {
          if (!minSalaryFilter) return true;
          const min = Number(minSalaryFilter);
          if (!min) return true;
          return job.salary_max != null && job.salary_max >= min;
        })
        .filter((job) => {
          if (postedWithinFilter === "Any") return true;
          if (!job.posted_at) return true;
          const days = Number(postedWithinFilter);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          return new Date(job.posted_at) >= cutoff;
        })
        .slice(0, 6)
    : FEATURED_JOBS_DEFAULT;

  const activeFilterCount = [
    categoryFilter !== "All",
    workModeFilter !== "All",
    experienceFilter !== "All",
    Boolean(minSalaryFilter),
    postedWithinFilter !== "Any",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setWorkModeFilter("All");
    setExperienceFilter("All");
    setMinSalaryFilter("");
    setPostedWithinFilter("Any");
  };

  const getJobSkillList = (job) => {
    const fromRequired = (job.required_skills || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (fromRequired.length > 0) return fromRequired;
    return Array.isArray(job.company_meta?.skills) ? job.company_meta.skills : [];
  };

  const computeSkillMatch = (job) => {
    const jobSkills = getJobSkillList(job).map((s) => s.toLowerCase());
    const mySkills = (Array.isArray(userProfile?.skills) ? userProfile.skills : []).map((s) => String(s).toLowerCase());
    if (jobSkills.length === 0 || mySkills.length === 0) return null;
    const matchedCount = jobSkills.filter((s) => mySkills.includes(s)).length;
    return Math.round((matchedCount / jobSkills.length) * 100);
  };

  const recommendedJobs = searchResults.length > 0
    ? searchResults.slice(0, 3).map((job) => ({
        id: job.id,
        position: job.title || "Unknown Role",
        company: job.company || "Company",
        location: job.location || "Remote",
        salary: job.salary || "Not listed",
        category: job.category || "",
        logo: job.company_meta?.logo || "",
        isVerified: Boolean(job.company_meta?.is_verified),
        tags: getJobSkillList(job),
        match: computeSkillMatch(job),
        age: job.posted_at ? formatRelativeDate(job.posted_at) : "1 day ago",
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
        appliedRelative: application.applied_at ? formatRelativeDate(application.applied_at) : "Recently",
        aiMatchScore: application.ai_match_score,
        aiMatchedSkills: application.ai_matched_skills || [],
        aiMissingSkills: application.ai_missing_skills || [],
      }))
    : [];

  const recentApplications = appliedJobs.length > 0
    ? appliedJobs.slice(0, 4)
    : RECENT_APPLICATIONS_DEFAULT.map((app) => ({ ...app, appliedRelative: app.appliedOn }));

  const upcomingInterviews = applications.filter((app) => app.status === "INTERVIEW_SCHEDULED").map((application) => ({
    job: application.job_title || "Interview Role",
    company: application.job_company || "Company",
    date: application.interviews?.[0]?.interview_date || "TBD",
    time: application.interviews?.[0]?.interview_time || "TBD",
    status: application.status,
  }));

  const handleResumeFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onUploadResume?.(file, file.name);
    event.target.value = "";
  };

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onUploadProfilePhoto?.(file);
    event.target.value = "";
  };

  const renderSectionHeader = () => {
    if (activeMenu === "Dashboard") return null;
    return (
      <div className="dashboard-section-header">
        <div>
          <h2>{activeMenu}</h2>
          <p className="dashboard-section-description">
            {activeMenu === "Search Jobs" && "Browse open roles and apply with one click."}
            {activeMenu === "Saved Jobs" && "Your bookmarked positions are saved here."}
            {activeMenu === "My Applications" && "Track the status of your job applications."}
            {activeMenu === "Interviews" && "Upcoming interviews and next steps."}
            {activeMenu === "Notifications" && "Recent updates from recruiters and your applications."}
            {activeMenu === "Messages" && "Messages from recruiters and hiring teams."}
            {activeMenu === "Profile" && "Review and update your candidate profile."}
            {activeMenu === "Settings" && "Account and application preferences."}
          </p>
        </div>
        {activeMenu === "Search Jobs" && (
          <div className="dashboard-search-filters">
            <select
              className="dashboard-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {jobCategories.map((category) => (
                <option key={category} value={category}>{category === "All" ? "All categories" : category}</option>
              ))}
            </select>
            <select
              className="dashboard-category-select"
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
            >
              <option value="All">Any work mode</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
            <select
              className="dashboard-category-select"
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
            >
              <option value="All">Any experience</option>
              <option value="Entry">Entry Level</option>
              <option value="Mid">Mid Level</option>
              <option value="Senior">Senior Level</option>
              <option value="Lead">Lead / Manager</option>
            </select>
            <select
              className="dashboard-category-select"
              value={postedWithinFilter}
              onChange={(e) => setPostedWithinFilter(e.target.value)}
            >
              <option value="Any">Any time</option>
              <option value="1">Past 24 hours</option>
              <option value="7">Past week</option>
              <option value="30">Past month</option>
            </select>
            <input
              type="number"
              min="0"
              className="dashboard-category-select dashboard-salary-input"
              placeholder="Min salary"
              value={minSalaryFilter}
              onChange={(e) => setMinSalaryFilter(e.target.value)}
            />
            <button
              className="dashboard-cta-btn"
              type="button"
              onClick={clearAllFilters}
            >
              Clear filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
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
                      <div className="dashboard-job-card-topline">
                        <span className="dashboard-job-card-badge">Featured</span>
                        <span className="dashboard-job-card-age">{job.posted_at ? formatRelativeDate(job.posted_at) : job.age}</span>
                      </div>
                      <h3>{job.title || job.position}</h3>
                      <p>
                        {job.company}
                        {job.company_meta?.is_verified && (
                          <span className="verified-badge" title="Verified by Smart Job Portal">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        )}
                      </p>
                      <p className="dashboard-job-meta">{job.location} • {job.salary}</p>
                      {job.tags?.length > 0 && (
                        <div className="dashboard-job-card-tag-row">
                          {job.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="dashboard-job-card-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="dashboard-job-card-footer">
                      <button
                        className="dashboard-action-btn"
                        type="button"
                        onClick={() => onApplyJob?.(job.id)}
                        disabled={job.id == null}
                      >
                        {job.id == null ? "Unavailable" : "Apply Now"}
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
      case "My Applications":
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
                    <th>AI Match</th>
                  </tr>
                </thead>
                <tbody>
                  {appliedJobs.length === 0 ? (
                    <tr><td colSpan="5">No applications yet.</td></tr>
                  ) : (
                    appliedJobs.map((app, index) => (
                      <tr key={`${app.id}-${index}`}>
                        <td>{app.title}</td>
                        <td>{app.company}</td>
                        <td>{app.status}</td>
                        <td>{app.appliedOn}</td>
                        <td>
                          {app.aiMatchScore != null ? (
                            <div className="dashboard-ai-match-cell">
                              <span className="dashboard-ai-match-badge">{Math.round(app.aiMatchScore)}%</span>
                              {(app.aiMatchedSkills.length > 0 || app.aiMissingSkills.length > 0) && (
                                <div className="dashboard-ai-skill-breakdown">
                                  {app.aiMatchedSkills.length > 0 && (
                                    <p><strong>Matched:</strong> {app.aiMatchedSkills.join(", ")}</p>
                                  )}
                                  {app.aiMissingSkills.length > 0 && (
                                    <p><strong>Missing:</strong> {app.aiMissingSkills.join(", ")}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="dashboard-ai-match-badge dashboard-ai-match-badge--pending">—</span>
                          )}
                        </td>
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
            {notifications.length === 0 ? (
              <div className="empty-state">You're all caught up. No notifications yet.</div>
            ) : (
              <div className="dashboard-card-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`dashboard-card dashboard-simple-card dashboard-notification-card ${notification.is_read ? "" : "unread"}`}
                    onClick={() => !notification.is_read && onMarkNotificationRead?.(notification.id)}
                    role={notification.is_read ? undefined : "button"}
                  >
                    <div>
                      <h3>{notification.title}</h3>
                      <p>{notification.message}</p>
                    </div>
                    <span className="dashboard-stage-pill">
                      {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : ""}
                      {!notification.is_read && <span className="dashboard-unread-dot" />}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case "Messages": {
        const handleSubmitMessage = (event) => {
          event.preventDefault();
          if (!messageDraft.trim()) return;
          onSendMessage?.(messageDraft.trim());
          setMessageDraft("");
        };

        return (
          <>
            {renderSectionHeader()}
            <div className="messages-layout">
              <div className="dashboard-card messages-thread-list">
                {conversationsLoading ? (
                  <div className="empty-state">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="empty-state">No conversations yet. They'll appear once a recruiter reviews one of your applications.</div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`messages-thread-item ${selectedConversation?.id === conversation.id ? "active" : ""}`}
                      onClick={() => onSelectConversation?.(conversation)}
                    >
                      <div>
                        <div className="messages-thread-name">{conversation.recruiter_name || "Recruiter"}</div>
                        <div className="messages-thread-job">{conversation.job_title}</div>
                      </div>
                      {conversation.unread_messages > 0 && (
                        <span className="dashboard-sidebar-badge">{conversation.unread_messages}</span>
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="dashboard-card messages-thread-panel">
                {!selectedConversation ? (
                  <div className="empty-state">Select a conversation to view messages.</div>
                ) : (
                  <>
                    <div className="messages-thread-header">
                      <h3>{selectedConversation.recruiter_name || "Recruiter"}</h3>
                      <p>{selectedConversation.job_title}</p>
                    </div>
                    <div className="messages-thread-body">
                      {messagesLoading ? (
                        <div className="empty-state">Loading messages...</div>
                      ) : conversationMessages.length === 0 ? (
                        <div className="empty-state">No messages yet. Say hello!</div>
                      ) : (
                        conversationMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`messages-bubble ${msg.sender_type === "jobseeker" ? "mine" : ""}`}
                          >
                            <p>{msg.content}</p>
                            <span>{msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <form className="messages-compose-form" onSubmit={handleSubmitMessage}>
                      <textarea
                        rows="2"
                        value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                        placeholder="Write a message"
                      />
                      <button className="dashboard-action-btn" type="submit">Send</button>
                    </form>
                    {messageSendError && <p className="profile-resume-status">{messageSendError}</p>}
                  </>
                )}
              </div>
            </div>
          </>
        );
      }
      case "Profile": {
        const locationLabel = [userProfile?.city, userProfile?.country].filter(Boolean).join(", ") || "Location not set";
        const experienceLabel = userProfile?.career_level === "Fresher"
          ? "Fresher"
          : (userProfile?.total_experience != null ? `${userProfile.total_experience} yrs` : "—");

        const handleSubmitEdit = (event, closeAfter) => {
          event.preventDefault();
          onSaveProfile?.(event);
          closeAfter();
        };

        return (
          <>
            {renderSectionHeader()}

            <div className="dashboard-card profile-header-card">
              <div className="profile-header-top">
                <div className="profile-header-identity">
                  <div className="profile-avatar-upload-wrap">
                    <Avatar src={profilePhotoUrl} initial={displayName.charAt(0)} className="dashboard-user-avatar profile-avatar-lg" />
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoFileChange}
                    />
                    <button
                      type="button"
                      className="profile-avatar-upload-btn"
                      onClick={() => photoInputRef.current?.click()}
                      aria-label="Change profile photo"
                    >
                      <Camera size={13} />
                    </button>
                  </div>
                  <div>
                    <div className="profile-name-row">
                      <h3>{displayName}</h3>
                      <span className="dashboard-job-card-badge">Job Seeker</span>
                    </div>
                    <p className="profile-contact-line">{currentUser.email || "No email provided"}</p>
                    {profileForm.mobile_number && <p className="profile-contact-line">{profileForm.mobile_number}</p>}
                    <p className="profile-contact-line">{locationLabel}</p>
                  </div>
                </div>
                <div className="profile-strength-box">
                  <div className="dashboard-score-label">Profile Strength</div>
                  <div className="dashboard-score-value" style={{ color: profileStrength >= 70 ? "#16a34a" : "#ea580c" }}>
                    {profileStrength}%
                  </div>
                  <div className="dashboard-score-bar">
                    <div className="dashboard-score-fill" style={{ width: `${profileStrength}%` }} />
                  </div>
                  <p className="profile-strength-hint">
                    {profileStrength >= 80 ? "Great! Keep it up." : "Complete more details to stand out."}
                  </p>
                  <button className="dashboard-cta-btn" type="button" onClick={() => setEditingDetails((v) => !v)}>
                    {editingDetails ? "Close" : "Improve Profile"}
                  </button>
                </div>
              </div>

              {editingDetails && (
                <form className="profile-form" onSubmit={(e) => handleSubmitEdit(e, () => setEditingDetails(false))}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mobile number</label>
                      <input type="tel" value={profileForm.mobile_number || ""} onChange={(e) => onProfileFieldChange?.("mobile_number", e.target.value)} placeholder="Phone number" />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input type="text" value={profileForm.city || ""} onChange={(e) => onProfileFieldChange?.("city", e.target.value)} placeholder="City" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Country</label>
                      <input type="text" value={profileForm.country || ""} onChange={(e) => onProfileFieldChange?.("country", e.target.value)} placeholder="Country" />
                    </div>
                    <div className="form-group">
                      <label>Total experience (years)</label>
                      <input type="number" min="0" step="0.1" value={profileForm.total_experience || ""} onChange={(e) => onProfileFieldChange?.("total_experience", e.target.value)} placeholder="Years" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Current title</label>
                      <input type="text" value={profileForm.current_job_title || ""} onChange={(e) => onProfileFieldChange?.("current_job_title", e.target.value)} placeholder="Current job title" />
                    </div>
                    <div className="form-group">
                      <label>Current company</label>
                      <input type="text" value={profileForm.current_company || ""} onChange={(e) => onProfileFieldChange?.("current_company", e.target.value)} placeholder="Current employer" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expected salary</label>
                      <input type="text" value={profileForm.expected_salary || ""} onChange={(e) => onProfileFieldChange?.("expected_salary", e.target.value)} placeholder="e.g. $90,000 per year" />
                    </div>
                    <div className="form-group">
                      <label>Preferred work mode</label>
                      <select value={profileForm.preferred_work_mode || "Remote"} onChange={(e) => onProfileFieldChange?.("preferred_work_mode", e.target.value)}>
                        <option>Remote</option>
                        <option>Hybrid</option>
                        <option>On-site</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={profileLoading}>
                      {profileLoading ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {photoUploadStatus && <p className="profile-resume-status">{photoUploadStatus}</p>}
            {profileError && <div className="error-message">{profileError}</div>}
            {profileSaveMessage && <div className="success-message">{profileSaveMessage}</div>}

            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>About Me</h2>
                <button className="dashboard-link-btn" type="button" onClick={() => setEditingAbout((v) => !v)}>
                  {editingAbout ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingAbout ? (
                <form className="profile-inline-form" onSubmit={(e) => handleSubmitEdit(e, () => setEditingAbout(false))}>
                  <textarea
                    rows="3"
                    value={profileForm.headline || ""}
                    onChange={(e) => onProfileFieldChange?.("headline", e.target.value)}
                    placeholder="Add a short summary about yourself"
                  />
                  <button className="dashboard-action-btn" type="submit" disabled={profileLoading}>
                    {profileLoading ? "Saving..." : "Save"}
                  </button>
                </form>
              ) : (
                <p className="profile-about-text">
                  {profileForm.headline || "Add a short summary about yourself so recruiters know what you bring to the table."}
                </p>
              )}
            </div>

            <div className="dashboard-grid profile-stats-grid">
              {[
                { label: "Experience", value: experienceLabel },
                { label: "Total Applications", value: totalApplied },
                { label: "Shortlisted", value: totalShortlisted },
                { label: "Interviews", value: totalInterviews },
              ].map((stat) => (
                <div key={stat.label} className="dashboard-card profile-stat-box">
                  <div className="dashboard-score-label">{stat.label}</div>
                  <div className="dashboard-score-value">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="dashboard-grid profile-bottom-grid">
              <section className="dashboard-card">
                <div className="dashboard-card-header">
                  <h2>Resume</h2>
                </div>
                {primaryResume ? (
                  <div className="dashboard-simple-card">
                    <div>
                      <h3>{primaryResume.label || (primaryResume.file || "").split("/").pop() || "Resume"}</h3>
                      <p>Uploaded on {primaryResume.uploaded_at ? new Date(primaryResume.uploaded_at).toLocaleDateString() : "Unknown date"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">No resume uploaded yet.</div>
                )}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={handleResumeFileChange}
                />
                <button
                  className="dashboard-action-btn profile-update-resume-btn"
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                >
                  {primaryResume ? "Update Resume" : "Upload Resume"}
                </button>
                {resumeManagerStatus && <p className="profile-resume-status">{resumeManagerStatus}</p>}
              </section>

              <section className="dashboard-card">
                <div className="dashboard-card-header">
                  <h2>Skills</h2>
                  <button className="dashboard-link-btn" type="button" onClick={() => setEditingSkills((v) => !v)}>
                    {editingSkills ? "Cancel" : "Edit"}
                  </button>
                </div>
                {editingSkills ? (
                  <form className="profile-inline-form" onSubmit={(e) => handleSubmitEdit(e, () => setEditingSkills(false))}>
                    <input
                      type="text"
                      value={profileForm.skills || ""}
                      onChange={(e) => onProfileFieldChange?.("skills", e.target.value)}
                      placeholder="Comma-separated skills"
                    />
                    <button className="dashboard-action-btn" type="submit" disabled={profileLoading}>
                      {profileLoading ? "Saving..." : "Save"}
                    </button>
                  </form>
                ) : skillsList.length > 0 ? (
                  <div className="dashboard-job-card-tag-row">
                    {skillsList.map((skill) => (
                      <span key={skill} className="recommended-job-tag">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No skills added yet.</div>
                )}
              </section>
            </div>

            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Recent Applications</h2>
                <button className="dashboard-link-btn" type="button" onClick={() => setActiveMenu("My Applications")}>View All</button>
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
                    {appliedJobs.length === 0 ? (
                      <tr><td colSpan="4">No applications yet.</td></tr>
                    ) : (
                      appliedJobs.slice(0, 5).map((app, index) => (
                        <tr key={`${app.id}-${index}`}>
                          <td>{app.title}</td>
                          <td>{app.company}</td>
                          <td><span className={`dashboard-stage-pill ${app.status.toLowerCase().replace(/ /g, "-")}`}>{app.status}</span></td>
                          <td>{app.appliedOn}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        );
      }
      case "Settings":
        return (
          <>
            {renderSectionHeader()}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Account information</h2>
              </div>
              <div className="settings-info-grid">
                <div>
                  <div className="dashboard-score-label">Name</div>
                  <p>{displayName}</p>
                </div>
                <div>
                  <div className="dashboard-score-label">Email</div>
                  <p>{currentUser.email || "No email provided"}</p>
                </div>
                <div>
                  <div className="dashboard-score-label">Account type</div>
                  <p>Job Seeker</p>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Notification preferences</h2>
              </div>
              <form onSubmit={onSaveProfile}>
                <label className="settings-toggle-row">
                  <div>
                    <h3>Email notifications</h3>
                    <p>Get emailed when recruiters view, shortlist, or respond to your applications.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileForm.email_notifications !== false}
                    onChange={(e) => onProfileFieldChange?.("email_notifications", e.target.checked)}
                  />
                </label>
                <div className="form-actions">
                  <button className="submit-btn" type="submit" disabled={profileLoading}>
                    {profileLoading ? "Saving..." : "Save preferences"}
                  </button>
                </div>
              </form>
              {profileSaveMessage && <p className="profile-resume-status">{profileSaveMessage}</p>}
            </div>

            <div className="dashboard-card dashboard-simple-card">
              <div>
                <h3>Log out</h3>
                <p>Sign out of Smart Job Portal on this device.</p>
              </div>
              <button className="dashboard-action-btn" type="button" onClick={() => onLogout?.()}>Logout</button>
            </div>
          </>
        );
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => (
    <>
      <div className="dash-greeting-row">
        <div>
          <h1>{greeting}, {greetingName}! <span className="dash-wave" role="img" aria-label="waving hand">👋</span></h1>
          <p>Ready to find your dream job today?</p>
        </div>
        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={handleResumeFileChange}
        />
        <button type="button" className="dash-outline-btn" onClick={() => resumeInputRef.current?.click()}>
          <UploadCloud size={16} />
          {primaryResume ? "Update Resume" : "Upload Resume"}
        </button>
      </div>

      <div className="dashboard-grid dashboard-kpi-grid">
        {[
          { label: "Applications", value: totalApplied, accent: "#2563eb", bg: "#eff6ff", icon: Briefcase, link: "My Applications" },
          { label: "Viewed", detail: "By Recruiters", value: totalViewed, accent: "#16a34a", bg: "#dcfce7", icon: UserCheck },
          { label: "Shortlisted", detail: "Opportunities", value: totalShortlisted, accent: "#7c3aed", bg: "#ede9fe", icon: Star },
          { label: "Interviews", detail: "Upcoming", value: totalInterviews, accent: "#ea580c", bg: "#ffedd5", icon: CalendarDays, link: "Interviews" },
        ].map((card) => (
          <div key={card.label} className="dashboard-kpi-card">
            <div className="dashboard-kpi-icon" style={{ background: card.bg, color: card.accent }}>
              <card.icon size={20} />
            </div>
            <div>
              <div className="dashboard-kpi-value">{card.value}</div>
              {card.link ? (
                <button type="button" className="dashboard-kpi-link" onClick={() => setActiveMenu(card.link)}>
                  {card.label} <ArrowRight size={12} />
                </button>
              ) : (
                <div className="dashboard-kpi-label">{card.label}</div>
              )}
              {card.detail && <div className="dashboard-kpi-detail-label">{card.detail}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid dash-mid-row">
        <section className="dashboard-card dash-completion-card">
          <div className="dash-completion-top">
            <div>
              <h2>Profile Completion</h2>
              <div className="completion-donut-wrap">
                <div className="completion-donut" style={{ "--pct": profileStrength }}>
                  <div className="completion-donut-inner">{profileStrength}%</div>
                </div>
              </div>
            </div>
            <div className="dash-completion-checklist">
              <p className="dash-completion-hint">
                {profileStrength >= 80 ? "Great! Your profile is in top shape." : "Great! Your profile is almost complete."}
              </p>
              {profileChecklist.map((item) => (
                <div key={item.label} className="dash-checklist-row">
                  {item.done ? (
                    <CheckCircle2 size={16} className="dash-check-icon done" />
                  ) : (
                    <AlertCircle size={16} className="dash-check-icon pending" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
              <button type="button" className="dash-outline-btn dash-completion-cta" onClick={() => setActiveMenu("Profile")}>
                Complete Profile <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-card dash-boost-card">
          <Sparkles size={22} className="dash-boost-icon" />
          <h2>Boost your chances!</h2>
          <p>Complete your profile to get better job recommendations.</p>
          <button type="button" className="dashboard-cta-btn" onClick={() => setActiveMenu("Profile")}>
            Improve Profile
          </button>
        </section>
      </div>

      <div className="dashboard-grid dash-bottom-row">
        <section className="dashboard-card dashboard-recommended-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Recommended Jobs for You</h2>
            </div>
            <button className="dashboard-link-btn" type="button" onClick={() => setActiveMenu("Search Jobs")}>View All</button>
          </div>
          <div className="recommended-list">
            {recommendedJobs.map((job, index) => (
              <div key={job.id ?? `${job.position}-${index}`} className="dash-job-row">
                <div className="dash-job-logo" style={job.logo ? undefined : getAvatarStyle(job.company)}>
                  {job.logo ? <img src={job.logo} alt="" /> : getInitials(job.company)}
                </div>
                <div className="dash-job-row-main">
                  <div className="dash-job-row-title">{job.position}</div>
                  <div className="dash-job-row-company">
                    {job.company}
                    {job.isVerified && (
                      <span className="verified-badge" title="Verified by Smart Job Portal">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="dash-job-row-meta">
                    <span><MapPin size={12} /> {job.location}</span>
                  </div>
                  <div className="dash-job-row-tags">
                    {job.category && <span className="recommended-job-tag">{job.category}</span>}
                    {job.match != null && <span className="recommended-job-match">{job.match}% Match</span>}
                  </div>
                </div>
                <div className="dash-job-row-side">
                  <div className="dash-job-row-salary">{job.salary}</div>
                  <div className="dash-job-row-actions">
                    {job.id != null && (
                      <BookmarkButton job={{ id: job.id }} bookmarks={bookmarks} onChange={onBookmarksChange} />
                    )}
                    <button className="dash-outline-btn dash-outline-btn-sm" type="button" onClick={() => onApplyJob?.(job.id)}>
                      Apply Now
                    </button>
                  </div>
                  <div className="dash-job-row-age">Posted {job.age}</div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="dash-view-more-btn" onClick={() => setActiveMenu("Search Jobs")}>
            View More Jobs <ArrowRight size={14} />
          </button>
        </section>

        <div className="dash-right-col">
          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Recent Applications</h2>
              <button className="dashboard-link-btn" type="button" onClick={() => setActiveMenu("My Applications")}>View All</button>
            </div>
            <div className="dash-application-list">
              {recentApplications.map((app, index) => (
                <div key={`${app.job}-${index}`} className="dash-application-row">
                  <div className="dash-job-logo dash-job-logo-sm" style={getAvatarStyle(app.company)}>
                    {getInitials(app.company)}
                  </div>
                  <div className="dash-application-row-main">
                    <div className="dash-job-row-title">{app.job}</div>
                    <div className="dash-job-row-company">{app.company}</div>
                  </div>
                  <div className="dash-application-row-side">
                    <span className={`dashboard-stage-pill ${app.status.toLowerCase().replace(/ /g, "-")}`}>{app.status}</span>
                    <span className="dash-job-row-age">{app.appliedRelative}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-card dash-alerts-card">
            <div className="dashboard-card-header">
              <div className="dash-alerts-title">
                <Bell size={16} />
                <h2>Job Alerts</h2>
              </div>
              <button className="dashboard-link-btn" type="button" onClick={() => setActiveMenu("Settings")}>Manage</button>
            </div>
            <p className="dash-alerts-summary">
              {jobCategories.length > 1 ? `New ${jobCategories[1]} roles matching your profile.` : "New roles matching your profile."}
            </p>
            <label className="dash-alerts-toggle-row">
              <span>Email me about new matches</span>
              <input
                type="checkbox"
                checked={profileForm.email_notifications !== false}
                onChange={(e) => {
                  onProfileFieldChange?.("email_notifications", e.target.checked);
                  onSaveProfile?.({ preventDefault: () => {} });
                }}
              />
            </label>
          </section>
        </div>
      </div>
    </>
  );

  return (
    <div className="dashboard-root">
      {mobileNavOpen && <div className="dashboard-mobile-overlay" onClick={() => setMobileNavOpen(false)} />}

      <header className="topbar">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-logo">
          <div className="topbar-logo-icon"><img src={logoMark} alt="" /></div>
          <span>VIP Jobseeker</span>
        </div>
        <div className="topbar-search">
          <Search size={16} />
          <input
            placeholder="Search jobs, companies, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <button className="dashboard-icon-btn" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="dashboard-icon-btn dashboard-icon-btn-badge" type="button" onClick={() => setActiveMenu("Notifications")}>
            <Bell size={18} />
            {unreadNotificationCount > 0 && <span className="dashboard-header-badge">{unreadNotificationCount}</span>}
          </button>
          <button className="dashboard-icon-btn dashboard-icon-btn-badge" type="button" onClick={() => setActiveMenu("Messages")}>
            <MessagesSquare size={18} />
            {totalUnreadMessages > 0 && <span className="dashboard-header-badge">{totalUnreadMessages}</span>}
          </button>
          <button type="button" className="topbar-user" onClick={() => setActiveMenu("Profile")}>
            <Avatar src={profilePhotoUrl} initial={displayName.charAt(0)} className="dashboard-user-avatar" />
            <div className="topbar-user-text">
              <div className="dashboard-user-name">{displayName}</div>
              <div className="dashboard-user-role">Job Seeker</div>
            </div>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className={`dashboard-sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
          <button
            type="button"
            className="dashboard-mobile-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

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
                      setMobileNavOpen(false);
                    }}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                    {item.label === "Notifications" && unreadNotificationCount > 0 && (
                      <span className="dashboard-sidebar-badge">{unreadNotificationCount}</span>
                    )}
                    {item.label === "Messages" && totalUnreadMessages > 0 && (
                      <span className="dashboard-sidebar-badge">{totalUnreadMessages}</span>
                    )}
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
          <main className="dashboard-main">
            {renderMainContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
