import React, { useMemo, useState } from "react";

import {
  BriefcaseBusiness,
  Users,
  UserCheck,
  CalendarDays,
  MessageSquare,
  Plus,
  Trophy,
  ChevronRight,
  Search,
} from "lucide-react";

import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { compareCandidates } from "../../services/api";

/* ============================================================
   CONSTANTS
============================================================ */

const SHORTLISTED_STATUSES = [
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "OFFER_SENT",
  "SELECTED",
  "JOINED",
];

const STAGE_OPTIONS = [
  {
    value: "ALL",
    label: "All stages",
  },
  {
    value: "APPLIED",
    label: "Applied",
  },
  {
    value: "RECRUITER_VIEWED",
    label: "Recruiter viewed",
  },
  {
    value: "SHORTLISTED",
    label: "Shortlisted",
  },
  {
    value: "RESUME_SHORTLISTED",
    label: "Resume shortlisted",
  },
  {
    value: "QUIZ_SCHEDULED",
    label: "Quiz scheduled",
  },
  {
    value: "QUIZ_COMPLETED",
    label: "Quiz completed",
  },
  {
    value: "QUIZ_PASSED",
    label: "Quiz passed",
  },
  {
    value: "INTERVIEW_SCHEDULED",
    label: "Interview scheduled",
  },
  {
    value: "INTERVIEW_COMPLETED",
    label: "Interview completed",
  },
  {
    value: "SELECTED",
    label: "Selected",
  },
  {
    value: "REJECTED",
    label: "Rejected",
  },
];

/* ============================================================
   HELPERS
============================================================ */

