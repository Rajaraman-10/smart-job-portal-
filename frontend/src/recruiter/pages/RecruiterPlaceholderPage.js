import React from 'react';
import EmptyState from '../../components/ui/EmptyState';

export default function RecruiterPlaceholderPage({ title, description, actionLabel, onAction }) {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <EmptyState
          title="This section is ready for your next recruiter workflow"
          description="We’ve scaffolded the recruiter experience so you can continue adding the detailed page interactions from the backend API.
          "
          actionLabel={actionLabel}
          onAction={onAction}
        />
      </div>
    </div>
  );
}
