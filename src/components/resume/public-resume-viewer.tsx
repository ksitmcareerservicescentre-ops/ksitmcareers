"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicResumeViewData } from "@/actions/resume";

export function PublicResumeViewer({ data }: { data: PublicResumeViewData }) {
  const { resume, student } = data;
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070714] text-white">
      {/* Print stylesheet isolating the document sheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #resume-public-sheet,
          #resume-public-sheet * {
            visibility: visible !important;
          }
          #resume-public-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
        }
      `}</style>

      {/* Top Institutional Public Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A1A]/95 backdrop-blur-md print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Institution & Candidate Info */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="relative w-8 h-10 hover:opacity-80 transition-opacity shrink-0"
              title="KSITM Careers"
            >
              <Image
                src="https://res.cloudinary.com/djkudkxmx/image/upload/v1790374243/KSITM_shield_pfusir.png"
                alt="KSITM Logo"
                fill
                className="object-contain"
                priority
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white">
                  {student.fullName}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <i className="fas fa-certificate text-[9px]" />
                  <span>Verified Candidate</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {student.regNumber} · {student.department || "KSITM Scholar"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-all cursor-pointer active:scale-95"
              title="Copy shareable link to clipboard"
            >
              <i className={`fas ${copied ? "fa-check text-emerald-400" : "fa-share-nodes"}`} />
              <span>{copied ? "Link Copied!" : "Share Link"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 px-3.5 py-1.5 text-xs font-bold text-[#090915] transition-all shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
              title="Print or Save as PDF"
            >
              <i className="fas fa-print" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Resume Canvas Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Verification Banner */}
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <i className="fas fa-shield-check text-base" />
            </div>
            <div>
              <p className="font-bold text-emerald-300">
                Official Institutional Candidate Record
              </p>
              <p className="text-gray-400 text-[11px]">
                This curriculum vitae is authenticated by Katsina State Institute of Technology and Management Career Directorate.
              </p>
            </div>
          </div>
          <div className="font-mono text-[11px] text-gray-400 sm:text-right">
            <span>Template: </span>
            <span className="font-bold text-gray-200 uppercase">{resume.template}</span>
          </div>
        </div>

        {/* The White Document Canvas (Standard A4 / ATS Sheet) */}
        <div className="overflow-x-auto flex justify-center pb-12">
          <div
            ref={printRef}
            id="resume-public-sheet"
            style={{ width: "210mm", minHeight: "297mm" }}
            className={`bg-white text-gray-900 shadow-2xl rounded-sm p-8 sm:p-12 transition-all ${
              resume.fontFamily === "academic"
                ? "font-serif"
                : resume.fontFamily === "mono"
                ? "font-mono"
                : "font-sans"
            }`}
          >
            {/* ======================================================== */}
            {/* TEMPLATE 1: HARVARD ATS CLEAN (Single-Column)           */}
            {/* ======================================================== */}
            {(resume.template === "ats-clean" || !resume.template) && (
              <div className="space-y-5 text-left text-[13px] leading-relaxed text-gray-900">
                {/* Header */}
                <div className="text-center border-b pb-4 space-y-1">
                  <h1
                    className="text-2xl font-black uppercase tracking-wide"
                    style={{ color: resume.accentColor }}
                  >
                    {resume.fullName}
                  </h1>
                  <p className="text-xs font-semibold text-gray-700 tracking-wide uppercase">
                    {resume.headline}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 text-[11px] text-gray-600 pt-1">
                    {resume.location && <span>{resume.location}</span>}
                    {resume.phone && <span>· {resume.phone}</span>}
                    {resume.email && <span>· {resume.email}</span>}
                    {resume.linkedInUrl && (
                      <span>
                        ·{" "}
                        <a
                          href={resume.linkedInUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-gray-800"
                        >
                          LinkedIn
                        </a>
                      </span>
                    )}
                    {resume.githubUrl && (
                      <span>
                        ·{" "}
                        <a
                          href={resume.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-gray-800"
                        >
                          GitHub
                        </a>
                      </span>
                    )}
                    {resume.websiteUrl && (
                      <span>
                        ·{" "}
                        <a
                          href={resume.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-gray-800"
                        >
                          Portfolio
                        </a>
                      </span>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {resume.professionalSummary && (
                  <div className="space-y-1">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Professional Summary
                    </h2>
                    <p className="text-xs text-gray-800 pt-1 leading-normal">
                      {resume.professionalSummary}
                    </p>
                  </div>
                )}

                {/* Education */}
                {resume.education && resume.education.length > 0 && (
                  <div className="space-y-2">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Education & Academic Background
                    </h2>
                    <div className="space-y-2 pt-1">
                      {resume.education.map((edu, i) => (
                        <div key={i} className="text-xs">
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>{edu.institution}</span>
                            <span className="font-mono text-[11px] text-gray-600">
                              {edu.startDate} – {edu.isCurrent ? "Present" : edu.endDate}
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-700 italic">
                            <span>
                              {edu.qualification} in {edu.fieldOfStudy}
                            </span>
                            {edu.grade && (
                              <span className="text-[11px] font-semibold not-italic">
                                {edu.grade}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {resume.experience && resume.experience.length > 0 && (
                  <div className="space-y-3">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Work & Practical Experience
                    </h2>
                    <div className="space-y-3 pt-1">
                      {resume.experience.map((exp, i) => (
                        <div key={i} className="text-xs space-y-1">
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>
                              {exp.roleTitle} —{" "}
                              <span className="font-semibold text-gray-700">
                                {exp.organization}
                              </span>
                            </span>
                            <span className="font-mono text-[11px] text-gray-600">
                              {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                            </span>
                          </div>
                          {exp.location && (
                            <div className="text-[11px] text-gray-500 italic">
                              {exp.location}
                            </div>
                          )}
                          <div className="text-gray-800 text-[11px] whitespace-pre-line leading-relaxed pl-2">
                            {exp.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {resume.projects && resume.projects.length > 0 && (
                  <div className="space-y-2">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Selected Projects & Proof of Work
                    </h2>
                    <div className="space-y-2 pt-1">
                      {resume.projects.map((proj, i) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>
                              {proj.title}
                              {proj.role && (
                                <span className="font-normal text-gray-600">
                                  {" "}
                                  ({proj.role})
                                </span>
                              )}
                            </span>
                            {proj.projectUrl && (
                              <a
                                href={proj.projectUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-mono text-gray-500 underline"
                              >
                                Live Link
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-800">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {resume.skills && resume.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Skills & Core Competencies
                    </h2>
                    <div className="text-xs text-gray-800 pt-1 space-y-1">
                      {resume.skills.filter((s) => s.category === "TECHNICAL").length > 0 && (
                        <div>
                          <span className="font-bold">Technical: </span>
                          {resume.skills
                            .filter((s) => s.category === "TECHNICAL")
                            .map((s) => s.name)
                            .join(", ")}
                        </div>
                      )}
                      {resume.skills.filter((s) => s.category === "TOOLS").length > 0 && (
                        <div>
                          <span className="font-bold">Tools & Platforms: </span>
                          {resume.skills
                            .filter((s) => s.category === "TOOLS")
                            .map((s) => s.name)
                            .join(", ")}
                        </div>
                      )}
                      {resume.skills.filter((s) => s.category === "SOFT_SKILLS").length > 0 && (
                        <div>
                          <span className="font-bold">Interpersonal & Soft Skills: </span>
                          {resume.skills
                            .filter((s) => s.category === "SOFT_SKILLS")
                            .map((s) => s.name)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {resume.certifications && resume.certifications.length > 0 && (
                  <div className="space-y-1.5">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Certifications & Accreditations
                    </h2>
                    <div className="text-xs text-gray-800 pt-1 space-y-1">
                      {resume.certifications.map((c, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span>
                            <span className="font-bold">{c.name}</span> —{" "}
                            {c.issuingOrganization}
                          </span>
                          {c.issueDate && (
                            <span className="font-mono text-gray-500">{c.issueDate}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TEMPLATE 2: MODERN DUAL-COLUMN                          */}
            {/* ======================================================== */}
            {resume.template === "modern-dual" && (
              <div className="grid grid-cols-12 min-h-[260mm]">
                {/* Left Sidebar (4 Cols) */}
                <div
                  className="col-span-4 p-6 text-white space-y-5 rounded-l"
                  style={{ backgroundColor: resume.accentColor }}
                >
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-wide">
                      {resume.fullName}
                    </h1>
                    <p className="text-xs opacity-90 font-medium tracking-wide">
                      {resume.headline}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs opacity-95">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider border-b border-white/20 pb-1">
                      Contact
                    </h3>
                    <div className="space-y-1 text-[11px]">
                      {resume.location && <div>{resume.location}</div>}
                      {resume.phone && <div>{resume.phone}</div>}
                      {resume.email && <div className="break-all">{resume.email}</div>}
                      {resume.linkedInUrl && (
                        <div>
                          <a href={resume.linkedInUrl} className="underline">
                            LinkedIn
                          </a>
                        </div>
                      )}
                      {resume.githubUrl && (
                        <div>
                          <a href={resume.githubUrl} className="underline">
                            GitHub
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {resume.skills && resume.skills.length > 0 && (
                    <div className="space-y-2 text-xs opacity-95">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider border-b border-white/20 pb-1">
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {resume.skills.map((s, i) => (
                          <span
                            key={i}
                            className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {resume.certifications && resume.certifications.length > 0 && (
                    <div className="space-y-2 text-xs opacity-95">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider border-b border-white/20 pb-1">
                        Certifications
                      </h3>
                      <div className="space-y-2 pt-1 text-[11px]">
                        {resume.certifications.map((c, i) => (
                          <div key={i}>
                            <div className="font-bold">{c.name}</div>
                            <div className="text-[10px] opacity-80">
                              {c.issuingOrganization}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Main Column (8 Cols) */}
                <div className="col-span-8 p-7 space-y-5 text-gray-900 text-left">
                  {resume.professionalSummary && (
                    <div className="space-y-1.5">
                      <h2
                        className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                        style={{ color: resume.accentColor }}
                      >
                        Professional Profile
                      </h2>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        {resume.professionalSummary}
                      </p>
                    </div>
                  )}

                  {resume.experience && resume.experience.length > 0 && (
                    <div className="space-y-3">
                      <h2
                        className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                        style={{ color: resume.accentColor }}
                      >
                        Experience
                      </h2>
                      <div className="space-y-3 pt-1">
                        {resume.experience.map((exp, i) => (
                          <div key={i} className="text-xs space-y-1">
                            <div className="flex justify-between font-bold">
                              <span>
                                {exp.roleTitle} · {exp.organization}
                              </span>
                              <span className="font-mono text-[11px] text-gray-500">
                                {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed">
                              {exp.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resume.education && resume.education.length > 0 && (
                    <div className="space-y-2">
                      <h2
                        className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                        style={{ color: resume.accentColor }}
                      >
                        Education
                      </h2>
                      <div className="space-y-2 pt-1">
                        {resume.education.map((edu, i) => (
                          <div key={i} className="text-xs">
                            <div className="flex justify-between font-bold">
                              <span>{edu.institution}</span>
                              <span className="font-mono text-[11px] text-gray-500">
                                {edu.startDate} – {edu.endDate}
                              </span>
                            </div>
                            <div className="text-gray-700 text-[11px]">
                              {edu.qualification} in {edu.fieldOfStudy}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resume.projects && resume.projects.length > 0 && (
                    <div className="space-y-2">
                      <h2
                        className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                        style={{ color: resume.accentColor }}
                      >
                        Featured Projects
                      </h2>
                      <div className="space-y-2 pt-1">
                        {resume.projects.map((p, i) => (
                          <div key={i} className="text-xs">
                            <div className="font-bold">{p.title}</div>
                            <p className="text-[11px] text-gray-700">{p.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TEMPLATE 3 & 4: TECH MINIMAL & EXECUTIVE SERIF          */}
            {/* ======================================================== */}
            {(resume.template === "tech-minimal" || resume.template === "executive-serif") && (
              <div className="space-y-5 text-left text-[13px] leading-relaxed text-gray-900">
                <div
                  className={`border-b-2 pb-4 ${
                    resume.template === "executive-serif" ? "text-center" : ""
                  }`}
                  style={{ borderColor: resume.accentColor }}
                >
                  <h1
                    className="text-2xl font-black uppercase tracking-wide"
                    style={{ color: resume.accentColor }}
                  >
                    {resume.fullName}
                  </h1>
                  <p className="text-xs font-semibold text-gray-700 tracking-wide uppercase mt-0.5">
                    {resume.headline}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-gray-600 pt-2 font-mono">
                    {resume.location && <span>{resume.location}</span>}
                    {resume.phone && <span>· {resume.phone}</span>}
                    {resume.email && <span>· {resume.email}</span>}
                    {resume.linkedInUrl && (
                      <span>
                        ·{" "}
                        <a
                          href={resume.linkedInUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-gray-800"
                        >
                          LinkedIn
                        </a>
                      </span>
                    )}
                    {resume.githubUrl && (
                      <span>
                        ·{" "}
                        <a
                          href={resume.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-gray-800"
                        >
                          GitHub
                        </a>
                      </span>
                    )}
                  </div>
                </div>

                {resume.professionalSummary && (
                  <div className="space-y-1">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Professional Overview
                    </h2>
                    <p className="text-xs text-gray-800 pt-1 leading-normal">
                      {resume.professionalSummary}
                    </p>
                  </div>
                )}

                {resume.experience && resume.experience.length > 0 && (
                  <div className="space-y-3">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Experience Record
                    </h2>
                    <div className="space-y-3 pt-1">
                      {resume.experience.map((exp, i) => (
                        <div key={i} className="text-xs space-y-1">
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>
                              {exp.roleTitle} — {exp.organization}
                            </span>
                            <span className="font-mono text-[11px] text-gray-600">
                              {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                            </span>
                          </div>
                          <div className="text-gray-800 text-[11px] whitespace-pre-line leading-relaxed pl-2">
                            {exp.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resume.education && resume.education.length > 0 && (
                  <div className="space-y-2">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Education
                    </h2>
                    <div className="space-y-2 pt-1">
                      {resume.education.map((edu, i) => (
                        <div key={i} className="text-xs">
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>{edu.institution}</span>
                            <span className="font-mono text-[11px] text-gray-600">
                              {edu.startDate} – {edu.endDate}
                            </span>
                          </div>
                          <div className="text-gray-700 italic">
                            {edu.qualification} in {edu.fieldOfStudy}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resume.skills && resume.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <h2
                      className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                      style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                    >
                      Skills Matrix
                    </h2>
                    <div className="text-xs text-gray-800 pt-1 flex flex-wrap gap-1.5">
                      {resume.skills.map((s, i) => (
                        <span
                          key={i}
                          className="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] font-medium"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-500 print:hidden">
          <p>
            KSITM Career Services Directorate · Katsina State Institute of Technology and Management
          </p>
          <p className="mt-1 text-[11px] text-gray-600">
            For academic verification or recruitment inquiries, contact:{" "}
            <a href="mailto:careers@ksitm.edu.ng" className="text-orange-400 underline">
              careers@ksitm.edu.ng
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
