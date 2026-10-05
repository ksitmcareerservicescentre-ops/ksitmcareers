"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";

export function SiteFooter() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff")
  ) {
    return null;
  }
  return (
    <footer id="contacts" className="bg-[#0A0A1A] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src={site.shield}
                alt="KSITM Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-xl font-extrabold text-white">
                KSITM <span className="text-[#FF7F24]">Careers</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {site.institution} — {site.centre}. Empowering students for career
              success.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link
                  href="/services/consultations"
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  Appointment Scheduler
                </Link>
              </li>
              <li>
                <Link
                  href="/services/resume"
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  Resume Builder
                </Link>
              </li>
              <li>
                <Link
                  href="/services/training"
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  Skills Training
                </Link>
              </li>
              <li>
                <Link
                  href="/services/internships"
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  Virtual Internship
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link
                  href="/login"
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  Student Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/#updates"
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  Announcements
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <i
                  className="fas fa-map-marker-alt text-[#FF7F24] w-6 shrink-0 mt-1"
                  aria-hidden="true"
                ></i>
                <span>{site.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <i
                  className="fas fa-envelope text-[#FF7F24] w-6 shrink-0 mt-1"
                  aria-hidden="true"
                ></i>
                <a
                  href={`mailto:${site.email}`}
                  className="hover:text-[#FF7F24] transition-colors break-all"
                >
                  {site.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <i
                  className="fas fa-globe text-[#FF7F24] w-6 shrink-0 mt-1"
                  aria-hidden="true"
                ></i>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF7F24] transition-colors break-all"
                >
                  www.ksitmcareers.edu.ng
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center text-gray-400 text-sm">
          <p>
            &copy; 2026 {site.name}. All rights reserved. Built with{" "}
            <i className="fas fa-heart text-[#FF7F24]"></i> for student success
          </p>
        </div>
      </div>
    </footer>
  );
}
