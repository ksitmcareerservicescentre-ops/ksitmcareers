"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";

type HeaderUser = { name: string; email: string; role: "STUDENT" | "STAFF" | "SUPER_ADMIN" };

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const displayName = user?.name || "Guest User";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "G";
  const accountHref = user?.role === "SUPER_ADMIN" ? "/admin" : user?.role === "STAFF" ? "/staff" : user ? "/dashboard" : "/login";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        if (mobileOpen) {
          setMobileOpen(false);
          document.getElementById("hamburger")?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return null;
  }

  return (
    <>
      <header
        id="header"
        className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-[#0A0A1A]/65 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.18)] transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Brand />

            {/* Navigation */}
            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-5 text-sm"
            >
              <Link
                href="/#hero"
                className="text-gray-200 hover:text-[#FF7F24] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/#services"
                className="text-gray-200 hover:text-[#FF7F24] transition-colors"
              >
                Services
              </Link>
              <Link
                href="/gallery"
                className="text-gray-200 hover:text-[#FF7F24] transition-colors"
              >
                Gallery
              </Link>
              <Link
                href="/#leaders"
                className="text-gray-200 hover:text-[#FF7F24] transition-colors"
              >
                Leadership
              </Link>
              <Link
                href="/#updates"
                className="text-gray-200 hover:text-[#FF7F24] transition-colors"
              >
                Updates
              </Link>
              <Link
                href="/#contacts"
                className="text-gray-200 hover:text-[#FF7F24] transition-colors"
              >
                Contacts
              </Link>
              <Link
                href="/#training"
                className="text-gray-200 hover:text-[#FF7F24] transition-colors"
              >
                Training
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <button
                type="button"
                id="userAvatar"
                aria-label="Open account drawer"
                onClick={() => setDrawerOpen(true)}
                className="relative cursor-pointer group bg-transparent border-0 p-0 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF7F24] to-[#40297B] flex items-center justify-center text-white font-bold text-lg ring-2 ring-[#FF7F24]/30 group-hover:ring-[#FF7F24] transition-all duration-300 hover:scale-105">
                  <span id="avatarText">{initials}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#40297B] rounded-full border-2 border-[#0A0A1A]"></span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF7F24] rounded-full animate-pulse"></div>
              </button>

              {/* Mobile Menu Button */}
              <button
                id="hamburger"
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-controls="mobileMenu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden text-white text-2xl hover:text-[#FF7F24] transition-colors bg-transparent border-0 p-1"
              >
                <i className={mobileOpen ? "fas fa-times" : "fas fa-bars"}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobileMenu"
          className={`lg:hidden ${mobileOpen ? "" : "hidden"} bg-[#0A0A1A]/95 backdrop-blur-xl border-t border-white/10`}
        >
          <nav
            aria-label="Mobile navigation"
            className="max-w-7xl mx-auto px-5 py-5 grid grid-cols-2 gap-x-4"
          >
            <Link
              href="/#hero"
              onClick={() => setMobileOpen(false)}
              className="block text-gray-200 hover:text-[#FF7F24] py-2"
            >
              Home
            </Link>
            <Link
              href="/#services"
              onClick={() => setMobileOpen(false)}
              className="block text-gray-200 hover:text-[#FF7F24] py-2"
            >
              Services
            </Link>
            <Link
              href="/gallery"
              onClick={() => setMobileOpen(false)}
              className="block text-gray-200 hover:text-[#FF7F24] py-2"
            >
              Gallery
            </Link>
            <Link
              href="/#leaders"
              onClick={() => setMobileOpen(false)}
              className="block text-gray-200 hover:text-[#FF7F24] py-2"
            >
              Leadership
            </Link>
            <Link
              href="/#updates"
              onClick={() => setMobileOpen(false)}
              className="block text-gray-200 hover:text-[#FF7F24] py-2"
            >
              Updates
            </Link>
            <Link
              href="/#contacts"
              onClick={() => setMobileOpen(false)}
              className="block text-gray-200 hover:text-[#FF7F24] py-2"
            >
              Contacts
            </Link>
            <Link
              href="/#training"
              onClick={() => setMobileOpen(false)}
              className="block text-gray-200 hover:text-[#FF7F24] py-2"
            >
              Training
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-[#FF7F24] font-semibold py-2"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* ===== USER DRAWER ===== */}
      <div
        id="drawerOverlay"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-500 ${
          drawerOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      ></div>
      <div
        id="userDrawer"
        className={`fixed top-0 right-0 w-full max-w-md h-full bg-[#0A0A1A] border-l border-white/10 z-50 transform transition-transform duration-500 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <h3 className="text-2xl font-bold text-white">Account</h3>
            <button
              id="drawerClose"
              type="button"
              aria-label="Close account drawer"
              onClick={() => setDrawerOpen(false)}
              className="text-gray-400 hover:text-white text-2xl transition-colors bg-transparent border-0"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* User Info */}
          <div className="py-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF7F24] to-[#40297B] flex items-center justify-center text-white text-2xl font-bold">
              <span id="drawerAvatar">{initials}</span>
            </div>
            <div>
              <h4 id="drawerName" className="text-white font-semibold text-lg">
                {displayName}
              </h4>
              <p id="drawerEmail" className="text-gray-400 text-sm">
                {user?.email || "Sign in to access your account"}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 space-y-2">
            <Link
              href={accountHref}
              onClick={() => setDrawerOpen(false)}
              id="loginBtn"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <i className="fas fa-sign-in-alt text-[#FF7F24]"></i>
              <span>{user ? "Open dashboard" : "Login"}</span>
            </Link>
            <Link
              href={user ? accountHref : "/register"}
              onClick={() => setDrawerOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <i className="fas fa-user-plus text-[#FF7F24]"></i>
              <span>{user ? "Account home" : "Create Account"}</span>
            </Link>
            <Link
              href={accountHref}
              onClick={() => setDrawerOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <i className="fas fa-user-circle text-[#40297B]"></i>
              <span>Profile</span>
            </Link>
            <Link
              href={accountHref}
              onClick={() => setDrawerOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <i className="fas fa-cog text-[#FF7F24]"></i>
              <span>Settings</span>
            </Link>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-white/10">
            <p className="text-gray-500 text-sm text-center">
              KSITM Careers v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
