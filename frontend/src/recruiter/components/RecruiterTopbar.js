import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronDown,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  Check,
  Menu,
} from "lucide-react";

export default function RecruiterTopbar({
  currentUser,
  theme = "light",
  onToggleTheme,
  onLogout,
  onMenuClick,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

  const isDark = theme === "dark";

  const initials = useMemo(() => {
    const first =
      currentUser?.first_name?.trim()?.charAt(0) ||
      currentUser?.username?.trim()?.charAt(0) ||
      "R";

    const last =
      currentUser?.last_name?.trim()?.charAt(0) || "";

    return `${first}${last}`.toUpperCase();
  }, [currentUser]);

  const displayName =
    currentUser?.first_name ||
    currentUser?.username ||
    "Recruiter";

  const email = currentUser?.email || "";

  return (
    <header
      className={`
        sticky top-0 z-40
        w-full
        border-b
        backdrop-blur-xl
        transition-colors duration-300
        ${
          isDark
            ? "border-white/[0.07] bg-[#0A100F]/90"
            : "border-slate-200/80 bg-[#F8FAF9]/90"
        }
      `}
    >
      <div className="flex min-h-[82px] items-center gap-4 px-4 sm:px-6 lg:px-8">

        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className={`
            flex h-11 w-11 shrink-0 items-center justify-center
            rounded-xl border transition lg:hidden
            ${
              isDark
                ? "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }
          `}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page Heading */}
        <div className="hidden shrink-0 md:block">
          <p
            className={`
              mb-1 text-[10px] font-bold uppercase
              tracking-[0.24em]
              ${
                isDark
                  ? "text-emerald-400"
                  : "text-emerald-700"
              }
            `}
          >
            Recruiter Portal
          </p>

          <h1
            className={`
              text-lg font-bold tracking-tight
              ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }
            `}
          >
            Hiring Workspace
          </h1>
        </div>

        {/* Search */}
        <div className="ml-auto flex max-w-2xl flex-1 items-center justify-end lg:ml-8">
          <div
            className={`
              relative w-full max-w-xl
              transition-all duration-300
              ${searchFocused ? "lg:max-w-2xl" : ""}
            `}
          >
            <Search
              className={`
                pointer-events-none absolute left-4 top-1/2
                h-[18px] w-[18px] -translate-y-1/2
                transition-colors
                ${
                  searchFocused
                    ? "text-emerald-500"
                    : isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }
              `}
            />

            <input
              type="text"
              placeholder="Search candidates, jobs, messages..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`
                h-12 w-full rounded-2xl border
                pl-11 pr-20 text-sm outline-none
                transition-all duration-200
                ${
                  isDark
                    ? `
                      border-white/[0.08]
                      bg-white/[0.04]
                      text-white
                      placeholder:text-slate-500
                      hover:border-white/[0.14]
                      focus:border-emerald-500/50
                      focus:bg-white/[0.06]
                      focus:ring-4
                      focus:ring-emerald-500/10
                    `
                    : `
                      border-slate-200
                      bg-white
                      text-slate-900
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-emerald-500/50
                      focus:ring-4
                      focus:ring-emerald-500/10
                    `
                }
              `}
            />

            {/* Keyboard Shortcut */}
            <div
              className={`
                pointer-events-none absolute right-3 top-1/2
                hidden -translate-y-1/2 items-center gap-1
                rounded-lg border px-2 py-1 text-[10px]
                font-semibold sm:flex
                ${
                  isDark
                    ? "border-white/10 bg-white/[0.05] text-slate-500"
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }
              `}
            >
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`
              group relative flex h-11 w-11
              items-center justify-center rounded-xl
              border transition-all duration-200
              ${
                isDark
                  ? `
                    border-white/[0.08]
                    bg-white/[0.04]
                    text-amber-300
                    hover:border-amber-400/20
                    hover:bg-amber-400/10
                  `
                  : `
                    border-slate-200
                    bg-white
                    text-slate-600
                    hover:border-emerald-200
                    hover:bg-emerald-50
                    hover:text-emerald-700
                  `
              }
            `}
            aria-label={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px] transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setNotificationOpen(!notificationOpen)
              }
              className={`
                relative flex h-11 w-11
                items-center justify-center rounded-xl
                border transition-all duration-200
                ${
                  isDark
                    ? `
                      border-white/[0.08]
                      bg-white/[0.04]
                      text-slate-300
                      hover:bg-white/[0.08]
                      hover:text-white
                    `
                    : `
                      border-slate-200
                      bg-white
                      text-slate-600
                      hover:bg-slate-50
                      hover:text-slate-900
                    `
                }
              `}
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />

              {/* Notification Dot */}
              <span
                className="
                  absolute right-[9px] top-[8px]
                  h-2 w-2 rounded-full
                  bg-emerald-500
                  ring-2 ring-white
                  dark:ring-[#0A100F]
                "
              />
            </button>

            {notificationOpen && (
              <div
                className={`
                  absolute right-0 top-[calc(100%+12px)]
                  w-[340px] overflow-hidden rounded-2xl
                  border shadow-2xl
                  ${
                    isDark
                      ? "border-white/[0.08] bg-[#111918]"
                      : "border-slate-200 bg-white"
                  }
                `}
              >
                <div
                  className={`
                    flex items-center justify-between
                    border-b px-4 py-4
                    ${
                      isDark
                        ? "border-white/[0.07]"
                        : "border-slate-100"
                    }
                  `}
                >
                  <div>
                    <h3
                      className={`
                        text-sm font-bold
                        ${
                          isDark
                            ? "text-white"
                            : "text-slate-900"
                        }
                      `}
                    >
                      Notifications
                    </h3>

                    <p
                      className={`
                        mt-0.5 text-xs
                        ${
                          isDark
                            ? "text-slate-500"
                            : "text-slate-400"
                        }
                      `}
                    >
                      Recent hiring activity
                    </p>
                  </div>

                  <button
                    type="button"
                    className="
                      text-xs font-semibold
                      text-emerald-600
                      hover:text-emerald-700
                    "
                  >
                    Mark all read
                  </button>
                </div>

                <div className="p-2">
                  <NotificationItem
                    isDark={isDark}
                    title="New application received"
                    description="A candidate applied for Software Developer."
                    time="5 min ago"
                  />

                  <NotificationItem
                    isDark={isDark}
                    title="Interview scheduled"
                    description="Technical interview scheduled for tomorrow."
                    time="1 hour ago"
                  />

                  <NotificationItem
                    isDark={isDark}
                    title="Candidate shortlisted"
                    description="A candidate has been moved to shortlist."
                    time="3 hours ago"
                  />
                </div>

                <div
                  className={`
                    border-t p-3 text-center
                    ${
                      isDark
                        ? "border-white/[0.07]"
                        : "border-slate-100"
                    }
                  `}
                >
                  <button
                    type="button"
                    className="
                      text-xs font-semibold
                      text-emerald-600
                      hover:text-emerald-700
                    "
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            className={`
              mx-1 hidden h-8 w-px sm:block
              ${
                isDark
                  ? "bg-white/[0.08]"
                  : "bg-slate-200"
              }
            `}
          />

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setProfileOpen(!profileOpen)
              }
              className={`
                group flex items-center gap-3
                rounded-2xl border px-2 py-1.5
                transition-all duration-200
                ${
                  isDark
                    ? `
                      border-white/[0.08]
                      bg-white/[0.04]
                      hover:bg-white/[0.07]
                    `
                    : `
                      border-slate-200
                      bg-white
                      hover:bg-slate-50
                    `
                }
              `}
            >
              {/* Avatar */}
              <div
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-emerald-500
                  to-teal-700
                  text-xs font-bold text-white
                  shadow-lg shadow-emerald-900/10
                "
              >
                {initials}
              </div>

              {/* User Info */}
              <div className="hidden min-w-0 text-left sm:block">
                <p
                  className={`
                    max-w-[130px] truncate
                    text-sm font-semibold
                    ${
                      isDark
                        ? "text-white"
                        : "text-slate-900"
                    }
                  `}
                >
                  {displayName}
                </p>

                <p
                  className={`
                    max-w-[130px] truncate text-[10px]
                    ${
                      isDark
                        ? "text-slate-500"
                        : "text-slate-400"
                    }
                  `}
                >
                  {email || "Recruiter"}
                </p>
              </div>

              <ChevronDown
                className={`
                  hidden h-4 w-4 transition-transform
                  sm:block
                  ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }
                  ${
                    isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }
                `}
              />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div
                className={`
                  absolute right-0 top-[calc(100%+12px)]
                  w-64 overflow-hidden rounded-2xl
                  border shadow-2xl
                  ${
                    isDark
                      ? "border-white/[0.08] bg-[#111918]"
                      : "border-slate-200 bg-white"
                  }
                `}
              >
                {/* Profile Header */}
                <div
                  className={`
                    border-b p-4
                    ${
                      isDark
                        ? "border-white/[0.07]"
                        : "border-slate-100"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex h-11 w-11 shrink-0
                        items-center justify-center
                        rounded-xl
                        bg-gradient-to-br
                        from-emerald-500
                        to-teal-700
                        text-sm font-bold text-white
                      "
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`
                          truncate text-sm font-bold
                          ${
                            isDark
                              ? "text-white"
                              : "text-slate-900"
                          }
                        `}
                      >
                        {displayName}
                      </p>

                      <p
                        className={`
                          truncate text-xs
                          ${
                            isDark
                              ? "text-slate-500"
                              : "text-slate-400"
                          }
                        `}
                      >
                        {email || "Recruiter account"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <div className="p-2">
                  <DropdownItem
                    isDark={isDark}
                    icon={User}
                    label="My Profile"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/recruiter/company-profile');
                    }}
                  />

                  <DropdownItem
                    isDark={isDark}
                    icon={Settings}
                    label="Settings"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/recruiter/settings');
                    }}
                  />
                </div>

                {/* Logout */}
                <div
                  className={`
                    border-t p-2
                    ${
                      isDark
                        ? "border-white/[0.07]"
                        : "border-slate-100"
                    }
                  `}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout?.();
                    }}
                    className={`
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-2.5
                      text-sm font-medium
                      transition
                      ${
                        isDark
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-red-600 hover:bg-red-50"
                      }
                    `}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------
   Notification Item
