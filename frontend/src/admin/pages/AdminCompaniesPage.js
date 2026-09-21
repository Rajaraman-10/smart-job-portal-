import React, { useState } from 'react';

const REVIEW_STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
};

const LOGO_STATUS_LABELS = {
  none: 'No logo',
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
};

function scoreColor(score) {
  if (score >= 75) return 'text-emerald-700';
  if (score >= 50) return 'text-amber-700';
  return 'text-rose-700';
}

function buildDraft(company) {
  return {
    website_verified: Boolean(company.website_verified),
    registration_verified: Boolean(company.registration_verified),
    address_verified: Boolean(company.address_verified),
    logo_status: company.logo_status || 'none',
    admin_notes: company.admin_notes || '',
    recruiter_email_verified: false,
    recruiter_phone_verified: false,
    recruiter_identity_verified: false,
  };
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200">{value || '—'}</p>
    </div>
  );
}

function CompanyReviewModal({ company, onClose, onSubmit }) {
  const [draft, setDraft] = useState(() => buildDraft(company));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const updateField = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const submit = async (adminReviewStatus) => {
    setSaving(true);
    setStatus('');
    try {
      const payload = {
        website_verified: draft.website_verified,
        registration_verified: draft.registration_verified,
        address_verified: draft.address_verified,
        logo_status: draft.logo_status,
        admin_notes: draft.admin_notes,
        recruiter_email_verified: draft.recruiter_email_verified,
        recruiter_phone_verified: draft.recruiter_phone_verified,
        recruiter_identity_verified: draft.recruiter_identity_verified,
      };
      if (adminReviewStatus) payload.admin_review_status = adminReviewStatus;
      await onSubmit(company.id, payload);
      setStatus('✅ Saved.');
    } catch (error) {
      setStatus(`❌ ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{company.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Company Verification Request</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <DetailRow label="Recruiter" value={company.recruiter_name} />
          <DetailRow label="Email" value={company.recruiter_email} />
          <DetailRow label="Website" value={company.website} />
          <DetailRow label="Company phone" value={company.phone} />
          <DetailRow label="Address" value={[company.address, company.city, company.state, company.country].filter(Boolean).join(', ')} />
          <DetailRow label="Industry / Size" value={[company.industry, company.size].filter(Boolean).join(' • ')} />
          <DetailRow label="Year founded" value={company.year_founded} />
          <DetailRow label="CIN" value={company.registration_number} />
          <DetailRow label="GSTIN" value={company.gstin} />
          <DetailRow label="Verification Score" value={`${company.verification_score} / 100 — ${company.verification_level}`} />
        </div>

        {company.description && (
          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Description</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{company.description}</p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          {company.logo ? (
            <img src={company.logo} alt="Company logo" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-400">No logo</div>
          )}
          <div className="flex-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Logo status</p>
            <select
              value={draft.logo_status}
              onChange={(e) => updateField('logo_status', e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              {Object.entries(LOGO_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Verification checklist</p>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
            {[
              ['website_verified', 'Website verified'],
              ['registration_verified', 'Registration (CIN/GSTIN) verified'],
              ['address_verified', 'Business address verified'],
              ['recruiter_email_verified', 'Recruiter email verified'],
              ['recruiter_phone_verified', 'Recruiter phone verified'],
              ['recruiter_identity_verified', 'Recruiter identity verified'],
            ].map(([field, label]) => (
              <label key={field} className="flex items-center gap-2">
                <input type="checkbox" checked={draft[field]} onChange={(e) => updateField(field, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500 dark:text-slate-400">Admin notes</label>
          <textarea
            value={draft.admin_notes}
            onChange={(e) => updateField('admin_notes', e.target.value)}
            rows={3}
            placeholder="Notes visible only to admins"
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        {status && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{status}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" disabled={saving} onClick={() => submit(null)} className="rounded-full border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Save checklist
          </button>
          <button type="button" disabled={saving} onClick={() => submit('rejected')} className="rounded-full border border-rose-300 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
            Reject
          </button>
          <button type="button" disabled={saving} onClick={() => submit('approved')} className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCompaniesPage({ companies = [], loading, onSubmitVerification }) {
  const [reviewingCompany, setReviewingCompany] = useState(null);

  if (loading) {
    return <div className="p-8 text-center text-slate-700 dark:text-slate-300">Loading companies…</div>;
  }

  const handleSubmit = async (companyId, payload) => {
    const updated = await onSubmitVerification(companyId, payload);
    setReviewingCompany(updated);
    return updated;
  };

  return (
    <div className="space-y-6 p-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Companies</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Review company verification requests before their logo and badge go live for applicants.</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Recruiter</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Review status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No companies found.</td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{company.name}</td>
                    <td className="px-4 py-3">{company.recruiter_email || '-'}</td>
                    <td className="px-4 py-3">{company.website || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${REVIEW_STATUS_STYLE[company.admin_review_status] || REVIEW_STATUS_STYLE.pending}`}>
                        {company.admin_review_status || 'pending'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${scoreColor(company.verification_score || 0)}`}>
                      {company.verification_score ?? 0}/100
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setReviewingCompany(company)}
                        className="rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewingCompany && (
        <CompanyReviewModal
          company={reviewingCompany}
          onClose={() => setReviewingCompany(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
