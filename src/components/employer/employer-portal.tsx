/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { logoutAction } from "@/actions/auth";
import {
  type EmployerRecommendationItem,
  employerUpdateRecommendationStatusAction,
} from "@/actions/employers";
import {
  createJobPostingAction,
  updateJobPostingAction,
  deleteJobPostingAction,
  type JobPostingItem,
  type CreateJobInput,
} from "@/actions/jobs";
import type { PartnerEmployerRecord } from "@/db/schema";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

const DEPARTMENTS = [
  "ALL",
  "Computer Science",
  "Computer Software Engineering",
  "Networking & System Security",
  "Banking Operations & FinTech",
  "Mass Communication",
  "Business Administration",
];

const WORK_NATURES = [
  "Full-Time",
  "Full-Time (Hybrid)",
  "Full-Time (On-Site)",
  "Full-Time (Remote)",
  "Part-Time",
  "Contract",
  "Internship / SIWES (On-Site)",
  "Internship / SIWES (Remote)",
];

export function EmployerPortal({
  employer,
  initialJobs,
  initialRecommendations,
  userEmail,
}: {
  employer: PartnerEmployerRecord;
  initialJobs: JobPostingItem[];
  initialRecommendations: EmployerRecommendationItem[];
  userEmail: string;
}) {
  const [activeTab, setActiveTab] = useState<"RECOMMENDATIONS" | "JOBS" | "PROFILE">(
    "RECOMMENDATIONS",
  );
  const [jobs, setJobs] = useState<JobPostingItem[]>(initialJobs);
  const [recommendations, setRecommendations] = useState<EmployerRecommendationItem[]>(
    initialRecommendations,
  );

  // Filters for recommendations
  const [selectedJobFilter, setSelectedJobFilter] = useState("ALL");
  const [recSearch, setRecSearch] = useState("");

  // Modals state
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPostingItem | null>(null);
  const [detailsJob, setDetailsJob] = useState<JobPostingItem | null>(null);
  const [feedbackRec, setFeedbackRec] = useState<EmployerRecommendationItem | null>(null);

  // Status / Feedback state for review modal
  const [newStatus, setNewStatus] = useState("INTERVIEW_SCHEDULED");
  const [feedbackNote, setFeedbackNote] = useState("");

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRecs = recommendations.filter((r) => {
    if (selectedJobFilter !== "ALL" && r.jobId !== selectedJobFilter) return false;
    if (recSearch.trim()) {
      const q = recSearch.toLowerCase();
      const matchName = r.studentName.toLowerCase().includes(q);
      const matchReg = r.studentRegNumber.toLowerCase().includes(q);
      const matchJob = r.jobTitle.toLowerCase().includes(q);
      const matchOfficer = r.recommenderName.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchJob && !matchOfficer) return false;
    }
    return true;
  });

  const totalVacancies = jobs.reduce((sum, j) => sum + (j.vacanciesCount || 1), 0);
  const activePlacements = recommendations.filter((r) => r.status === "IN_PROGRESS").length;

  const handleUpdateCandidateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackRec) return;
    setError(null);

    startTransition(async () => {
      const res = await employerUpdateRecommendationStatusAction(feedbackRec.id, {
        employerStatus: newStatus,
        employerFeedback: feedbackNote,
      });

      if (res.success) {
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === feedbackRec.id
              ? {
                  ...r,
                  employerStatus: newStatus,
                  employerFeedback: feedbackNote || r.employerFeedback,
                }
              : r,
          ),
        );
        setNotice("Candidate review status and feedback successfully updated!");
        setFeedbackRec(null);
        setFeedbackNote("");
        setTimeout(() => setNotice(null), 4000);
      } else {
        setError(res.error || "Failed to update candidate status.");
      }
    });
  };

  const handleDeleteJob = (jobId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteJobPostingAction(jobId);
      if (res.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        setNotice("Job opening removed.");
        setTimeout(() => setNotice(null), 3000);
      } else {
        setError(res.error || "Failed to delete job.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#070714] text-white">
      {/* Corporate Employer Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-10">
            <Image
              src="https://res.cloudinary.com/djkudkxmx/image/upload/v1790374243/KSITM_shield_pfusir.png"
              alt="KSITM Shield"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-white block">
                {employer.name}
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest hidden sm:inline-flex items-center gap-1">
                <i className="fas fa-check-circle text-[8px]" />
                <span>Verified Partner</span>
              </span>
            </div>
            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block -mt-0.5">
              Corporate Recruitment Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-white">
              {employer.contactPerson || "Corporate Recruiter"}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              {employer.contactDesignation || "Talent Lead"} • {userEmail}
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="py-1.5 px-3 rounded-lg border border-white/15 hover:border-red-500/50 hover:bg-red-500/10 text-gray-300 hover:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-sign-out-alt" aria-hidden="true" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Trust Banner */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#40297B]/40 via-[#101023] to-[#FF7F24]/15 border border-white/10 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                  <i className="fas fa-shield-alt" />
                  <span>Institutional Trust: {employer.verificationStatus}</span>
                </span>
                {employer.registrationNumber && (
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono">
                    CAC / Reg: {employer.registrationNumber}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                  Tier: {employer.partnershipTier.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {employer.name}
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Review verified student candidates personally recommended to your job openings by KSITM Career Advisors, inspect recommendation rationales, and manage your organization&apos;s vacancies.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingJob(null);
                  setJobModalOpen(true);
                }}
                className={orangeButton}
              >
                <i className="fas fa-plus" />
                <span>Upload New Job Opening</span>
              </button>
            </div>
          </div>
        </section>

        {notice && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
            <i className="fas fa-check-circle text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Ribbon */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
              Recommended Candidates
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-orange-400 mt-1">
              {recommendations.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Endorsed by KSITM advisors</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
              Active Job Postings
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {jobs.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Published opportunities</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
              Total Open Vacancies
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">
              {totalVacancies}
            </div>
            <p className="text-xs text-gray-500 mt-1">Positions needed</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
              Supervised Placements
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              {activePlacements}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active in-progress work</p>
          </div>
        </section>

        {/* Portal Tabs */}
        <div className="flex border-b border-white/10 gap-3 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("RECOMMENDATIONS")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "RECOMMENDATIONS"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-user-check" />
            <span>Recommended Candidates</span>
            <span className="rounded-full bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-300">
              {recommendations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JOBS")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "JOBS"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-briefcase" />
            <span>My Job Openings</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">
              {jobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PROFILE")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "PROFILE"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-building" />
            <span>Company Profile & Trust Badges</span>
          </button>
        </div>

        {/* TAB 1: RECOMMENDED CANDIDATES ("Who is recommended to their job, who did the recommendation, the reason why, and contact") */}
        {activeTab === "RECOMMENDATIONS" && (
          <section className="space-y-6">
            {/* Filters */}
            <div className="p-4 rounded-2xl bg-[#101023] border border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search candidate name, reg number, job…"
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div className="w-full sm:w-72">
                <select
                  value={selectedJobFilter}
                  onChange={(e) => setSelectedJobFilter(e.target.value)}
                  className={inputStyle}
                >
                  <option value="ALL">All Job Openings ({jobs.length})</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredRecs.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#101023] p-12 text-center text-xs text-gray-400 space-y-3">
                <i className="fas fa-user-friends text-3xl text-gray-600 block mb-1" />
                <p className="text-sm font-bold text-white">No Candidate Recommendations Found</p>
                <p className="max-w-md mx-auto text-gray-400">
                  KSITM Career Advisors assess students daily and recommend matched candidates to your vacancies with tailored justifications.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredRecs.map((rec) => {
                  return (
                    <article
                      key={rec.id}
                      className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#101023] via-[#0d0d1e] to-[#40297B]/20 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden"
                    >
                      {/* Top Header: Candidate Identity & Target Job */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-4 border-b border-white/10">
                        {/* Student Identity with Passport */}
                        <div className="flex items-start gap-4">
                          <div className="relative shrink-0">
                            {rec.studentAvatarUrl ? (
                              <img
                                src={rec.studentAvatarUrl}
                                alt={`${rec.studentName} Passport`}
                                className="h-16 w-16 rounded-2xl object-cover border-2 border-orange-500/40 shadow-lg shadow-orange-500/10"
                              />
                            ) : (
                              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/50 to-black border-2 border-dashed border-orange-500/40 text-orange-300">
                                <i className="fas fa-id-badge text-2xl mb-0.5 text-orange-400" />
                                <span className="text-[8px] uppercase font-mono font-bold">Passport</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold block">
                              Recommended Candidate
                            </span>
                            <h2 className="text-xl font-extrabold text-white">
                              {rec.studentName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                              <span className="font-mono text-purple-300 font-bold">
                                {rec.studentRegNumber}
                              </span>
                              <span>•</span>
                              <span>{rec.studentDepartment || "KSITM"}</span>
                              {rec.studentLevel && (
                                <>
                                  <span>•</span>
                                  <span>Level: {rec.studentLevel}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Targeted Job Badge */}
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 md:text-right space-y-1 shrink-0">
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                            Target Opening
                          </span>
                          <div className="text-sm font-bold text-white">{rec.jobTitle}</div>
                          <div className="text-xs text-orange-400 font-medium">
                            {rec.natureOfWork} • {rec.duration}
                          </div>
                        </div>
                      </div>

                      {/* Who Recommended & The Reason Why */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Who Did the Recommendation */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">
                            Recommending Career Staff
                          </span>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 text-xs font-bold">
                              <i className="fas fa-user-tie" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">
                                {rec.recommenderName}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {rec.recommenderDesignation || "Advisory Officer"}
                              </div>
                            </div>
                          </div>
                          {rec.recommenderEmail && (
                            <a
                              href={`mailto:${rec.recommenderEmail}?subject=Inquiry%20regarding%20candidate%20${encodeURIComponent(rec.studentName)}`}
                              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors pt-1"
                            >
                              <i className="fas fa-envelope text-[10px]" />
                              <span>{rec.recommenderEmail}</span>
                            </a>
                          )}
                        </div>

                        {/* The Reason Why (Advisory Endorsement) */}
                        <div className="lg:col-span-2 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-orange-400">
                            <div className="flex items-center gap-1.5">
                              <i className="fas fa-quote-left text-sm" />
                              <span>Advisory Recommendation Rationale (&quot;Why Recommended&quot;)</span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans italic">
                            &ldquo;{rec.recommendationReason}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Contact & Status Controls Bar */}
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Direct Candidate Contact Controls */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-gray-400 font-semibold mr-1">Direct Contact:</span>
                          {rec.studentEmail ? (
                            <a
                              href={`mailto:${rec.studentEmail}?subject=Invitation%20for%20Interview%20-%20${encodeURIComponent(employer.name)}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 px-3 py-1.5 font-bold text-white transition-colors"
                            >
                              <i className="fas fa-envelope text-orange-400" />
                              <span>{rec.studentEmail}</span>
                            </a>
                          ) : (
                            <span className="text-gray-500">Email not set</span>
                          )}

                          {rec.studentPhone && (
                            <a
                              href={`tel:${rec.studentPhone}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 px-3 py-1.5 font-bold text-emerald-300 transition-colors"
                            >
                              <i className="fas fa-phone-alt text-emerald-400" />
                              <span>{rec.studentPhone}</span>
                            </a>
                          )}
                        </div>

                        {/* Status & Review Action */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">
                              Status
                            </span>
                            <span className="text-xs font-bold text-white uppercase">
                              {rec.employerStatus || rec.status.replace("_", " ")}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackRec(rec);
                              setNewStatus(rec.employerStatus || "INTERVIEW_SCHEDULED");
                              setFeedbackNote(rec.employerFeedback || "");
                            }}
                            className={orangeButton}
                          >
                            <i className="fas fa-edit" />
                            <span>Update Review / Status</span>
                          </button>
                        </div>
                      </div>

                      {/* Employer Feedback Note if present */}
                      {rec.employerFeedback && (
                        <div className="text-xs text-gray-400 border-t border-white/5 pt-3">
                          <span className="font-bold text-gray-300">Your Corporate Feedback:</span>{" "}
                          <span>{rec.employerFeedback}</span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: MY JOB OPENINGS (CRUD) */}
        {activeTab === "JOBS" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  Job Vacancies Posted by {employer.name}
                </h2>
                <p className="text-gray-400 text-xs">
                  Create, edit, and publish opportunities for KSITM students and certified alumni.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingJob(null);
                  setJobModalOpen(true);
                }}
                className={orangeButton}
              >
                <i className="fas fa-plus" />
                <span>Post New Job Opening</span>
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#101023] p-12 text-center text-xs text-gray-400 space-y-3">
                <i className="fas fa-briefcase text-3xl text-gray-600 block mb-1" />
                <p className="text-sm font-bold text-white">No Vacancies Posted Yet</p>
                <p>Upload your first job opening to start receiving matched candidate recommendations.</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingJob(null);
                    setJobModalOpen(true);
                  }}
                  className={orangeButton}
                >
                  <i className="fas fa-plus" />
                  <span>Upload Job Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => {
                  const jobRecsCount = recommendations.filter((r) => r.jobId === job.id).length;

                  return (
                    <article
                      key={job.id}
                      className="rounded-2xl border border-white/10 bg-[#101023] p-6 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-orange-400 font-bold uppercase">
                              {job.department}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-0.5 line-clamp-1">
                              {job.title}
                            </h3>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                              job.isPublished
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                            }`}
                          >
                            {job.isPublished ? "Active" : "Draft"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-gray-300">
                            {job.natureOfWork}
                          </span>
                          <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-gray-300">
                            {job.duration}
                          </span>
                          <span className="rounded-lg bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-purple-300 font-bold">
                            {job.vacanciesCount} {job.vacanciesCount === 1 ? "Vacancy" : "Vacancies"}
                          </span>
                        </div>

                        {job.salaryRange && (
                          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <i className="fas fa-money-bill-wave text-[11px]" />
                            <span>{job.salaryRange}</span>
                          </div>
                        )}

                        {job.location && (
                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <i className="fas fa-map-marker-alt text-gray-500 text-[11px]" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}

                        <div className="pt-2">
                          <span className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-300 inline-flex items-center gap-1.5">
                            <i className="fas fa-user-check text-[10px]" />
                            <span>{jobRecsCount} Recommended Candidates</span>
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsJob(job)}
                            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white"
                          >
                            View Specs
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJob(job);
                              setJobModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-xs font-semibold text-orange-400"
                          >
                            Edit
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          className="px-2 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-xs font-semibold text-red-400"
                          title="Delete Job"
                        >
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: COMPANY PROFILE & TRUST BADGES */}
        {activeTab === "PROFILE" && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#101023] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold block">
                    Institutional Corporate Record
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {employer.name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <i className="fas fa-check-circle" />
                    <span>Status: {employer.verificationStatus}</span>
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              {employer.trustBadges && employer.trustBadges.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold block">
                    Institutional Trust Badges & Accreditations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {employer.trustBadges.map((badge, idx) => (
                      <span
                        key={idx}
                        className="rounded-xl bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-300 flex items-center gap-1.5"
                      >
                        <i className="fas fa-award text-orange-400" />
                        <span>{badge}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Registration / CAC</span>
                  <span className="font-bold text-white font-mono text-sm block">
                    {employer.registrationNumber || "Not Provided"}
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Industry Sector</span>
                  <span className="font-bold text-white text-sm block">{employer.industry}</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Partnership Tier</span>
                  <span className="font-bold text-purple-400 text-sm block">
                    {employer.partnershipTier.replace("_", " ")}
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Corporate Email</span>
                  <span className="font-bold text-white block truncate">
                    {employer.officialEmail || employer.contactEmail || "Not Provided"}
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Contact Person</span>
                  <span className="font-bold text-white block">
                    {employer.contactPerson} ({employer.contactDesignation || "Talent Lead"})
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Official Website</span>
                  {employer.websiteUrl ? (
                    <a
                      href={employer.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-orange-400 hover:underline block truncate"
                    >
                      {employer.websiteUrl}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not Provided</span>
                  )}
                </div>
              </div>

              {/* Bio / Description */}
              {employer.description && (
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold block">
                    Organization Overview
                  </span>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-black/40 p-5 rounded-2xl border border-white/5 whitespace-pre-line">
                    {employer.description}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: Job Creator / Editor Modal */}
      {jobModalOpen && (
        <EmployerJobEditorModal
          employer={employer}
          initialData={editingJob}
          onClose={() => {
            setJobModalOpen(false);
            setEditingJob(null);
          }}
          onSaved={(savedJob) => {
            if (editingJob) {
              setJobs((prev) => prev.map((j) => (j.id === savedJob.id ? savedJob : j)));
              setNotice("Job opening updated successfully!");
            } else {
              setJobs((prev) => [savedJob, ...prev]);
              setNotice("New job opening published successfully!");
            }
            setJobModalOpen(false);
            setEditingJob(null);
            setTimeout(() => setNotice(null), 3500);
          }}
        />
      )}

      {/* MODAL 2: Job Specifications Modal */}
      {detailsJob && (
        <EmployerJobSpecsModal job={detailsJob} onClose={() => setDetailsJob(null)} />
      )}

      {/* MODAL 3: Update Candidate Status & Feedback Modal */}
      {feedbackRec && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
          <div className="relative my-4 sm:my-8 w-full max-w-xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
            <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
                  Employer Recruitment Review
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  Update Candidate Status
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackRec(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <i className="fas fa-times text-orange-400" />
                <span>Close</span>
              </button>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0c0c1e] p-3 text-xs">
              <span className="text-[10px] font-mono text-gray-500 uppercase block">Candidate</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {feedbackRec.studentName} ({feedbackRec.studentRegNumber})
              </div>
              <div className="text-gray-400 text-[11px] mt-0.5">
                Job: {feedbackRec.jobTitle}
              </div>
            </div>

            <form onSubmit={handleUpdateCandidateStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-300 block mb-1">
                  Corporate Hiring Review Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className={inputStyle}
                >
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                  <option value="HIRED_IN_PROGRESS">Candidate Hired / Placement In-Progress</option>
                  <option value="OFFER_EXTENDED">Offer Extended</option>
                  <option value="UNDER_REVIEW">Under Review / Shortlisted</option>
                  <option value="NOT_SELECTED">Not Selected</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1">
                  Employer Feedback & Interview Notes
                </label>
                <textarea
                  rows={4}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="Record your observation or next steps (e.g. 'Invited for technical interview on Friday 10 AM', 'Candidate passed first stage'). This appends to the placement record."
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setFeedbackRec(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={orangeButton}>
                  {isPending ? "Saving Review…" : "Save Candidate Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployerJobEditorModal({
  employer,
  initialData,
  onClose,
  onSaved,
}: {
  employer: PartnerEmployerRecord;
  initialData: JobPostingItem | null;
  onClose: () => void;
  onSaved: (job: JobPostingItem) => void;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [department, setDepartment] = useState(initialData?.department || "Computer Science");
  const [natureOfWork, setNatureOfWork] = useState(initialData?.natureOfWork || "Full-Time");
  const [duration, setDuration] = useState(initialData?.duration || "Permanent");
  const [vacanciesCount, setVacanciesCount] = useState(initialData?.vacanciesCount || 1);
  const [salaryRange, setSalaryRange] = useState(initialData?.salaryRange || "₦150,000 - ₦250,000 / month");
  const [location, setLocation] = useState(initialData?.location || "Katsina / Hybrid, Nigeria");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [skills, setSkills] = useState(initialData?.skills || "");
  const [requirements, setRequirements] = useState(initialData?.requirements?.join("\n") || "");
  const [responsibilities, setResponsibilities] = useState(
    initialData?.responsibilities?.join("\n") || "",
  );
  const [contactEmail, setContactEmail] = useState(
    initialData?.contactEmail || employer.contactEmail || "",
  );
  const [applicationUrl, setApplicationUrl] = useState(initialData?.applicationUrl || "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !description.trim()) {
      setError("Please complete all required fields (title, summary, description).");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: CreateJobInput = {
        title: title.trim(),
        employerId: employer.id,
        companyName: employer.name,
        companyLogoUrl: employer.logoUrl || undefined,
        department,
        natureOfWork,
        duration: duration.trim(),
        vacanciesCount: Number(vacanciesCount) || 1,
        salaryRange: salaryRange.trim() || undefined,
        location: location.trim(),
        summary: summary.trim(),
        description: description.trim(),
        skills: skills.trim() || undefined,
        requirements: requirements
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        responsibilities: responsibilities
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        contactEmail: contactEmail.trim() || undefined,
        applicationUrl: applicationUrl.trim() || undefined,
        isPublished,
      };

      if (initialData) {
        const res = await updateJobPostingAction(initialData.id, payload);
        if (!res.success) throw new Error(res.error);
        onSaved({
          ...initialData,
          ...payload,
          vacanciesCount: Number(vacanciesCount) || 1,
          updatedAt: new Date(),
        });
      } else {
        const res = await createJobPostingAction(payload);
        if (!res.success || !res.jobId) throw new Error(res.error);
        onSaved({
          id: res.jobId,
          slug: `${employer.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          employerId: employer.id,
          companyName: employer.name,
          companyLogoUrl: employer.logoUrl,
          title: payload.title,
          department: payload.department,
          natureOfWork: payload.natureOfWork,
          duration: payload.duration,
          vacanciesCount: payload.vacanciesCount,
          salaryRange: payload.salaryRange || null,
          location: payload.location,
          summary: payload.summary,
          description: payload.description,
          requirements: payload.requirements || [],
          responsibilities: payload.responsibilities || [],
          skills: payload.skills || null,
          applicationDeadline: null,
          contactEmail: payload.contactEmail || null,
          applicationUrl: payload.applicationUrl || null,
          isPublished: payload.isPublished ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
          recommendationsCount: 0,
          activePlacementsCount: 0,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save job opening.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
              {employer.name} • Vacancy Editor
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {initialData ? "Edit Job Opening" : "Upload New Job Opening"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <i className="fas fa-times text-orange-400" />
            <span>Close</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-300 block mb-1">Job Opening Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Associate Network Support Engineer"
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-gray-300 block mb-1">Target Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputStyle}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-300 block mb-1">Nature of Work</label>
              <select
                value={natureOfWork}
                onChange={(e) => setNatureOfWork(e.target.value)}
                className={inputStyle}
              >
                {WORK_NATURES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-300 block mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. Permanent or 12 Months"
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-gray-300 block mb-1">Number of Vacancies *</label>
              <input
                type="number"
                min={1}
                required
                value={vacanciesCount}
                onChange={(e) => setVacanciesCount(parseInt(e.target.value, 10) || 1)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-300 block mb-1">Salary / Compensation</label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. ₦180,000 - ₦240,000 / month"
                className={inputStyle}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-300 block mb-1">Job Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Katsina Central or Remote"
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-300 block mb-1">Job Summary (1-2 sentences) *</label>
            <textarea
              rows={2}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief executive summary of the opening."
              className={`${inputStyle} resize-none`}
            />
          </div>

          <div>
            <label className="font-semibold text-gray-300 block mb-1">Full Detailed Description *</label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comprehensive narrative of the position, working environment, and objectives."
              className={`${inputStyle} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-300 block mb-1">
                Key Responsibilities (One per line)
              </label>
              <textarea
                rows={4}
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="Manage IP telephony&#10;Troubleshoot routing protocols"
                className={`${inputStyle} resize-none`}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-300 block mb-1">
                Candidate Requirements (One per line)
              </label>
              <textarea
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="National Diploma in Computing or Networking&#10;Knowledge of Cisco IOS"
                className={`${inputStyle} resize-none`}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-300 block mb-1">
              Skills Required (Comma separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Routing, Switching, Cisco CCNA, Network Security, Python"
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-300 block mb-1">Contact / Application Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="careers@company.com"
                className={inputStyle}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-300 block mb-1">Application URL (Optional)</label>
              <input
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://company.com/apply"
                className={inputStyle}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-white/20 bg-[#090918] text-orange-500 focus:ring-0"
            />
            <label htmlFor="isPublished" className="text-xs text-gray-300 cursor-pointer">
              Publish immediately on student Job Board
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={orangeButton}>
              {saving ? "Saving Vacancy…" : initialData ? "Save Changes" : "Publish Job Opening"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployerJobSpecsModal({
  job,
  onClose,
}: {
  job: JobPostingItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
              {job.companyName}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">{job.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <i className="fas fa-times text-orange-400" />
            <span>Close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase block">Nature</span>
            <span className="font-bold text-white mt-1 block">{job.natureOfWork}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase block">Duration</span>
            <span className="font-bold text-white mt-1 block">{job.duration}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase block">Vacancies</span>
            <span className="font-bold text-purple-400 mt-1 block">
              {job.vacanciesCount} Open Slots
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase block">Department</span>
            <span className="font-bold text-orange-400 mt-1 block truncate">{job.department}</span>
          </div>
        </div>

        {job.summary && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs sm:text-sm text-gray-200 leading-relaxed">
            {job.summary}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-orange-400">
            Description
          </h4>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-xl border border-white/5">
            {job.description}
          </p>
        </div>

        {job.responsibilities && job.responsibilities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-orange-400">
              Key Responsibilities
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              {job.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fas fa-check text-orange-400 mt-1 text-xs shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.requirements && job.requirements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-purple-400">
              Candidate Requirements
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fas fa-angle-right text-purple-400 mt-1 text-xs shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
