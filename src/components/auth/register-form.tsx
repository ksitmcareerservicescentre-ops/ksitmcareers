"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { registerStudentAction, type AuthActionResult } from "@/actions/auth";

const KSITM_DEPARTMENTS = [
  "Computer Software Engineering",
  "Networking & System Security",
  "Banking Operations",
  "Multimedia Technology",
  "Telecommunications Technology",
  "Electrical & Electronics Engineering",
  "Accountancy & Financial Management",
  "Business & Entrepreneurship Studies",
  "Library & Information Science",
];

const ACADEMIC_LEVELS = [
  "National Diploma I (ND 1)",
  "National Diploma II (ND 2)",
  "Higher National Diploma I (HND 1)",
  "Higher National Diploma II (HND 2)",
];

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(registerStudentAction, null);

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block group">
          <div className="relative w-16 h-20 mx-auto mb-3 transform transition-transform group-hover:scale-105">
            <Image
              src="https://res.cloudinary.com/djkudkxmx/image/upload/v1790374243/KSITM_shield_pfusir.png"
              alt="KSITM Shield"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF7F24]">
            Career Services Centre
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Create Student Account
          </h1>
        </Link>
        <p className="text-gray-400 text-sm mt-2">
          Register with your KSITM matriculation credentials to activate your
          career support services.
        </p>
      </div>

      {/* Register Card */}
      <div className="bg-[#101023]/90 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/50">
        {state?.error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3"
          >
            <i
              className="fas fa-exclamation-circle text-red-400 mt-0.5"
              aria-hidden="true"
            ></i>
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} noValidate className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Full Name <span className="text-[#FF7F24]">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="e.g. Amina Yusuf"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  state?.fieldErrors?.fullName
                    ? "border-red-500"
                    : "border-white/15 focus:border-[#FF7F24]"
                } text-white placeholder-gray-500 text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24]`}
              />
              {state?.fieldErrors?.fullName && (
                <p className="text-red-400 text-xs mt-1">
                  {state.fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Registration Number */}
            <div>
              <label
                htmlFor="regNumber"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Registration Number <span className="text-[#FF7F24]">*</span>
              </label>
              <input
                id="regNumber"
                name="regNumber"
                type="text"
                required
                placeholder="e.g. KSITM/ND/STE/24/001"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  state?.fieldErrors?.regNumber
                    ? "border-red-500"
                    : "border-white/15 focus:border-[#FF7F24]"
                } text-white placeholder-gray-500 text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24] uppercase`}
              />
              {state?.fieldErrors?.regNumber && (
                <p className="text-red-400 text-xs mt-1">
                  {state.fieldErrors.regNumber}
                </p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Email Address <span className="text-[#FF7F24]">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="e.g. student@ksitmcareers.edu.ng"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  state?.fieldErrors?.email
                    ? "border-red-500"
                    : "border-white/15 focus:border-[#FF7F24]"
                } text-white placeholder-gray-500 text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24]`}
              />
              {state?.fieldErrors?.email && (
                <p className="text-red-400 text-xs mt-1">
                  {state.fieldErrors.email}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +234 801 234 5678"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-[#FF7F24] text-white placeholder-gray-500 text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Department
              </label>
              <select
                id="department"
                name="department"
                defaultValue=""
                className="w-full px-4 py-3 rounded-xl bg-[#101023] border border-white/15 focus:border-[#FF7F24] text-white text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24]"
              >
                <option value="" disabled className="text-gray-500">
                  Select your department
                </option>
                {KSITM_DEPARTMENTS.map((dept) => (
                  <option
                    key={dept}
                    value={dept}
                    className="bg-[#101023] text-white"
                  >
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Level */}
            <div>
              <label
                htmlFor="level"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Academic Level
              </label>
              <select
                id="level"
                name="level"
                defaultValue=""
                className="w-full px-4 py-3 rounded-xl bg-[#101023] border border-white/15 focus:border-[#FF7F24] text-white text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24]"
              >
                <option value="" disabled className="text-gray-500">
                  Select your current level
                </option>
                {ACADEMIC_LEVELS.map((lvl) => (
                  <option
                    key={lvl}
                    value={lvl}
                    className="bg-[#101023] text-white"
                  >
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Password{" "}
                <span className="text-[#FF7F24]">* (min. 8 chars)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                    state?.fieldErrors?.password
                      ? "border-red-500"
                      : "border-white/15 focus:border-[#FF7F24]"
                  } text-white placeholder-gray-500 text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24] pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-3.5 text-gray-500 hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer"
                >
                  <i
                    className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
              {state?.fieldErrors?.password && (
                <p className="text-red-400 text-xs mt-1">
                  {state.fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
              >
                Confirm Password <span className="text-[#FF7F24]">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  state?.fieldErrors?.confirmPassword
                    ? "border-red-500"
                    : "border-white/15 focus:border-[#FF7F24]"
                } text-white placeholder-gray-500 text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24]`}
              />
              {state?.fieldErrors?.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {state.fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            By registering, you confirm you are an enrolled student at Katsina
            State Institute of Technology and Management and agree to comply
            with the institutional Career Services guidelines.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-[#FF7F24] to-[#f56505] text-[#0A0A1A] font-extrabold text-sm hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-[#FF7F24]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <i
                  className="fas fa-circle-notch fa-spin"
                  aria-hidden="true"
                ></i>
                <span>Creating Account & Provisioning Dashboard...</span>
              </>
            ) : (
              <>
                <span>Complete Registration & Launch Dashboard</span>
                <i className="fas fa-arrow-right" aria-hidden="true"></i>
              </>
            )}
          </button>
        </form>

        {/* Login Prompt */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            Already registered?{" "}
            <Link
              href="/login"
              className="text-[#FF7F24] font-bold hover:underline"
            >
              Sign in with your Reg Number
            </Link>
          </p>
        </div>
      </div>

      {/* Back to Home Link */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
        >
          <i className="fas fa-chevron-left text-[10px]" aria-hidden="true"></i>
          <span>Return to KSITM Careers Homepage</span>
        </Link>
      </div>
    </div>
  );
}
