import React from 'react';
import { Outlet } from 'react-router-dom';
import RecruiterSidebar from '../components/RecruiterSidebar';
import RecruiterTopbar from '../components/RecruiterTopbar';

export default function RecruiterLayout({ currentUser, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-6 p-4 md:p-6 lg:p-8">
        <RecruiterSidebar currentUser={currentUser} onLogout={onLogout} />
        <div className="flex min-h-screen flex-1 flex-col gap-6">
          <RecruiterTopbar currentUser={currentUser} />
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}