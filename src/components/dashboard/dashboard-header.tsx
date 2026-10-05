"use client";

import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/actions/auth";

interface DashboardHeaderProps {
  student: {
    fullName: string;
    regNumber: string;
    department?: string | null;
    level?: string | null;
  };
}

export function DashboardHeader({ student }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-9 h-11 transition-transform group-hover:scale-105">
              <Image
                src="https://res.cloudinary.com/djkudkxmx/image/upload/v1790374243/KSITM_shield_pfusir.png"
                alt="KSITM Shield"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-white block leading-none">
                KSITM <span className="text-[#FF7F24]">Careers</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                Student Portal
              </span>
            </div>
          </Link>

          {/* Quick Nav & User Controls */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <i
                className="fas fa-external-link-alt text-[10px]"
                aria-hidden="true"
              ></i>
              <span>Public Website</span>
            </Link>

            {/* Student Info Pill */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-1.5 px-3 sm:px-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF7F24] to-[#40297B] flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#FF7F24]/30">
                {student.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white truncate max-w-[110px] sm:max-w-[160px]">
                  {student.fullName}
                </p>
                <p className="text-[10px] text-[#FF7F24] font-semibold tracking-wider uppercase">
                  {student.regNumber}
                </p>
              </div>
            </div>

            {/* Sign Out Button */}
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Sign out of student portal"
                className="inline-flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 text-xs font-semibold transition-all duration-200 cursor-pointer"
              >
                <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
