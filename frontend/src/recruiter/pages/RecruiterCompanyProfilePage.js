import React, { useEffect, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const INITIAL_STATE = {
  logo: '', name: '', industry: '', website: '', size: '', founded_year: '',
  head_office: '', email: '', phone: '', address: '', description: '',
  mission: '', vision: '', linkedin: '', facebook: '', instagram: '',
};

const inputClass = 'w-full border border-[#14181C]/15 bg-[#F5F6F3] px-4 py-3 text-sm text-[#14181C] outline-none focus:border-[#0E7C66] disabled:bg-white disabled:text-[#5B6660]';
const labelClass = 'space-y-2 text-sm text-[#5B6660]';

export default function RecruiterCompanyProfilePage({ companyProfile, loading, onSave }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (companyProfile) {
      setForm({ ...INITIAL_STATE, ...companyProfile });
    }
  }, [companyProfile]);

  if (loading) {
    return <LoadingSpinner label="Loading company profile..." />;
  }

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 font-sans text-[#14181C]">
      <div className="border border-[#14181C]/10 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">COMPANY PROFILE</p>
            <h1 className="mt-2 font-display text-xl font-semibold text-[#14181C]">Brand details</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="inline-flex items-center bg-[#14181C] px-5 py-3 text-sm font-medium text-white hover:bg-[#2B3339]"
          >
            {isEditing ? 'Cancel edit' : 'Edit profile'}
          </button>
        </div>
      </div>

      {!companyProfile && !isEditing ? (
        <EmptyState
          title="Company profile is empty"
          description="Add your company details so candidates can learn more about your brand."
          actionLabel="Start profile setup"
          onAction={() => setIsEditing(true)}
        />
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <div className="border border-[#14181C]/10 bg-white p-6">
            <div className="grid gap-5">
              <label className={labelClass}>
                <span>Company logo</span>
                <input type="text" value={form.logo} onChange={(e) => handleChange('logo', e.target.value)} placeholder="Logo URL" className={inputClass} disabled={!isEditing} />
              </label>
              {form.logo && <img src={form.logo} alt="Company logo" className="h-24 w-24 object-cover" />}
              <label className={labelClass}>
                <span>Company name</span>
                <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Company name" required className={inputClass} disabled={!isEditing} />
              </label>
              <label className={labelClass}>
                <span>Industry</span>
                <input type="text" value={form.industry} onChange={(e) => handleChange('industry', e.target.value)} placeholder="Industry" className={inputClass} disabled={!isEditing} />
              </label>
              <label className={labelClass}>
                <span>Website</span>
                <input type="url" value={form.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://yourcompany.com" className={inputClass} disabled={!isEditing} />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-[#14181C]/10 bg-white p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {['Company Size', 'Founded Year', 'Head Office', 'Email', 'Phone', 'Address'].map((label) => {
                  const key = label.toLowerCase().replace(/ /g, '_');
                  return (
                    <label key={key} className={labelClass}>
                      <span>{label}</span>
                      <input
                        type={key === 'email' ? 'email' : 'text'}
                        value={form[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={label}
                        className={inputClass}
                        disabled={!isEditing}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#14181C]/10 bg-white p-6">
              <div className="space-y-5">
                <label className={labelClass}>
                  <span>Description</span>
                  <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={5} placeholder="Tell candidates about your company" className={inputClass} disabled={!isEditing} />
                </label>
                <label className={labelClass}>
                  <span>Mission</span>
                  <textarea value={form.mission} onChange={(e) => handleChange('mission', e.target.value)} rows={3} placeholder="Company mission" className={inputClass} disabled={!isEditing} />
                </label>
                <label className={labelClass}>
                  <span>Vision</span>
                  <textarea value={form.vision} onChange={(e) => handleChange('vision', e.target.value)} rows={3} placeholder="Company vision" className={inputClass} disabled={!isEditing} />
                </label>
              </div>
            </div>

            <div className="border border-[#14181C]/10 bg-white p-6">
              <div className="grid gap-5 sm:grid-cols-3">
                {['LinkedIn', 'Facebook', 'Instagram'].map((label) => {
                  const key = label.toLowerCase();
                  return (
                    <label key={key} className={labelClass}>
                      <span>{label}</span>
                      <input
                        type="url"
                        value={form[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={`https://www.${key}.com/your-company`}
                        className={inputClass}
                        disabled={!isEditing}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="inline-flex justify-end lg:col-span-2">
              <button type="submit" className="bg-[#0E7C66] px-6 py-3 text-sm font-medium text-white hover:bg-[#0B6553]">
                Save company profile
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}