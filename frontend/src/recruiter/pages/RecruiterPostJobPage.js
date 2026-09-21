import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TriangleAlert, Building2, ArrowRight } from 'lucide-react';

const inputClass = 'w-full rounded-xl border border-[#14181C]/15 dark:border-white/15 bg-[#F5F6F3] dark:bg-slate-800 px-4 py-3 text-sm text-[#14181C] dark:text-slate-50 outline-none focus:border-[#0E7C66] focus:ring-2 focus:ring-[#0E7C66]/10';
const labelClass = 'space-y-2 text-sm text-[#5B6660] dark:text-slate-400';

export default function RecruiterPostJobPage({
  form,
  onFieldChange,
  onSubmit,
  onCancel,
  isEditing,
  recruiterCompanyName,
  onQuizPdfSelect,
}) {
  const {
    jobTitle,
    jobDescription,
    jobLocation,
    jobCompany,
    jobSalary,
    jobCategory,
    jobRequiredSkills,
    jobSalaryMin,
    jobSalaryMax,
    jobExperienceLevel,
    jobWorkMode,
    jobScreeningThreshold,
    jobResumeScreeningAt,
    jobQuizStartsAt,
    jobQuizEndsAt,
    jobQuizDurationMinutes,
    jobQuizInstructions,
    jobTechnicalInterviewAt,
    jobTechnicalInterviewMode,
    jobTechnicalInterviewLink,
    jobTechnicalInterviewInstructions,
    jobFinalSelectionAt,
    jobQuizPdf,
    jobQuizQuestions = [],
    jobQuizStatus,
  } = form;

  const handleChange = (field) => (event) => {
    onFieldChange(field, event.target.value);
  };

  const handleFileChange = (field) => (event) => {
    onFieldChange(field, event.target.files?.[0] || null);
  };

  const updateQuestion = (index, key, value) => {
    onFieldChange('jobQuizQuestions', jobQuizQuestions.map((question, questionIndex) => (
      questionIndex === index ? { ...question, [key]: value } : question
    )));
  };

  const deleteQuestion = (index) => {
    onFieldChange('jobQuizQuestions', jobQuizQuestions.filter((_, questionIndex) => questionIndex !== index));
  };

  const skillChips = jobRequiredSkills
    ? jobRequiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6 font-sans text-[#14181C] dark:text-slate-50">
      <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">RECRUITER WORKSPACE</p>
            <h1 className="mt-2 font-display text-xl font-semibold text-[#14181C] dark:text-slate-50">
              {isEditing ? 'Update your job listing' : 'Post a high-impact job opening'}
            </h1>
            <p className="mt-1 text-sm text-[#5B6660] dark:text-slate-400">
              Create a polished job posting with clear requirements and a smooth candidate experience.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 px-3 py-1.5 text-xs font-medium text-[#085041] dark:text-[#4ADE80]">
              {recruiterCompanyName || 'Your company'}
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-[#14181C]/15 dark:border-white/15 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-[#14181C] dark:text-slate-50 transition hover:border-[#14181C]/30"
            >
              {isEditing ? 'Cancel edit' : 'Clear form'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="mb-4 font-data text-xs tracking-[0.2em] text-[#0E7C66]">JOB DETAILS</p>

            <label className={`${labelClass} mb-5 block`}>
              <span>Company</span>
              <div className="flex items-center gap-2 rounded-xl border border-[#14181C]/10 dark:border-white/10 bg-[#F5F6F3] dark:bg-slate-800 px-4 py-3">
                <Building2 className="h-4 w-4 shrink-0 text-[#5B6660] dark:text-slate-400" />
                <span className="text-sm font-medium text-[#14181C] dark:text-slate-50">{jobCompany || recruiterCompanyName || 'Your company'}</span>
              </div>
              <p className="text-xs text-[#94A0AA]">
                Jobs are posted under your company profile.{' '}
                <Link to="/recruiter/company-profile" className="font-medium text-[#0E7C66] hover:underline">
                  Edit company details →
                </Link>
              </p>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { label: 'Job title', value: jobTitle, field: 'jobTitle', type: 'text', placeholder: 'Senior Product Designer', required: true },
                { label: 'Location', value: jobLocation, field: 'jobLocation', type: 'text', placeholder: 'Remote, New York, NY', required: true },
                { label: 'Salary', value: jobSalary, field: 'jobSalary', type: 'text', placeholder: '$90,000 - $120,000' },
                { label: 'Category', value: jobCategory, field: 'jobCategory', type: 'text', placeholder: 'Engineering' },
              ].map(({ label, value, field, type, placeholder, required }) => (
                <label key={field} className={labelClass}>
                  <span>{label}</span>
                  <input type={type} value={value} onChange={handleChange(field)} placeholder={placeholder} required={required} className={inputClass} />
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                <span>Work mode <span className="text-[#94A0AA]">(optional)</span></span>
                <select value={jobWorkMode} onChange={handleChange('jobWorkMode')} className={inputClass}>
                  <option value="">Not specified</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </label>
              <label className={labelClass}>
                <span>Experience level <span className="text-[#94A0AA]">(optional)</span></span>
                <select value={jobExperienceLevel} onChange={handleChange('jobExperienceLevel')} className={inputClass}>
                  <option value="">Not specified</option>
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead / Manager</option>
                </select>
              </label>
              <label className={labelClass}>
                <span>Min salary (₹/year) <span className="text-[#94A0AA]">(optional, powers salary filter)</span></span>
                <input type="number" min="0" value={jobSalaryMin} onChange={handleChange('jobSalaryMin')} placeholder="e.g. 500000" className={inputClass} />
              </label>
              <label className={labelClass}>
                <span>Max salary (₹/year) <span className="text-[#94A0AA]">(optional)</span></span>
                <input type="number" min="0" value={jobSalaryMax} onChange={handleChange('jobSalaryMax')} placeholder="e.g. 800000" className={inputClass} />
              </label>
            </div>
            <p className="mt-2 text-xs text-[#94A0AA]">
              These structured fields power candidate search filters — the free-text Salary field above is still what's shown on the listing.
            </p>

            <label className={`${labelClass} mt-5 block`}>
              <span>Job description</span>
              <textarea
                value={jobDescription}
                onChange={handleChange('jobDescription')}
                rows={6}
                placeholder="Describe the role, responsibilities, and qualifications."
                className={inputClass}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="mb-4 font-data text-xs tracking-[0.2em] text-[#0E7C66]">RECRUITMENT TIMELINE</p>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ['Resume screening', 'jobResumeScreeningAt', jobResumeScreeningAt],
                ['Quiz starts', 'jobQuizStartsAt', jobQuizStartsAt],
                ['Quiz ends', 'jobQuizEndsAt', jobQuizEndsAt],
                ['Technical interview', 'jobTechnicalInterviewAt', jobTechnicalInterviewAt],
                ['Final selection', 'jobFinalSelectionAt', jobFinalSelectionAt],
              ].map(([label, field, value]) => (
                <label key={field} className={labelClass}><span>{label}</span><input type="datetime-local" value={value} onChange={handleChange(field)} className={inputClass} /></label>
              ))}
              <label className={labelClass}><span>Resume match pass mark (%)</span><input type="number" min="0" max="100" value={jobScreeningThreshold} onChange={handleChange('jobScreeningThreshold')} className={inputClass} /></label>
              <label className={labelClass}><span>Quiz duration (minutes)</span><input type="number" min="1" value={jobQuizDurationMinutes} onChange={handleChange('jobQuizDurationMinutes')} className={inputClass} /></label>
              <label className={labelClass}><span>Interview mode</span><select value={jobTechnicalInterviewMode} onChange={handleChange('jobTechnicalInterviewMode')} className={inputClass}><option>Video</option><option>Phone</option><option>Onsite</option></select></label>
              <label className={labelClass}><span>Interview link/location</span><input value={jobTechnicalInterviewLink} onChange={handleChange('jobTechnicalInterviewLink')} className={inputClass} /></label>
            </div>
            <label className={`${labelClass} mt-5 block`}><span>Quiz instructions</span><textarea rows="3" value={jobQuizInstructions} onChange={handleChange('jobQuizInstructions')} className={inputClass} placeholder="Complete all questions during the scheduled window." /></label>
            <label className={`${labelClass} mt-5 block`}><span>Technical interview instructions</span><textarea rows="3" value={jobTechnicalInterviewInstructions} onChange={handleChange('jobTechnicalInterviewInstructions')} className={inputClass} /></label>
          </div>

          <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="mb-2 font-data text-xs tracking-[0.2em] text-[#0E7C66]">TECHNICAL QUIZ PDF</p>
            <p className="mb-4 text-xs text-[#5B6660] dark:text-slate-400">Upload numbered questions with Option A-D and a Correct Answer line. The server extracts them for review when the job is saved.</p>
            <input type="file" accept="application/pdf" onChange={(event) => onQuizPdfSelect?.(event.target.files?.[0] || null)} className={inputClass} />
            {jobQuizPdf && <p className="mt-2 text-xs text-[#0E7C66]">Selected: {jobQuizPdf.name}</p>}
            {jobQuizStatus && <p className="mt-2 text-xs text-[#0E7C66]">Question set: {jobQuizStatus}</p>}
            {jobQuizQuestions.length > 0 && <div className="mt-4 space-y-3"><p className="text-sm font-medium">Extracted questions preview</p>{jobQuizQuestions.map((question, index) => <div key={question.id || index} className="rounded-xl border border-[#14181C]/10 p-3"><input className={inputClass} value={question.prompt} onChange={(event) => updateQuestion(index, 'prompt', event.target.value)} /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-[#5B6660]">Correct: {question.correct_option || 'Review required'}</span><button type="button" className="text-xs text-red-600" onClick={() => deleteQuestion(index)}>Delete</button></div></div>)}</div>}
          </div>

          <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="mb-4 font-data text-xs tracking-[0.2em] text-[#0E7C66]">REQUIRED SKILLS</p>
            <p className="mb-3 text-xs text-[#5B6660] dark:text-slate-400">
              Powers the AI resume match score shown on every application — list the specific, comma-separated skills a candidate needs (e.g. React, Django, SQL).
            </p>
            <textarea
              value={jobRequiredSkills}
              onChange={handleChange('jobRequiredSkills')}
              rows={3}
              placeholder="React, Django, SQL"
              className={inputClass}
            />
            {skillChips.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-700">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                No required skills added yet — applicants will get a generic AI match score instead of a real skills match.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {skillChips.map((skill) => (
                  <span key={skill} className="rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 px-3 py-1.5 text-xs font-medium text-[#085041] dark:text-[#4ADE80]">{skill}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-full bg-[#0E7C66] px-6 py-3 text-sm font-medium text-white shadow-sm shadow-[#0E7C66]/30 transition hover:-translate-y-0.5 hover:bg-[#0B6553] hover:shadow-md">
              {isEditing ? 'Save changes' : 'Post job'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-[#14181C]/15 dark:border-white/15 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-medium text-[#14181C] dark:text-slate-50 transition hover:border-[#14181C]/30"
            >
              {isEditing ? 'Cancel edit' : 'Reset form'}
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="mb-3 font-data text-xs tracking-[0.2em] text-[#0E7C66]">LIVE PREVIEW</p>
            <h2 className="font-display text-lg font-semibold text-[#14181C] dark:text-slate-50">{jobTitle || 'Senior Product Designer'}</h2>
            <p className="mt-1 text-sm text-[#5B6660] dark:text-slate-400">{jobCompany || recruiterCompanyName || 'Your company'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#F5F6F3] dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-[#5B6660] dark:text-slate-300">{jobLocation || 'Remote'}</span>
              <span className="rounded-full bg-[#F5F6F3] dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-[#5B6660] dark:text-slate-300">{jobSalary || '$90k - $120k'}</span>
              <span className="rounded-full bg-[#F5F6F3] dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-[#5B6660] dark:text-slate-300">{jobCategory || 'Engineering'}</span>
            </div>
            {skillChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {skillChips.slice(0, 6).map((skill) => (
                  <span key={skill} className="rounded-full bg-[#E1F5EE] dark:bg-[#0E7C66]/20 px-2.5 py-1 text-[11px] font-medium text-[#085041] dark:text-[#4ADE80]">{skill}</span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="mb-3 flex items-center gap-1.5 font-data text-xs tracking-[0.2em] text-[#0E7C66]">
              <Building2 className="h-3.5 w-3.5" /> COMPANY PROFILE
            </p>
            <p className="text-sm text-[#5B6660] dark:text-slate-400">
              Logo, description, industry, and verification status now live on your company profile — candidates see whatever's set up there.
            </p>
            <Link
              to="/recruiter/company-profile"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#14181C]/15 dark:border-white/15 px-4 py-2 text-xs font-medium text-[#14181C] dark:text-slate-50 transition hover:border-[#14181C]/30"
            >
              Manage company profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="mb-3 flex items-center gap-1.5 font-data text-xs tracking-[0.2em] text-[#0E7C66]">
              <Sparkles className="h-3.5 w-3.5" /> RECRUITER TIPS
            </p>
            <ul className="space-y-2 text-sm text-[#5B6660] dark:text-slate-400">
              <li>Keep the title clear and specific.</li>
              <li>Highlight the main responsibilities.</li>
              <li>Use terms candidates actively search for.</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}