--------------------------------------- */

function NotificationItem({
  isDark,
  title,
  description,
  time,
}) {
  return (
    <div
      className={`
        group flex gap-3 rounded-xl p-3
        transition
        ${
          isDark
            ? "hover:bg-white/[0.04]"
            : "hover:bg-slate-50"
        }
      `}
    >
      <div
        className="
          mt-0.5 flex h-8 w-8 shrink-0
          items-center justify-center
          rounded-lg bg-emerald-500/10
          text-emerald-500
        "
      >
        <Check className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`
            text-xs font-semibold
            ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }
          `}
        >
          {title}
        </p>

        <p
          className={`
            mt-1 text-[11px] leading-4
            ${
              isDark
                ? "text-slate-500"
                : "text-slate-500"
            }
          `}
        >
          {description}
        </p>

        <p
          className={`
            mt-1 text-[10px]
            ${
              isDark
                ? "text-slate-600"
                : "text-slate-400"
            }
          `}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------
   Profile Dropdown Item
--------------------------------------- */

function DropdownItem({
  isDark,
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex w-full items-center gap-3
        rounded-xl px-3 py-2.5
        text-sm font-medium
        transition
        ${
          isDark
            ? "text-slate-300 hover:bg-white/[0.05] hover:text-white"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }
      `}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}