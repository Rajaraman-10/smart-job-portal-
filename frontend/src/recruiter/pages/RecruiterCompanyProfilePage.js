import React, { useEffect, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const COMPANY_INITIAL_STATE = {
  name: '', industry: '', website: '', size: '', year_founded: '',
  phone: '', address: '', city: '', state: '', country: 'India',
  description: '', registration_number: '', gstin: '',
};

const RECRUITER_INITIAL_STATE = { job_title: '', phone_number: '', linkedin_url: '' };

const inputClass = 'w-full border border-[#14181C]/15 dark:border-white/15 bg-[#F5F6F3] dark:bg-slate-800 px-4 py-3 text-sm text-[#14181C] dark:text-slate-50 outline-none focus:border-[#0E7C66] disabled:bg-white disabled:text-[#5B6660]';
const labelClass = 'space-y-2 text-sm text-[#5B6660] dark:text-slate-400';

const LOGO_STATUS_STYLE = {
  none: { label: 'No logo uploaded', className: 'bg-[#F1EFE8] text-[#444441]' },
  pending: { label: '🟡 Pending Verification', className: 'bg-[#FAEEDA] text-[#633806]' },
  verified: { label: '🟢 Verified Logo', className: 'bg-[#E1F5EE] text-[#085041]' },
  rejected: { label: '🔴 Rejected — please re-upload', className: 'bg-[#FCEBEB] text-[#791F1F]' },
};

const REVIEW_STATUS_STYLE = {
  pending: { label: 'Pending Review', className: 'bg-[#FAEEDA] text-[#633806]' },
  approved: { label: '✓ Approved', className: 'bg-[#E1F5EE] text-[#085041]' },
  rejected: { label: 'Rejected', className: 'bg-[#FCEBEB] text-[#791F1F]' },
};

export default function RecruiterCompanyProfilePage({ recruiterProfile, loading, saveStatus, onSaveCompany, onSaveRecruiter, onUploadLogo }) {
  const [companyForm, setCompanyForm] = useState(COMPANY_INITIAL_STATE);
  const [recruiterForm, setRecruiterForm] = useState(RECRUITER_INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const company = recruiterProfile?.company;

  useEffect(() => {
    if (company) {
      setCompanyForm({ ...COMPANY_INITIAL_STATE, ...company });
    }
    if (recruiterProfile) {
      setRecruiterForm({
        job_title: recruiterProfile.job_title || '',
        phone_number: recruiterProfile.phone_number || '',
        linkedin_url: recruiterProfile.linkedin_url || '',
      });
    }
  }, [company, recruiterProfile]);

  if (loading) {
    return <LoadingSpinner label="Loading company profile..." />;
  }

  const handleCompanyChange = (field, value) => setCompanyForm((prev) => ({ ...prev, [field]: value }));
  const handleRecruiterChange = (field, value) => setRecruiterForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { year_founded, ...rest } = companyForm;
    await onSaveCompany?.({ ...rest, year_founded: year_founded ? Number(year_founded) : null });
    await onSaveRecruiter?.(recruiterForm);
    setIsEditing(false);
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setLogoUploading(true);
    try {
      await onUploadLogo?.(file);
    } finally {
      setLogoUploading(false);
    }
  };

  const logoStatus = LOGO_STATUS_STYLE[company?.logo_status || 'none'];
  const reviewStatus = REVIEW_STATUS_STYLE[company?.admin_review_status || 'pending'];

  return (
    <div className="space-y-6 font-sans text-[#14181C] dark:text-slate-50">
      <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">COMPANY PROFILE</p>
            <h1 className="mt-2 font-display text-xl font-semibold text-[#14181C] dark:text-slate-50">Brand & verification details</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="inline-flex items-center rounded-full bg-[#14181C] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2B3339]"
          >
            {isEditing ? 'Cancel edit' : 'Edit profile'}
          </button>
        </div>
        {company && (
          <div className="mt-5 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[160px]">
              <p className="text-xs text-[#5B6660] dark:text-slate-400">Profile Completion</p>
              <p className="font-data text-2xl font-semibold">{recruiterProfile.profile_completion_score}%</p>
            </div>
            <div className="flex-1 min-w-[160px]">
              <p className="text-xs text-[#5B6660] dark:text-slate-400">Verification Score</p>
              <p className="font-data text-2xl font-semibold">{recruiterProfile.verification_score}/100</p>
              <p className="text-xs text-[#5B6660] dark:text-slate-400">{recruiterProfile.verification_level}</p>
            </div>
            <div className="flex-1 min-w-[160px]">
              <p className="text-xs text-[#5B6660] dark:text-slate-400">Admin Review</p>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${reviewStatus.className}`}>{reviewStatus.label}</span>
            </div>
          </div>
        )}
      </div>

      {saveStatus && <p className="text-sm text-[#5B6660] dark:text-slate-400">{saveStatus}</p>}

      {!company && !isEditing ? (
        <EmptyState
          title="Company profile is empty"
          description="Add your company details so candidates can learn more about your brand."
          actionLabel="Start profile setup"
          onAction={() => setIsEditing(true)}
        />
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="grid gap-5">
              <div className={labelClass}>
                <span>Company logo</span>
                <div className="flex items-center gap-4">
                  {company?.logo ? (
                    <img src={company.logo} alt="Company logo" className="h-20 w-20 rounded-lg object-cover border border-[#14181C]/10" />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-[#F5F6F3] dark:bg-slate-800 flex items-center justify-center text-xs text-[#5B6660]">No logo</div>
                  )}
                  <div className="space-y-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${logoStatus.className}`}>{logoStatus.label}</span>
                    <label className="block cursor-pointer text-xs font-medium text-[#0E7C66] hover:underline">
                      {logoUploading ? 'Uploading…' : 'Upload logo (PNG/JPG, 512×512 recommended)'}
                      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoChange} disabled={logoUploading} />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-[#5B6660] dark:text-slate-400">Your logo won't be shown to applicants until an admin reviews and verifies it.</p>
              </div>
              <label className={labelClass}>
                <span>Company name</span>
                <input type="text" value={companyForm.name} onChange={(e) => handleCompanyChange('name', e.target.value)} placeholder="Company name" required className={inputClass} disabled={!isEditing} />
              </label>
              <label className={labelClass}>
                <span>Industry</span>
                <input type="text" value={companyForm.industry} onChange={(e) => handleCompanyChange('industry', e.target.value)} placeholder="Industry" className={inputClass} disabled={!isEditing} />
              </label>
              <label className={labelClass}>
                <span>Company size</span>
                <input type="text" value={companyForm.size} onChange={(e) => handleCompanyChange('size', e.target.value)} placeholder="e.g. 51-200 employees" className={inputClass} disabled={!isEditing} />
              </label>
              <label className={labelClass}>
                <span>Year founded</span>
                <input type="number" min="1800" max="2100" value={companyForm.year_founded || ''} onChange={(e) => handleCompanyChange('year_founded', e.target.value)} className={inputClass} disabled={!isEditing} />
              </label>
              <label className={labelClass}>
                <span>Website</span>
                <input type="url" value={companyForm.website} onChange={(e) => handleCompanyChange('website', e.target.value)} placeholder="https://yourcompany.com" className={inputClass} disabled={!isEditing} />
              </label>
              <label className={labelClass}>
                <span>Company phone</span>
                <input type="tel" value={companyForm.phone} onChange={(e) => handleCompanyChange('phone', e.target.value)} className={inputClass} disabled={!isEditing} />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <p className="mb-4 font-data text-xs tracking-[0.2em] text-[#0E7C66]">ADDRESS</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={`${labelClass} sm:col-span-2`}>
                  <span>Address</span>
                  <input type="text" value={companyForm.address} onChange={(e) => handleCompanyChange('address', e.target.value)} className={inputClass} disabled={!isEditing} />
                </label>
                <label className={labelClass}>
                  <span>City</span>
                  <input type="text" value={companyForm.city} onChange={(e) => handleCompanyChange('city', e.target.value)} className={inputClass} disabled={!isEditing} />
                </label>
                <label className={labelClass}>
                  <span>State</span>
                  <input type="text" value={companyForm.state} onChange={(e) => handleCompanyChange('state', e.target.value)} className={inputClass} disabled={!isEditing} />
                </label>
                <label className={labelClass}>
                  <span>Country</span>
                  <input type="text" value={companyForm.country} onChange={(e) => handleCompanyChange('country', e.target.value)} className={inputClass} disabled={!isEditing} />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <p className="mb-4 font-data text-xs tracking-[0.2em] text-[#0E7C66]">DESCRIPTION</p>
              <label className={labelClass}>
                <textarea value={companyForm.description} onChange={(e) => handleCompanyChange('description', e.target.value)} rows={5} placeholder="Tell candidates about your company" className={inputClass} disabled={!isEditing} />
              </label>
            </div>

            <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <p className="mb-4 font-data text-xs tracking-[0.2em] text-[#0E7C66]">COMPANY REGISTRATION</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  <span>CIN <span className="text-[#94A0AA]">(optional)</span></span>
                  <input type="text" value={companyForm.registration_number} onChange={(e) => handleCompanyChange('registration_number', e.target.value)} className={inputClass} disabled={!isEditing} />
                </label>
                <label className={labelClass}>
                  <span>GSTIN <span className="text-[#94A0AA]">(optional)</span></span>
                  <input type="text" value={companyForm.gstin} onChange={(e) => handleCompanyChange('gstin', e.target.value)} className={inputClass} disabled={!isEditing} />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <p className="mb-4 font-data text-xs tracking-[0.2em] text-[#0E7C66]">YOUR DETAILS</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  <span>Job title / designation</span>
                  <input type="text" value={recruiterForm.job_title} onChange={(e) => handleRecruiterChange('job_title', e.target.value)} className={inputClass} disabled={!isEditing} />
                </label>
                <label className={labelClass}>
                  <span>Phone number</span>
                  <input type="tel" value={recruiterForm.phone_number} onChange={(e) => handleRecruiterChange('phone_number', e.target.value)} className={inputClass} disabled={!isEditing} />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  <span>LinkedIn profile</span>
                  <input type="url" value={recruiterForm.linkedin_url} onChange={(e) => handleRecruiterChange('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." className={inputClass} disabled={!isEditing} />
                </label>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="inline-flex justify-end lg:col-span-2">
              <button type="submit" className="rounded-full bg-[#0E7C66] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0B6553]">
                Save company profile
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
