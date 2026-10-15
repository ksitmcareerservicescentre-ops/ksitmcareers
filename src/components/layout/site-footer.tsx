"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";
import {
  getFooterCmsDataAction,
  type FooterCmsData,
} from "@/actions/landing-cms";

const PLATFORM_ICONS: Record<string, string> = {
  YOUTUBE: "fab fa-youtube",
  INSTAGRAM: "fab fa-instagram",
  X_TWITTER: "fab fa-x-twitter",
  FACEBOOK: "fab fa-facebook-f",
  LINKEDIN: "fab fa-linkedin-in",
  TIKTOK: "fab fa-tiktok",
  WHATSAPP: "fab fa-whatsapp",
  OTHER: "fas fa-globe",
};

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  X_TWITTER: "X (Twitter)",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  WHATSAPP: "WhatsApp",
  OTHER: "Social Link",
};

const DEFAULT_SERVICES = [
  { id: "s-1", label: "Appointment Scheduler", url: "/services/consultations", isExternal: false },
  { id: "s-2", label: "Resume Builder", url: "/services/resume", isExternal: false },
  { id: "s-3", label: "Skills Training", url: "/services/training", isExternal: false },
  { id: "s-4", label: "Virtual Internship", url: "/services/internships", isExternal: false },
];

const DEFAULT_RESOURCES = [
  { id: "r-1", label: "Student Portal", url: "/login", isExternal: false },
  { id: "r-2", label: "Create Account", url: "/register", isExternal: false },
  { id: "r-3", label: "Announcements", url: "/#updates", isExternal: false },
  { id: "r-4", label: "Support", url: `mailto:${site.email}`, isExternal: false },
];

const DEFAULT_SOCIALS = [
  { id: "soc-1", platform: "YOUTUBE", url: "https://www.youtube.com/@ksitmcareers", isActive: true, displayOrder: 1 },
  { id: "soc-2", platform: "INSTAGRAM", url: "https://www.instagram.com/ksitmcarees", isActive: true, displayOrder: 2 },
  { id: "soc-3", platform: "X_TWITTER", url: "https://x.com/ksitmcareers", isActive: true, displayOrder: 3 },
  { id: "soc-4", platform: "FACEBOOK", url: "https://www.facebook.com/ksitmcareers", isActive: true, displayOrder: 4 },
];

export function SiteFooter() {
  const pathname = usePathname();
  const [cmsData, setCmsData] = useState<FooterCmsData | null>(null);

  useEffect(() => {
    let mounted = true;
    getFooterCmsDataAction()
      .then((data) => {
        if (mounted) setCmsData(data);
      })
      .catch((err) => {
        console.error("Failed to load footer CMS data:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff")
  ) {
    return null;
  }

  const contact = cmsData?.contactInfo;
  const address = contact?.address || site.address;
  const email = contact?.email || site.email;
  const phone = contact?.phone || site.phone;
  const phoneContact = contact?.phoneContact || site.phoneContact;
  const websiteUrl = contact?.websiteUrl || site.url;

  const serviceLinks =
    cmsData?.serviceLinks && cmsData.serviceLinks.length > 0
      ? cmsData.serviceLinks
      : DEFAULT_SERVICES;

  const resourceLinks =
    cmsData?.resourceLinks && cmsData.resourceLinks.length > 0
      ? cmsData.resourceLinks
      : DEFAULT_RESOURCES;

  const socialLinks =
    cmsData?.socialLinks && cmsData.socialLinks.length > 0
      ? cmsData.socialLinks
      : DEFAULT_SOCIALS;

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
              {serviceLinks.map((item) => (
                <li key={item.id}>
                  {item.isExternal || item.url.startsWith("http") ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#FF7F24] transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.url}
                      className="hover:text-[#FF7F24] transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              {resourceLinks.map((item) => (
                <li key={item.id}>
                  {item.isExternal ||
                  item.url.startsWith("http") ||
                  item.url.startsWith("mailto:") ? (
                    <a
                      href={item.url}
                      className="hover:text-[#FF7F24] transition-colors"
                      {...(item.isExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.url}
                      className="hover:text-[#FF7F24] transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
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
                <span>{address}</span>
              </li>
              <li className="flex items-start gap-2">
                <i
                  className="fas fa-envelope text-[#FF7F24] w-6 shrink-0 mt-1"
                  aria-hidden="true"
                ></i>
                <a
                  href={`mailto:${email}`}
                  className="hover:text-[#FF7F24] transition-colors break-all"
                >
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <i
                  className="fas fa-phone text-[#FF7F24] w-6 shrink-0 mt-1"
                  aria-hidden="true"
                ></i>
                <a
                  href={`tel:${phone.replaceAll(" ", "")}`}
                  className="hover:text-[#FF7F24] transition-colors"
                >
                  {phone} {phoneContact ? `— ${phoneContact}` : ""}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <i
                  className="fas fa-globe text-[#FF7F24] w-6 shrink-0 mt-1"
                  aria-hidden="true"
                ></i>
                <a
                  href={
                    websiteUrl.startsWith("http")
                      ? websiteUrl
                      : `https://${websiteUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF7F24] transition-colors break-all"
                >
                  {websiteUrl.replace(/^https?:\/\//, "")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-white/5 pt-8"
          aria-label="Social media links"
        >
          <span className="basis-full text-center text-xs font-bold uppercase tracking-widest text-gray-500">
            Follow KSITM Careers
          </span>
          {socialLinks.map((item) => {
            const label = PLATFORM_LABELS[item.platform] || item.platform;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] text-lg text-gray-300 shadow-lg shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#FF7F24]/70 hover:bg-[#40297B] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7F24]"
              >
                <i
                  className={`${PLATFORM_ICONS[item.platform] || "fas fa-link"} transition group-hover:scale-110`}
                  aria-hidden="true"
                />
              </a>
            );
          })}
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
