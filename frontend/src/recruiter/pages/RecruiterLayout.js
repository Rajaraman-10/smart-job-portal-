import React from 'react';
import { Outlet } from 'react-router-dom';
import RecruiterSidebar from '../components/RecruiterSidebar';
import RecruiterTopbar from '../components/RecruiterTopbar';

export default function RecruiterLayout({ currentUser, onLogout, theme, onToggleTheme }) {
  return (
    <div className="h-screen overflow-hidden bg-[#F5F6F3] dark:bg-slate-950 font-sans text-[#14181C] dark:text-slate-50">
      <div className="mx-auto flex h-screen max-w-[1480px] gap-6 p-4 md:p-6 lg:p-8">
        <RecruiterSidebar currentUser={currentUser} onLogout={onLogout} />
        <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden">
          <RecruiterTopbar currentUser={currentUser} theme={theme} onToggleTheme={onToggleTheme} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}