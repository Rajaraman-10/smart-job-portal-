import React from 'react';

export default function ApplicationPage({
  job,
  resumes = [],
  selectedResumeId,
  setSelectedResumeId,
  resume,
  setResume,
  resumeFile,
  setResumeFile,
  applicantName,
  setApplicantName,
  applicantEmail,
  setApplicantEmail,
  coverLetter,
  setCoverLetter,
  applicantSkills,
  setApplicantSkills,
  onSubmit,
  onCancel,
}) {
  if (!job) {
    return (
      <main className="application-page">
        <div className="application-page-card">
          <h1>Job not found</h1>
          <p>This job is no longer available.</p>
          <button type="button" className="cancel-btn" onClick={onCancel}>Back to jobs</button>
        </div>
      </main>
    );
  }

  return (
    <main className="application-page">
      <div className="application-page-card">
        <div className="application-page-header">
          <div>
            <p className="application-page-eyebrow">Job application</p>
            <h1>Apply for {job.title}</h1>
            <p>{job.company} • {job.location}</p>
          </div>
          <button type="button" className="close-btn" onClick={onCancel} aria-label="Close application form">×</button>
        </div>

        <form className="application-page-form" onSubmit={(event) => { event.preventDefault(); onSubmit(job.id); }}>
          <div className="form-group">
            <label htmlFor="application-name">Your Name</label>
            <input id="application-name" type="text" value={applicantName} onChange={(event) => setApplicantName(event.target.value)} placeholder="Enter your full name" required />
          </div>
          <div className="form-group">
            <label htmlFor="application-email">Your Email</label>
            <input id="application-email" type="email" value={applicantEmail} onChange={(event) => setApplicantEmail(event.target.value)} placeholder="Enter your email address" required />
          </div>
          <div className="form-group">
            <label htmlFor="application-resume">Resume</label>
            {resumes.length > 0 && (
              <select id="application-resume" className="saved-resume-select" value={selectedResumeId} onChange={(event) => { setSelectedResumeId(event.target.value); setResumeFile(null); }}>
                <option value="">Upload new / paste text instead</option>
                {resumes.map((savedResume) => (
                  <option key={savedResume.id} value={savedResume.id}>
                    {savedResume.label || 'Resume'}{savedResume.is_primary ? ' (Primary)' : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedResumeId ? (
              <p className="file-selected">Using your saved resume. Pick &quot;Upload new&quot; above to use a different one.</p>
            ) : (
              <>
                <textarea value={resume} onChange={(event) => setResume(event.target.value)} placeholder="Paste your resume text here" rows="5" />
                <div className="file-upload-row">
                  <input type="file" accept="application/pdf" onChange={(event) => setResumeFile(event.target.files[0] ?? null)} className="file-input" />
                  <span className="file-hint">Or upload a PDF instead of pasting text.</span>
                </div>
                {resumeFile && <p className="file-selected">Selected file: {resumeFile.name}</p>}
              </>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="application-cover-letter">Cover Letter</label>
            <textarea id="application-cover-letter" value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} placeholder="Write a cover letter" rows="4" />
          </div>
          <div className="form-group">
            <label htmlFor="application-skills">Skills</label>
            <textarea id="application-skills" value={applicantSkills} onChange={(event) => setApplicantSkills(event.target.value)} placeholder="e.g. React, Node.js, Python" rows="3" />
          </div>
          <div className="application-page-footer">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="submit-btn">Submit Application</button>
          </div>
        </form>
      </div>
    </main>
  );
}
