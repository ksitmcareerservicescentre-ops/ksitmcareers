"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/actions/auth";
import { ProfileSettingsModal } from "@/components/profile/profile-settings-modal";

interface DashboardHeaderProps {
  student: {
    fullName: string;
    regNumber: string;
    department?: string | null;
    level?: string | null;
    [key: string]: unknown;
  };
}

export function DashboardHeader({ student }: DashboardHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0A0A1A]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            {/* Brand Logo: Logo-only on mobile screens to maximize space for navigation */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
              title="KSITM Careers Student Portal"
            >
              <div className="relative w-8 h-10 sm:w-9 sm:h-11 transition-transform group-hover:scale-105 shrink-0">
                <Image
                  src="https://res.cloudinary.com/djkudkxmx/image/upload/v1790374243/KSITM_shield_pfusir.png"
                  alt="KSITM Shield Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* Brand text hidden on mobile, visible on sm and up */}
              <div className="hidden sm:block">
                <span className="font-heading font-extrabold text-base sm:text-lg text-white block leading-none">
                  KSITM <span className="text-[#FF7F24]">Careers</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold block mt-0.5">
                  Student Portal
                </span>
              </div>
            </Link>

            {/* Quick Nav & User Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Navigation Back to Public Landing Page (Always Visible on Mobile & Desktop) */}
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all shrink-0 active:scale-95"
                title="Return to Public Landing Page"
              >
                <i
                  className="fas fa-home text-[12px] text-[#FF7F24]"
                  aria-hidden="true"
                />
                <span className="text-xs">Landing</span>
              </Link>

              {/* Student Info Pill (Compact on mobile, expanded on tablet/desktop) */}
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                title="My Profile & Security Settings"
                className="flex items-center gap-2 sm:gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-1 px-1.5 sm:py-1.5 sm:px-3 transition-all cursor-pointer text-left shrink-0 active:scale-95"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#FF7F24] to-[#40297B] flex items-center justify-center text-white text-[11px] sm:text-xs font-bold ring-2 ring-[#FF7F24]/30 shrink-0">
                  {student.fullName ? student.fullName.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[120px] lg:max-w-[160px] leading-tight">
                    {student.fullName}
                  </p>
                  <p className="text-[10px] text-[#FF7F24] font-semibold tracking-wider uppercase leading-none mt-0.5">
                    {student.regNumber}
                  </p>
                </div>
                <i className="fas fa-cog text-gray-400 text-xs shrink-0 sm:ml-0.5" />
              </button>

              {/* Prominent Sign Out Button (Always clearly visible on all viewports) */}
              <form action={logoutAction} className="shrink-0">
                <button
                  type="submit"
                  title="Sign out of student portal"
                  aria-label="Sign out of student portal"
                  className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 sm:px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  <i className="fas fa-sign-out-alt text-xs" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {profileOpen && (
        <ProfileSettingsModal onClose={() => setProfileOpen(false)} />
      )}
    </>
  );
}
