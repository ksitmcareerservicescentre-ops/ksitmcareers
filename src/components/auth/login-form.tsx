"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { loginAction, type AuthActionResult } from "@/actions/auth";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(loginAction, null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
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
            Institutional Portal Sign In
          </h1>
        </Link>
        <p className="text-gray-400 text-sm mt-2">
          Access your dashboard as a Student, Career Officer, or Super
          Administrator.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-[#101023]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
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

        <form action={formAction} noValidate className="space-y-5">
          {/* Identifier Input */}
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2"
            >
              Username, Reg Number or Email
            </label>
            <div className="relative">
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. student1, careerofficer1, superadmin, or reg no"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                  state?.fieldErrors?.identifier
                    ? "border-red-500"
                    : "border-white/15 focus:border-[#FF7F24]"
                } text-white placeholder-gray-500 text-sm transition-colors outline-none focus:ring-1 focus:ring-[#FF7F24]`}
              />
              <span className="absolute right-3.5 top-3.5 text-gray-500">
                <i className="fas fa-id-card" aria-hidden="true"></i>
              </span>
            </div>
            {state?.fieldErrors?.identifier && (
              <p className="text-red-400 text-xs mt-1">
                {state.fieldErrors.identifier}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-gray-300"
              >
                Password
              </label>
              <a
                href="mailto:contact@ksitmcareers.edu.ng?subject=Password%20Reset%20Assistance"
                className="text-xs text-[#FF7F24] hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#FF7F24] text-[#0A0A1A] font-extrabold text-sm hover:bg-[#40297B] hover:text-white active:scale-[0.99] transition-all duration-200 shadow-lg shadow-[#FF7F24]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <i
                  className="fas fa-circle-notch fa-spin"
                  aria-hidden="true"
                ></i>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <i className="fas fa-arrow-right" aria-hidden="true"></i>
              </>
            )}
          </button>
        </form>

        {/* Register Prompt */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            New KSITM student?{" "}
            <Link
              href="/register"
              className="text-[#FF7F24] font-bold hover:underline"
            >
              Create your account
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