function formatDate(date) {
  if (!date) return "TBD";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "TBD";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status) {
  if (!status) return "Applied";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getCandidateName(application) {
  return (
    application?.applicant_name ||
    application?.candidate_name ||
    application?.applicant_email ||
    application?.email ||
    "Candidate"
  );
}

function getInitials(name) {
  if (!name) return "C";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
}

/* ============================================================
   STATUS STYLES
============================================================ */

const STATUS_STYLE = {
  APPLIED: `
    bg-slate-100
    text-slate-600
    dark:bg-white/10
    dark:text-slate-300
  `,

  RECRUITER_VIEWED: `
    bg-blue-50
    text-blue-700
    dark:bg-blue-500/10
    dark:text-blue-300
  `,

  SHORTLISTED: `
    bg-emerald-50
    text-emerald-700
    dark:bg-emerald-500/10
    dark:text-emerald-300
  `,

  RESUME_SHORTLISTED: `
    bg-emerald-50
    text-emerald-700
    dark:bg-emerald-500/10
    dark:text-emerald-300
  `,

  QUIZ_SCHEDULED: `
    bg-violet-50
    text-violet-700
    dark:bg-violet-500/10
    dark:text-violet-300
  `,

  QUIZ_COMPLETED: `
    bg-indigo-50
    text-indigo-700
    dark:bg-indigo-500/10
    dark:text-indigo-300
  `,

  QUIZ_PASSED: `
    bg-emerald-50
    text-emerald-700
    dark:bg-emerald-500/10
    dark:text-emerald-300
  `,

  INTERVIEW_SCHEDULED: `
    bg-cyan-50
    text-cyan-700
    dark:bg-cyan-500/10
    dark:text-cyan-300
  `,

  INTERVIEW_COMPLETED: `
    bg-teal-50
    text-teal-700
    dark:bg-teal-500/10
    dark:text-teal-300
  `,

  OFFER_SENT: `
    bg-amber-50
    text-amber-700
    dark:bg-amber-500/10
    dark:text-amber-300
  `,

  SELECTED: `
    bg-lime-50
    text-lime-700
    dark:bg-lime-500/10
    dark:text-lime-300
  `,

  JOINED: `
    bg-green-50
    text-green-700
    dark:bg-green-500/10
    dark:text-green-300
  `,

  REJECTED: `
    bg-red-50
    text-red-700
    dark:bg-red-500/10
    dark:text-red-300
  `,
};

/* ============================================================
   PIPELINE CARD
============================================================ */

function PipelineStage({
  index,
  total,
  label,
  value,
  icon: Icon,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        relative
        flex
        min-h-[150px]
        flex-1
        flex-col
        justify-between
        gap-5
        border-r
        border-dashed
        border-slate-200
        px-6
        py-6
        text-left
        transition
        last:border-r-0

        hover:bg-slate-50

        dark:border-white/[0.08]
        dark:hover:bg-white/[0.025]
      "
    >
      {/* Top */}
      <div className="flex items-center justify-between">
        <span
          className="
            text-[10px]
            font-mono
            font-medium
            tracking-[0.18em]
            text-slate-400

            dark:text-slate-500
          "
        >
          {String(index).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>

        <Icon
          className="
            h-[18px]
            w-[18px]
            text-slate-400
            transition-all
            duration-200

            group-hover:scale-110
            group-hover:text-emerald-600

            dark:text-slate-500
            dark:group-hover:text-emerald-400
          "
          strokeWidth={1.7}
        />
      </div>

      {/* Value */}
      <div>
        <p
          className="
            font-mono
            text-3xl
            font-semibold
            tracking-tight
            text-slate-900

            dark:text-white
          "
        >
          {value}
        </p>

        <p
          className="
            mt-1.5
            text-sm
            font-medium
            text-slate-500

            dark:text-slate-400
          "
        >
          {label}
        </p>
      </div>
    </button>
  );
}

/* ============================================================
   FILTER INPUT
============================================================ */

const inputClasses = `
  h-11
  w-full
  rounded-xl
  border
  border-slate-200
  bg-white
  px-3
  text-sm
  text-slate-900
  outline-none
  transition

  placeholder:text-slate-400

  focus:border-emerald-500/50
  focus:ring-4
  focus:ring-emerald-500/10

  dark:border-white/[0.08]
  dark:bg-[#111918]
  dark:text-white
  dark:placeholder:text-slate-500
`;

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function RecruiterDashboardPage({
  currentUser,
  jobs = [],
  applications = [],
  loading = false,
  onQuickAction,
  onViewProfile,
}) {
  /* ==========================================================
     FILTER STATE
  ========================================================== */

  const [searchTerm, setSearchTerm] =
    useState("");

  const [stageFilter, setStageFilter] =
    useState("ALL");

  const [minimumScore, setMinimumScore] =
    useState("");

  const [skillsFilter, setSkillsFilter] =
    useState("");

  const [workModeFilter, setWorkModeFilter] =
    useState("ALL");

  const [interviewFilter, setInterviewFilter] =
    useState("ALL");

  const [selectedCandidateIds, setSelectedCandidateIds] =
    useState([]);

  const [comparison, setComparison] =
    useState([]);

  const [comparisonError, setComparisonError] =
    useState("");

  /* ==========================================================
     METRICS
  ========================================================== */

  const activeJobs = jobs.filter(
    (job) =>
      String(job.status || "").toUpperCase() ===
      "ACTIVE"
  ).length;

  const totalApplications =
    applications.length;

  const shortlisted =
    applications.filter((application) =>
      SHORTLISTED_STATUSES.includes(
        application.status
      )
    ).length;

  const interviewsScheduled =
    applications.filter(
      (application) =>
        Array.isArray(
          application.interviews
        ) &&
        application.interviews.length > 0
    ).length;

  const selectedCandidates =
    applications.filter((application) =>
      ["SELECTED", "JOINED"].includes(
        application.status
      )
    ).length;

  const unreadMessages =
    applications.reduce(
      (total, application) =>
        total +
        Number(
          application.unread_message_count || 0
        ),
      0
    );

  /* ==========================================================
     FILTER APPLICATIONS
  ========================================================== */

  const filteredApplications = useMemo(() => {
    return applications.filter(
      (application) => {
        const search =
          searchTerm.trim().toLowerCase();

        const name =
          application.applicant_name ||
          application.candidate_name ||
          "";

        const email =
          application.applicant_email ||
          application.email ||
          "";

        const jobTitle =
          application.job_title || "";

        const company =
          application.job_company || "";

        const matchesSearch =
          !search ||
          [
            name,
            email,
            jobTitle,
            company,
          ].some((value) =>
            String(value)
              .toLowerCase()
              .includes(search)
          );

        /* ------------------------------------------
           SCORE
        ------------------------------------------ */

        const score =
          Number(
            application.ai_match_score
          ) || 0;

        const matchesScore =
          !minimumScore ||
          score >= Number(minimumScore);

        /* ------------------------------------------
           SKILLS
        ------------------------------------------ */

        const requiredSkills =
          skillsFilter
            .split(",")
            .map((skill) =>
              skill.trim().toLowerCase()
            )
            .filter(Boolean);

        const candidateSkills = `
          ${application.skills || ""}
          ${
            Array.isArray(
              application.ai_matched_skills
            )
              ? application.ai_matched_skills.join(
                  " "
                )
              : application.ai_matched_skills ||
                ""
          }
        `.toLowerCase();

        const matchesSkills =
          requiredSkills.length === 0 ||
          requiredSkills.every((skill) =>
            candidateSkills.includes(skill)
          );

        /* ------------------------------------------
           WORK MODE
        ------------------------------------------ */

        const matchesWorkMode =
          workModeFilter === "ALL" ||
          application.job_work_mode ===
            workModeFilter;

        /* ------------------------------------------
           INTERVIEW
        ------------------------------------------ */

        const hasInterview =
          Array.isArray(
            application.interviews
          ) &&
          application.interviews.length > 0;

        const matchesInterview =
          interviewFilter === "ALL" ||
          (interviewFilter === "SCHEDULED"
            ? hasInterview
            : !hasInterview);

        /* ------------------------------------------
           STAGE
        ------------------------------------------ */

        const matchesStage =
          stageFilter === "ALL" ||
          application.status ===
            stageFilter;

        return (
          matchesSearch &&
          matchesScore &&
          matchesSkills &&
          matchesWorkMode &&
          matchesInterview &&
          matchesStage
        );
      }
    );
  }, [
    applications,
    searchTerm,
    stageFilter,
    minimumScore,
    skillsFilter,
    workModeFilter,
    interviewFilter,
  ]);

  /* ==========================================================
     RECENT APPLICATIONS
  ========================================================== */

  const recentApplications =
    [...filteredApplications]
      .sort(
        (a, b) =>
          new Date(
            b.applied_at || 0
          ) -
          new Date(
            a.applied_at || 0
          )
      )
      .slice(0, 6);

  /* ==========================================================
     COMPARE CANDIDATES
  ========================================================== */

  const handleCompare = async () => {
    setComparisonError("");

    if (!selectedCandidateIds.length) {
      return;
    }

    try {
      const result =
        await compareCandidates(
          selectedCandidateIds
        );

      setComparison(
        Array.isArray(result)
          ? result
          : result?.results || []
      );
    } catch (error) {
      setComparisonError(
        error?.message ||
          "Unable to compare candidates."
      );
    }
  };

  /* ==========================================================
     QUICK ACTION SAFE HANDLER
  ========================================================== */

  const handleQuickAction = (action) => {
    if (typeof onQuickAction === "function") {
      onQuickAction(action);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[calc(100vh-120px)]
          w-full
          items-center
          justify-center
          bg-white

          dark:bg-[#070D0C]
        "
      >
        <LoadingSpinner label="Loading recruiter dashboard..." />
      </div>
    );
  }

  /* ==========================================================
     DASHBOARD
  ========================================================== */

  return (
    <div
      className="
        min-h-screen
        w-full
        bg-white
        text-slate-900

        dark:bg-[#070D0C]
        dark:text-white
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          space-y-6
        "
      >
        {/* ====================================================
            HERO
        ===================================================== */}

        <section
          className="
            border-b
            border-slate-200
            pb-7

            dark:border-white/[0.08]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-6

              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div className="min-w-0">
              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.22em]
                  text-emerald-600

                  dark:text-emerald-400
                "
              >
                Recruiter workspace
              </p>

              <h1
                className="
                  mt-2
                  text-3xl
                  font-bold
                  tracking-[-0.035em]
                  text-slate-950

                  dark:text-white

                  sm:text-4xl
                "
              >
                Welcome back
                {currentUser?.first_name
                  ? `, ${currentUser.first_name}`
                  : ""}
              </h1>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-500

                  dark:text-slate-400
                "
              >
                Manage your hiring pipeline,
                review candidates and keep every
                recruitment process in one place.
              </p>
            </div>

            <div
              className="
                flex
                flex-wrap
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  handleQuickAction(
                    "applications"
                  )
                }
                className="
                  inline-flex
                  h-12
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  px-5
                  text-sm
                  font-semibold
                  text-slate-800
                  shadow-sm
                  transition

                  hover:-translate-y-0.5
                  hover:border-slate-300
                  hover:shadow-md

                  dark:border-white/10
                  dark:bg-[#111918]
                  dark:text-white
                "
              >
                <Users className="h-4 w-4" />

                View candidates
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickAction(
                    "post-job"
                  )
                }
                className="
                  inline-flex
                  h-12
                  items-center
                  gap-2
                  rounded-full
                  bg-emerald-600
                  px-6
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-emerald-600/20
                  transition

                  hover:-translate-y-0.5
                  hover:bg-emerald-700
                "
              >
                <Plus className="h-4 w-4" />

                Post new job
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================
            PIPELINE
        ===================================================== */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm

            dark:border-white/[0.08]
            dark:bg-[#111918]
          "
        >
          <div
            className="
              grid
              grid-cols-1

              divide-y
              divide-dashed
              divide-slate-200

              sm:grid-cols-2
              sm:divide-x
              sm:divide-y-0

              xl:grid-cols-4

              dark:divide-white/[0.08]
            "
          >
            <PipelineStage
              index={1}
              total={4}
              label="Applications"
              value={totalApplications}
              icon={Users}
              onClick={() =>
                handleQuickAction(
                  "applications"
                )
              }
            />

            <PipelineStage
              index={2}
              total={4}
              label="Shortlisted"
              value={shortlisted}
              icon={UserCheck}
              onClick={() =>
                handleQuickAction(
                  "applications"
                )
              }
            />

            <PipelineStage
              index={3}
              total={4}
              label="Interviews"
              value={interviewsScheduled}
              icon={CalendarDays}
              onClick={() =>
                handleQuickAction(
                  "interviews"
                )
              }
            />

            <PipelineStage
              index={4}
              total={4}
              label="Selected"
              value={selectedCandidates}
              icon={Trophy}
              onClick={() =>
                handleQuickAction(
                  "applications"
                )
              }
            />
          </div>

          {/* Progress bar */}
          <div
            className="
              h-1
              w-full
              bg-slate-100

              dark:bg-white/[0.05]
            "
          >
            <div
              className="
                h-full
                rounded-r-full
                bg-emerald-500
                transition-all
                duration-500
              "
              style={{
                width: `${
                  totalApplications > 0
                    ? Math.min(
                        100,
                        (selectedCandidates /
                          totalApplications) *
                          100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </section>

        {/* ====================================================
            QUICK METRICS
        ===================================================== */}

        <section
          className="
            grid
            grid-cols-1
            gap-4

            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {/* Active jobs */}
          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                "manage-jobs"
              )
            }
            className="
              group
              flex
              items-center
              gap-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              text-left
              shadow-sm
              transition

              hover:-translate-y-0.5
              hover:border-emerald-200
              hover:shadow-md

              dark:border-white/[0.08]
              dark:bg-[#111918]
              dark:hover:border-emerald-500/20
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600

                dark:bg-emerald-500/10
                dark:text-emerald-400
              "
            >
              <BriefcaseBusiness size={19} />
            </div>

            <div>
              <p
                className="
                  text-2xl
                  font-bold
                  text-slate-900

                  dark:text-white
                "
              >
                {activeJobs}
              </p>

              <p
                className="
                  text-xs
                  text-slate-500

                  dark:text-slate-400
                "
              >
                Active jobs
              </p>
            </div>

            <ChevronRight
              className="
                ml-auto
                h-4
                w-4
                text-slate-300
                transition

                group-hover:translate-x-1
                group-hover:text-emerald-500
              "
            />
          </button>

          {/* Applications */}
          <div
            className="
              flex
              items-center
              gap-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm

              dark:border-white/[0.08]
              dark:bg-[#111918]
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600

                dark:bg-blue-500/10
                dark:text-blue-400
              "
            >
              <Users size={19} />
            </div>

            <div>
              <p
                className="
                  text-2xl
                  font-bold
                  text-slate-900

                  dark:text-white
                "
              >
                {totalApplications}
              </p>

              <p
                className="
                  text-xs
                  text-slate-500

                  dark:text-slate-400
                "
              >
                Total applications
              </p>
            </div>
          </div>

          {/* Interviews */}
          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                "interviews"
              )
            }
            className="
              group
              flex
              items-center
              gap-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              text-left
              shadow-sm
              transition

              hover:-translate-y-0.5
              hover:border-emerald-200
              hover:shadow-md

              dark:border-white/[0.08]
              dark:bg-[#111918]
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-violet-50
                text-violet-600

                dark:bg-violet-500/10
                dark:text-violet-400
              "
            >
              <CalendarDays size={19} />
            </div>

            <div>
              <p
                className="
                  text-2xl
                  font-bold
                  text-slate-900

                  dark:text-white
                "
              >
                {interviewsScheduled}
              </p>

              <p
                className="
                  text-xs
                  text-slate-500

                  dark:text-slate-400
                "
              >
                Interviews
              </p>
            </div>

            <ChevronRight
              className="
                ml-auto
                h-4
                w-4
                text-slate-300
                transition

                group-hover:translate-x-1
                group-hover:text-emerald-500
              "
            />
          </button>

          {/* Messages */}
          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                "messages"
              )
            }
            className="
              group
              flex
              items-center
              gap-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              text-left
              shadow-sm
              transition

              hover:-translate-y-0.5
              hover:border-emerald-200
              hover:shadow-md

              dark:border-white/[0.08]
              dark:bg-[#111918]
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-amber-50
                text-amber-600

                dark:bg-amber-500/10
                dark:text-amber-400
              "
            >
              <MessageSquare size={19} />
            </div>

            <div>
              <p
                className="
                  text-2xl
                  font-bold
                  text-slate-900

                  dark:text-white
                "
              >
                {unreadMessages}
              </p>

              <p
                className="
                  text-xs
                  text-slate-500

                  dark:text-slate-400
                "
              >
                Unread messages
              </p>
            </div>

            <ChevronRight
              className="
                ml-auto
                h-4
                w-4
                text-slate-300
                transition

                group-hover:translate-x-1
                group-hover:text-emerald-500
              "
            />
          </button>
        </section>

        {/* ====================================================
            FILTERS
        ===================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm

            dark:border-white/[0.08]
            dark:bg-[#111918]
          "
        >
          <div
            className="
              mb-4
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div>
              <h2
                className="
                  text-base
                  font-bold
                  text-slate-900

                  dark:text-white
                "
              >
                Candidate filters
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500

                  dark:text-slate-400
                "
              >
                Quickly find candidates in your
                hiring pipeline.
              </p>
            </div>

            <span
              className="
                rounded-full
                bg-slate-100
                px-3
                py-1
                text-xs
                font-medium
                text-slate-500

                dark:bg-white/[0.06]
                dark:text-slate-400
              "
            >
              {filteredApplications.length}{" "}
              results
            </span>
          </div>

          <div
            className="
              grid
              gap-3

              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-6
            "
          >
            {/* Search */}
            <div
              className="
                relative
                sm:col-span-2
                lg:col-span-3
                xl:col-span-2
              "
            >
              <Search
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search candidate, job or email..."
                className={`${inputClasses} pl-10`}
              />
            </div>

            {/* Score */}
            <input
              type="number"
              min="0"
              max="100"
              value={minimumScore}
              onChange={(event) =>
                setMinimumScore(
                  event.target.value
                )
              }
              placeholder="Min score"
              className={inputClasses}
            />

            {/* Skills */}
            <input
              type="text"
              value={skillsFilter}
              onChange={(event) =>
                setSkillsFilter(
                  event.target.value
                )
              }
              placeholder="Skills"
              className={inputClasses}
            />

            {/* Work mode */}
            <select
              value={workModeFilter}
              onChange={(event) =>
                setWorkModeFilter(
                  event.target.value
                )
              }
              className={inputClasses}
            >
              <option value="ALL">
                All work modes
              </option>

              <option value="Remote">
                Remote
              </option>

              <option value="Hybrid">
                Hybrid
              </option>

              <option value="On-site">
                On-site
              </option>
            </select>

            {/* Stage */}
            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(
                  event.target.value
                )
              }
              className={inputClasses}
            >
              {STAGE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={interviewFilter}
              onChange={(event) =>
                setInterviewFilter(
                  event.target.value
                )
              }
              className={`${inputClasses} max-w-[240px]`}
            >
              <option value="ALL">
                All interview states
              </option>

              <option value="SCHEDULED">
                Interview scheduled
              </option>

              <option value="NONE">
                No interview
              </option>
            </select>

            {(searchTerm ||
              minimumScore ||
              skillsFilter ||
              workModeFilter !== "ALL" ||
              stageFilter !== "ALL" ||
              interviewFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setMinimumScore("");
                  setSkillsFilter("");
                  setWorkModeFilter("ALL");
                  setStageFilter("ALL");
                  setInterviewFilter("ALL");
                }}
                className="
                  rounded-full
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-emerald-600
                  hover:bg-emerald-50

                  dark:hover:bg-emerald-500/10
                "
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* ====================================================
            CANDIDATE COMPARISON
        ===================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm

            dark:border-white/[0.08]
            dark:bg-[#111918]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4

              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-base
                  font-bold
                  text-slate-900

                  dark:text-white
                "
              >
                Compare candidates
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500

                  dark:text-slate-400
                "
              >
                Select candidates to compare their
                recruitment data.
              </p>
            </div>

            <div
              className="
                flex
                flex-col
                gap-3

                sm:flex-row
              "
            >
              <select
                multiple
                value={selectedCandidateIds.map(
                  String
                )}
                onChange={(event) => {
                  const ids = Array.from(
                    event.target.selectedOptions
                  )
                    .map((option) =>
                      Number(option.value)
                    )
                    .slice(0, 6);

                  setSelectedCandidateIds(
                    ids
                  );
                }}
                className="
                  min-h-[44px]
                  min-w-[260px]
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-2
                  text-sm
                  text-slate-900
                  outline-none

                  focus:border-emerald-500

                  dark:border-white/10
                  dark:bg-[#111918]
                  dark:text-white
                "
              >
                {filteredApplications.map(
                  (application) => (
                    <option
                      key={application.id}
                      value={application.id}
                    >
                      {getCandidateName(
                        application
                      )}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                disabled={
                  selectedCandidateIds.length ===
                  0
                }
                onClick={handleCompare}
                className="
                  h-11
                  rounded-xl
                  bg-emerald-600
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  transition

                  hover:bg-emerald-700

                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Compare
              </button>
            </div>
          </div>

          {comparisonError && (
            <div
              className="
                mt-4
                rounded-xl
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-600

                dark:bg-red-500/10
                dark:text-red-300
              "
            >
              {comparisonError}
            </div>
          )}

          {comparison.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-200

                      dark:border-white/[0.08]
                    "
                  >
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      Candidate
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      Match
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      Skills
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comparison.map(
                    (candidate) => (
                      <tr
                        key={candidate.id}
                        className="
                          border-b
                          border-slate-100

                          dark:border-white/[0.05]
                        "
                      >
                        <td className="px-3 py-3 text-sm font-medium">
                          {getCandidateName(
                            candidate
                          )}
                        </td>

                        <td className="px-3 py-3 text-sm">
                          {candidate.ai_match_score ??
                            "N/A"}
                          %
                        </td>

                        <td className="px-3 py-3 text-sm text-slate-500">
                          {candidate.skills ||
                            "Not provided"}
                        </td>

                        <td className="px-3 py-3 text-sm">
                          {formatStatus(
                            candidate.status
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ====================================================
            RECENT APPLICATIONS
        ===================================================== */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm

            dark:border-white/[0.08]
            dark:bg-[#111918]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              border-b
              border-slate-200
              px-5
              py-5

              dark:border-white/[0.08]

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-lg
                  font-bold
                  text-slate-900

                  dark:text-white
                "
              >
                Recent applications
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500

                  dark:text-slate-400
                "
              >
                The latest candidates entering your
                recruitment pipeline.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleQuickAction(
                  "applications"
                )
              }
              className="
                inline-flex
                items-center
                gap-1
                text-sm
                font-semibold
                text-emerald-600
                transition

                hover:text-emerald-700
              "
            >
              View all

              <ChevronRight
                size={16}
              />
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No applications yet"
                description="New candidate applications will appear here when candidates apply to your jobs."
                actionLabel="Post your first job"
                onAction={() =>
                  handleQuickAction(
                    "post-job"
                  )
                }
              />
            </div>
          ) : (
            <div
              className="
                divide-y
                divide-slate-100

                dark:divide-white/[0.06]
              "
            >
              {recentApplications.map(
                (application) => {
                  const candidateName =
                    getCandidateName(
                      application
                    );

                  const initials =
                    getInitials(
                      candidateName
                    );

                  const score =
                    application.ai_match_score;

                  return (
                    <button
                      type="button"
                      key={application.id}
                      onClick={() => {
                        if (
                          typeof onViewProfile ===
                          "function"
                        ) {
                          onViewProfile(
                            application.id
                          );
                        } else {
                          handleQuickAction(
                            "applications"
                          );
                        }
                      }}
                      className="
                        group
                        flex
                        w-full
                        flex-col
                        gap-4
                        px-5
                        py-4
                        text-left
                        transition

                        hover:bg-slate-50

                        dark:hover:bg-white/[0.025]

                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      {/* Candidate */}
                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                        "
                      >
                        <div
                          className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-emerald-50
                            text-sm
                            font-bold
                            text-emerald-700

                            dark:bg-emerald-500/10
                            dark:text-emerald-300
                          "
                        >
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              truncate
                              text-sm
                              font-semibold
                              text-slate-900

                              dark:text-white
                            "
                          >
                            {candidateName}
                          </p>

                          <p
                            className="
                              mt-1
                              truncate
                              text-xs
                              text-slate-500

                              dark:text-slate-400
                            "
                          >
                            {application.job_title ||
                              "Job position"}
                          </p>
                        </div>
                      </div>

                      {/* Right */}
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >
                        {score !== null &&
                          score !== undefined && (
                            <span
                              className="
                                hidden
                                rounded-full
                                bg-emerald-50
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-emerald-700

                                dark:bg-emerald-500/10
                                dark:text-emerald-300

                                sm:inline-flex
                              "
                            >
                              Match{" "}
                              {Math.round(
                                Number(score)
                              )}
                              %
                            </span>
                          )}

                        <div className="text-right">
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-3
                              py-1.5
                              text-xs
                              font-medium

                              ${
                                STATUS_STYLE[
                                  application
                                    .status
                                ] ||
                                `
                                  bg-slate-100
                                  text-slate-600
                                  dark:bg-white/10
                                  dark:text-slate-300
                                `
                              }
                            `}
                          >
                            {formatStatus(
                              application.status
                            )}
                          </span>

                          <p
                            className="
                              mt-1
                              text-[11px]
                              text-slate-400

                              dark:text-slate-500
                            "
                          >
                            {formatDate(
                              application.applied_at
                            )}
                          </p>
                        </div>

                        <ChevronRight
                          className="
                            h-4
                            w-4
                            text-slate-300
                            transition

                            group-hover:translate-x-1
                            group-hover:text-emerald-500

                            dark:text-slate-600
                          "
                        />
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* ====================================================
            FOOTER SUMMARY
        ===================================================== */}

        <section
          className="
            grid
            grid-cols-1
            gap-4

            md:grid-cols-3
          "
        >
          <SummaryCard
            icon={BriefcaseBusiness}
            title="Active openings"
            value={activeJobs}
            description="Jobs currently accepting candidates"
            isDark={false}
          />

          <SummaryCard
            icon={UserCheck}
            title="Shortlisted"
            value={shortlisted}
            description="Candidates progressing through hiring"
            isDark={false}
          />

          <SummaryCard
            icon={Trophy}
            title="Selected"
            value={selectedCandidates}
            description="Candidates selected for the next step"
            isDark={false}
          />
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm

        dark:border-white/[0.08]
        dark:bg-[#111918]
      "
    >
      <div className="flex items-start justify-between">
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-slate-100
            text-slate-600

            dark:bg-white/[0.06]
            dark:text-slate-300
          "
        >
          <Icon size={18} />
        </div>

        <span
          className="
            font-mono
            text-2xl
            font-bold
            text-slate-900

            dark:text-white
          "
        >
          {value}
        </span>
      </div>

      <h3
        className="
          mt-5
          text-sm
          font-bold
          text-slate-900

          dark:text-white
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1
          text-xs
          leading-5
          text-slate-500

          dark:text-slate-400
        "
      >
        {description}
      </p>
    </div>
  );
}