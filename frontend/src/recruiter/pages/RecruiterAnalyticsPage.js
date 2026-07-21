import React from 'react';
import { LineChart, PieChart, ResponsiveContainer, Line, XAxis, YAxis, Tooltip, CartesianGrid, Pie, Cell } from 'recharts';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const shareColors = ['#0E7C66', '#C17F1D', '#5B6660', '#B3402F'];

export default function RecruiterAnalyticsPage({ analytics, loading }) {
  if (loading) {
    return <LoadingSpinner label="Loading analytics..." />;
  }

  return (
    <div className="space-y-6 font-sans text-[#14181C]">
      <div className="grid gap-px border border-[#14181C]/10 bg-[#14181C]/10 sm:grid-cols-3">
        {[
          { label: 'Jobs posted', value: analytics?.jobs_posted || 0 },
          { label: 'Applications', value: analytics?.applications || 0 },
          { label: 'Interviews', value: analytics?.interviews || 0 },
        ].map((card) => (
          <div key={card.label} className="bg-white p-6">
            <p className="font-data text-xs tracking-widest text-[#5B6660]">{card.label.toUpperCase()}</p>
            <p className="mt-4 font-data text-3xl font-semibold text-[#14181C]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="border border-[#14181C]/10 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-[#14181C]">Applications per day</h2>
          <p className="mt-1 text-sm text-[#5B6660]">Recent applicant volume</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.applications_per_day || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#14181C" strokeOpacity={0.08} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#5B6660' }} />
                <YAxis tick={{ fontSize: 12, fill: '#5B6660' }} />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#0E7C66" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-[#14181C]/10 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-[#14181C]">Most applied jobs</h2>
          <p className="mt-1 text-sm text-[#5B6660]">Top performing openings</p>
          <div className="mt-4 space-y-4">
            {(analytics?.top_jobs || []).map((job) => (
              <div key={job.title}>
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-[#14181C]">{job.title}</p>
                  <p className="font-data text-sm text-[#5B6660]">{job.applications}</p>
                </div>
                <p className="text-sm text-[#5B6660]">{job.company}</p>
                <div className="mt-2 h-1.5 w-full bg-[#F5F6F3]">
                  <div className="h-1.5 bg-[#0E7C66]" style={{ width: `${Math.min(100, job.applications * 8)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="border border-[#14181C]/10 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-[#14181C]">Most popular skills</h2>
          <div className="mt-4 divide-y divide-[#14181C]/8">
            {(analytics?.top_skills || []).map((skill) => (
              <div key={skill.name} className="flex items-center justify-between py-3">
                <p className="font-medium text-[#14181C]">{skill.name}</p>
                <p className="font-data text-sm text-[#5B6660]">{skill.count} applications</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#14181C]/10 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-[#14181C]">Application share</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.job_share || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {(analytics?.job_share || []).map((_, index) => (
                    <Cell key={index} fill={shareColors[index % shareColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}