import React from 'react';

export default function RecruiterPostJobPage({
  form,
  onFieldChange,
  onSubmit,
  onCancel,
  isEditing,
  recruiterCompanyName,
}) {
  const {
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
  } = form;

  const handleChange = (field) => (event) => {
    onFieldChange(field, event.target.value);
  };

  const skillChips = jobRequiredSkills
    ? jobRequiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean)
    : [];

  return (
    <section className="recruiter-section">
      <div className="recruiter-header">
        <div>
          <p className="section-eyebrow">Recruiter workspace</p>
          <h1>{isEditing ? 'Update your job listing' : 'Post a high-impact job opening'}</h1>
          <p>Create a polished job posting with clear requirements, strong company details, and a smooth candidate experience.</p>
        </div>
        <div className="recruiter-header-actions">
          <button type="button" className="page-btn" onClick={onCancel}>
            {isEditing ? 'Cancel edit' : 'Clear form'}
          </button>
          <span className="profile-status-tag">{recruiterCompanyName || 'Your company'}</span>
        </div>
      </div>

      <div className="recruiter-content-grid">
        <form onSubmit={onSubmit} className="recruiter-form-card">
          <div className="form-row">
            {[
              { label: 'Job title', value: jobTitle, field: 'jobTitle', type: 'text', placeholder: 'Senior Product Designer', required: true },
              { label: 'Location', value: jobLocation, field: 'jobLocation', type: 'text', placeholder: 'Remote, New York, NY', required: true },
              { label: 'Salary', value: jobSalary, field: 'jobSalary', type: 'text', placeholder: '$90,000 - $120,000' },
              { label: 'Category', value: jobCategory, field: 'jobCategory', type: 'text', placeholder: 'Engineering' },
            ].map(({ label, value, field, type, placeholder, required }) => (
              <label key={field} className="form-group">
                <span>{label}</span>
                <input
                  type={type}
                  value={value}
                  onChange={handleChange(field)}
                  placeholder={placeholder}
                  required={required}
                  className="form-input"
                />
              </label>
            ))}
          </div>

          <div className="form-group">
            <span>Job description</span>
            <textarea
              value={jobDescription}
              onChange={handleChange('jobDescription')}
              rows={6}
              placeholder="Describe the role, responsibilities, and qualifications."
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <span>Required skills</span>
            <textarea
              value={jobRequiredSkills}
              onChange={handleChange('jobRequiredSkills')}
              rows={3}
              placeholder="React, Django, SQL"
              className="form-textarea"
            />
          </div>

          {skillChips.length > 0 && (
            <div className="chip-list">
              {skillChips.map((skill) => (
                <span key={skill} className="chip-item">{skill}</span>
              ))}
            </div>
          )}

          <div className="section-eyebrow">Company profile</div>
          <div className="form-row">
            {[
              { label: 'Company name', value: jobCompany, field: 'jobCompany', type: 'text', placeholder: recruiterCompanyName || 'Company name', required: true },
              { label: 'Website', value: companyWebsite, field: 'companyWebsite', type: 'url', placeholder: 'https://example.com' },
              { label: 'Industry', value: companyIndustry, field: 'companyIndustry', type: 'text', placeholder: 'Software' },
              { label: 'Employees', value: companyEmployees, field: 'companyEmployees', type: 'text', placeholder: '120' },
            ].map(({ label, value, field, type, placeholder, required }) => (
              <label key={field} className="form-group">
                <span>{label}</span>
                <input
                  type={type}
                  value={value}
                  onChange={handleChange(field)}
                  placeholder={placeholder}
                  required={required}
                  className="form-input"
                />
              </label>
            ))}
          </div>

          <div className="form-row">
            {[
              { label: 'Company size', value: companySize, field: 'companySize', type: 'text', placeholder: '50-200 employees' },
              { label: 'Rating', value: companyRating, field: 'companyRating', type: 'number', placeholder: '4.5' },
            ].map(({ label, value, field, type, placeholder }) => (
              <label key={field} className="form-group">
                <span>{label}</span>
                <input
                  type={type}
                  min={type === 'number' ? '0' : undefined}
                  max={type === 'number' ? '5' : undefined}
                  step={type === 'number' ? '0.1' : undefined}
                  value={value}
                  onChange={handleChange(field)}
                  placeholder={placeholder}
                  className="form-input"
                />
              </label>
            ))}
          </div>

          <div className="form-group">
            <span>Company description</span>
            <textarea
              value={companyDescription}
              onChange={handleChange('companyDescription')}
              rows={4}
              placeholder="Tell candidates what makes your company a great place to work."
              className="form-textarea"
            />
          </div>

          <div className="form-row">
            {[
              { label: 'Logo URL', value: companyLogo, field: 'companyLogo', type: 'url', placeholder: 'https://example.com/logo.png' },
              { label: 'Cover image URL', value: companyCoverImage, field: 'companyCoverImage', type: 'url', placeholder: 'https://example.com/cover.jpg' },
            ].map(({ label, value, field, type, placeholder }) => (
              <label key={field} className="form-group">
                <span>{label}</span>
                <input
                  type={type}
                  value={value}
                  onChange={handleChange(field)}
                  placeholder={placeholder}
                  className="form-input"
                />
              </label>
            ))}
          </div>

          <div className="form-actions post-job-actions">
            <button type="submit" className="submit-btn">
              {isEditing ? 'Save changes' : 'Post job'}
            </button>
            <button type="button" className="page-btn" onClick={onCancel}>
              {isEditing ? 'Cancel edit' : 'Reset form'}
            </button>
          </div>
        </form>

        <aside className="company-preview-card">
          <div className="info-card">
            <p className="section-eyebrow">Live preview</p>
            <h2>{jobTitle || 'Senior Product Designer'}</h2>
            <p className="muted-text">{jobCompany || recruiterCompanyName || 'Your company'}</p>
            <div className="chip-list">
              <span className="chip-item">{jobLocation || 'Remote'}</span>
              <span className="chip-item">{jobSalary || '$90k - $120k'}</span>
              <span className="chip-item">{jobCategory || 'Engineering'}</span>
            </div>
          </div>

          <div className="info-card">
            <p className="section-eyebrow">Company snapshot</p>
            <p className="muted-text">{companyDescription || 'Share your mission, culture, and candidate experience here.'}</p>
            <div className="form-row" style={{ marginTop: '18px' }}>
              <div className="info-card info-inline-card">
                <p className="tiny-label">Size</p>
                <strong>{companySize || '50 - 200'}</strong>
              </div>
              <div className="info-card info-inline-card">
                <p className="tiny-label">Rating</p>
                <strong>{companyRating || '4.5'}</strong>
              </div>
            </div>
          </div>

          <div className="info-card">
            <p className="section-eyebrow">Recruiter tips</p>
            <ul className="tips-list">
              <li>Keep the title clear and specific.</li>
              <li>Highlight the main responsibilities.</li>
              <li>Use terms candidates actively search for.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
