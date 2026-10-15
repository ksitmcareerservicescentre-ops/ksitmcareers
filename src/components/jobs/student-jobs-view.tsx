"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { type JobPostingItem } from "@/actions/jobs";
import {
  type JobRecommendationRow,
  markStudentAppliedAction,
  requestJobParticipationAction,
} from "@/actions/employers";

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
  "ALL",
  "Full-Time",
  "Full-Time (Hybrid)",
  "Full-Time (On-Site)",
  "Full-Time (Remote)",
  "Part-Time",
  "Contract",
  "Internship / SIWES (On-Site)",
  "Internship / SIWES (Remote)",
];

export function StudentJobsView({
  initialJobs,
  initialRecommendations,
  studentName,
  regNumber,
  department,
}: {
  initialJobs: JobPostingItem[];
  initialRecommendations: JobRecommendationRow[];
  studentName: string;
  regNumber: string;
  department: string | null;
}) {
  const [activeTab, setActiveTab] = useState<"RECOMMENDED" | "EXPLORE">(
    initialRecommendations.length > 0 ? "RECOMMENDED" : "EXPLORE",
  );
  const [recommendations, setRecommendations] = useState<JobRecommendationRow[]>(
    initialRecommendations,
  );
  const [jobs] = useState<JobPostingItem[]>(initialJobs);

  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedNature, setSelectedNature] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobPostingItem | null>(null);

  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [isPending, startTransition] = useTransition();

  // Map of job recommendations/requests by jobId
  const recMap = new Map(recommendations.map((r) => [r.jobId, r]));

  // Set of recommended job IDs where student is authorized to apply
  const recommendedJobIds = new Set(
    recommendations
      .filter((r) => r.status === "RECOMMENDED" || r.status === "APPLIED" || r.status === "IN_PROGRESS" || r.status === "COMPLETED")
      .map((r) => r.jobId),
  );

  const filteredJobs = jobs.filter((j) => {
    if (!j.isPublished) return false;
    if (selectedDept !== "ALL" && j.department !== selectedDept) return false;
    if (selectedNature !== "ALL" && j.natureOfWork !== selectedNature) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = j.title.toLowerCase().includes(q);
      const matchComp = j.companyName.toLowerCase().includes(q);
      const matchLoc = j.location?.toLowerCase().includes(q);
      const matchDesc = j.summary?.toLowerCase().includes(q);
      if (!matchTitle && !matchComp && !matchLoc && !matchDesc) return false;
    }
    return true;
  });

  const handleRequestJob = (job: JobPostingItem, note?: string) => {
    setActionMsg("");
    setActionErr("");
    startTransition(async () => {
      const res = await requestJobParticipationAction(job.id, note);
      if (res.success) {
        setActionMsg(`Request to participate in "${job.title}" submitted to Career Services!`);
        const newRec: JobRecommendationRow = {
          id: res.recommendationId || String(Date.now()),
          jobId: job.id,
          jobTitle: job.title,
          companyName: job.companyName,
          natureOfWork: job.natureOfWork,
          duration: job.duration,
          studentId: "self",
          studentName,
          studentRegNumber: regNumber,
          studentDepartment: department,
          studentLevel: "ND/HND",
          studentAvatarUrl: null,
          recommendedByUserId: null,
          recommenderName: "Self Request",
          recommenderDesignation: null,
          recommendationReason: note || "Student requested participation permission.",
          supervisorUserId: null,
          supervisorName: null,
          status: "REQUESTED",
          supervisionNotes: "Pending Career Staff / Admin approval.",
          statusUpdateReason: null,
          startDate: null,
          endDate: null,
          performanceRating: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setRecommendations((prev) => [newRec, ...prev.filter((r) => r.jobId !== job.id)]);
        setTimeout(() => setActionMsg(""), 6000);
      } else {
        setActionErr(res.error || "Failed to submit request.");
      }
    });
  };

  const handleMarkApplied = (recId: string) => {
    setActionMsg("");
    setActionErr("");
    startTransition(async () => {
      const res = await markStudentAppliedAction(recId);
      if (res.success) {
        setActionMsg("Application status recorded! Your supervisor has been notified.");
        setRecommendations((prev) =>
          prev.map((r) => (r.id === recId ? { ...r, status: "APPLIED" } : r)),
        );
        setTimeout(() => setActionMsg(""), 4000);
      } else {
        setActionErr(res.error || "Failed to update status.");
      }
    });
  };

  const activeSupervisedCount = recommendations.filter(
    (r) => r.status === "IN_PROGRESS",
  ).length;

  return (
    <div className="space-y-8">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <i className="fas fa-arrow-left text-[11px]" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              Employment Opportunities
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Job Board & Placements
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-3xl">
            Explore vetted career vacancies, industry placements, and jobs
            recommended specifically to you by KSITM Career Advisors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#101023] px-4 py-2 text-right">
            <div className="text-[11px] font-bold text-white truncate max-w-[200px]">
              {studentName}
            </div>
            <div className="text-[10px] font-mono text-purple-400">
              {regNumber} · {department || "KSITM"}
            </div>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <i className="fas fa-check-circle text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {actionErr && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-center gap-2">
          <i className="fas fa-exclamation-triangle text-red-400" />
          <span>{actionErr}</span>
        </div>
      )}

      {/* Stats Overview */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
          <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
            Recommended For You
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#FF7F24] mt-1">
            {recommendations.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Advisor endorsements</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
          <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
            Active Placements
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
            {activeSupervisedCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">Supervised in-progress</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
          <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
            Total Job Openings
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {jobs.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Published opportunities</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
          <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
            Total Vacancies
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">
            {jobs.reduce((acc, curr) => acc + (curr.vacanciesCount || 1), 0)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Positions across employers</p>
        </div>
      </section>

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/10 gap-3 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("RECOMMENDED")}
          className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "RECOMMENDED"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-star" />
          <span>Recommended for You</span>
          <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-400">
            {recommendations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EXPLORE")}
          className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "EXPLORE"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-briefcase" />
          <span>Explore All Openings</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">
            {filteredJobs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RECOMMENDED FOR YOU */}
      {activeTab === "RECOMMENDED" && (
        <section className="space-y-6">
          {recommendations.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#101023] p-10 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <i className="fas fa-user-tie text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  No Job Recommendations Yet
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto mt-1 leading-relaxed">
                  Your Career Advisors regularly review student academic dossiers, assessment outcomes, and internship portfolios to recommend matched positions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("EXPLORE")}
                className={orangeButton}
              >
                <i className="fas fa-search" />
                <span>Browse All Available Vacancies</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {recommendations.map((rec) => {
                const matchedJob = jobs.find((j) => j.id === rec.jobId);
                const statusColor =
                  rec.status === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : rec.status === "IN_PROGRESS"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      : rec.status === "APPLIED"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : rec.status === "TERMINATED"
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : "bg-purple-500/20 text-purple-300 border-purple-500/40";

                return (
                  <article
                    key={rec.id}
                    className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#101023] via-[#0d0d1e] to-[#40297B]/20 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden"
                  >
                    {/* Header: Company, Nature, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
                            {rec.companyName}
                          </span>
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            Vetted Partner
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                          {rec.jobTitle}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-400">
                          <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-gray-300">
                            <i className="fas fa-briefcase mr-1.5 text-orange-400" />
                            {rec.natureOfWork}
                          </span>
                          <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-gray-300">
                            <i className="fas fa-clock mr-1.5 text-purple-400" />
                            {rec.duration}
                          </span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${statusColor}`}
                        >
                          <i className="fas fa-circle text-[8px]" />
                          <span>Status: {rec.status.replace("_", " ")}</span>
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Rationale Callout (The "Why he is making the recommendation") */}
                    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-orange-400">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-quote-left text-sm text-orange-400" />
                          <span>Advisory Recommendation Rationale</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-normal">
                          Recommended by <strong className="text-white">{rec.recommenderName}</strong>
                          {rec.recommenderDesignation ? ` (${rec.recommenderDesignation})` : ""}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans italic">
                        &ldquo;{rec.recommendationReason}&rdquo;
                      </p>
                    </div>

                    {/* Supervision Matrix & Observation Notes */}
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-user-shield text-purple-400" />
                          <span className="text-gray-400">Supervising Career Officer:</span>
                          <span className="font-bold text-white">
                            {rec.supervisorName || rec.recommenderName}
                          </span>
                        </div>
                        {rec.startDate && (
                          <div className="text-[11px] text-gray-400">
                            Placement Start Date:{" "}
                            <span className="text-white font-mono">
                              {new Date(rec.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {rec.supervisionNotes && (
                        <div className="text-xs text-gray-300 border-t border-white/5 pt-3 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider font-bold block">
                            Supervision Log & Directives:
                          </span>
                          <p className="whitespace-pre-line text-[11px] leading-relaxed text-gray-300 font-mono">
                            {rec.supervisionNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        {matchedJob && (
                          <button
                            type="button"
                            onClick={() => setSelectedJob(matchedJob)}
                            className={secondaryButton}
                          >
                            <i className="fas fa-eye text-orange-400" />
                            <span>View Full Job Specifications</span>
                          </button>
                        )}

                        {rec.status === "RECOMMENDED" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleMarkApplied(rec.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <i className="fas fa-check" />
                            <span>Mark as Applied</span>
                          </button>
                        )}
                      </div>

                      {matchedJob && (matchedJob.applicationUrl || matchedJob.contactEmail) && (
                        <div className="flex items-center gap-2">
                          {matchedJob.applicationUrl && (
                            <a
                              href={matchedJob.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={orangeButton}
                            >
                              <i className="fas fa-external-link-alt" />
                              <span>Apply on Company Portal</span>
                            </a>
                          )}
                          {!matchedJob.applicationUrl && matchedJob.contactEmail && (
                            <a
                              href={`mailto:${matchedJob.contactEmail}?subject=Application%20for%20${encodeURIComponent(matchedJob.title)}`}
                              className={orangeButton}
                            >
                              <i className="fas fa-envelope" />
                              <span>Email Application</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: EXPLORE ALL JOB OPENINGS */}
      {activeTab === "EXPLORE" && (
        <section className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#101023] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-1.5">
                Search Openings
              </label>
              <input
                type="text"
                placeholder="Search by title, company, location…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-1.5">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
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
              <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-1.5">
                Nature of Work
              </label>
              <select
                value={selectedNature}
                onChange={(e) => setSelectedNature(e.target.value)}
                className={inputStyle}
              >
                {WORK_NATURES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Postings Grid */}
          {filteredJobs.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#101023] p-12 text-center text-xs text-gray-400 space-y-2">
              <i className="fas fa-search text-3xl text-gray-600 block mb-2" />
              <p className="text-sm font-bold text-white">No Matching Vacancies</p>
              <p>Adjust your search criteria or filters to explore more opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => {
                const isRecommended = recommendedJobIds.has(job.id);

                return (
                  <article
                    key={job.id}
                    className={`rounded-2xl border p-6 flex flex-col justify-between transition-all hover:scale-[1.01] ${
                      isRecommended
                        ? "border-orange-500/50 bg-[#131026] shadow-lg shadow-orange-500/10"
                        : "border-white/10 bg-[#101023] hover:border-white/20"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Employer & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-orange-400 block truncate">
                            {job.companyName}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-0.5 line-clamp-1">
                            {job.title}
                          </h3>
                        </div>
                        {isRecommended && (
                          <span className="shrink-0 rounded-full bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[10px] font-bold text-orange-400 flex items-center gap-1">
                            <i className="fas fa-star text-[9px]" />
                            <span>Recommended</span>
                          </span>
                        )}
                      </div>

                      {/* Specs */}
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

                      {job.summary && (
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                          {job.summary}
                        </p>
                      )}

                      {job.skills && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {job.skills
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((skill, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-400"
                              >
                                {skill}
                              </span>
                            ))}
                          {job.skills.split(",").map((s) => s.trim()).filter(Boolean).length > 3 && (
                            <span className="text-[10px] text-gray-500 self-center">
                              +{job.skills.split(",").map((s) => s.trim()).filter(Boolean).length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedJob(job)}
                        className={secondaryButton}
                      >
                        <i className="fas fa-info-circle text-orange-400" />
                        <span>View Specs</span>
                      </button>

                      {(() => {
                        const rec = recMap.get(job.id);
                        const isAuthorized =
                          rec &&
                          (rec.status === "RECOMMENDED" ||
                            rec.status === "APPLIED" ||
                            rec.status === "IN_PROGRESS" ||
                            rec.status === "COMPLETED");

                        if (isAuthorized) {
                          if (job.applicationUrl) {
                            return (
                              <a
                                href={job.applicationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={orangeButton}
                              >
                                <span>Apply</span>
                                <i className="fas fa-arrow-right text-[10px]" />
                              </a>
                            );
                          }
                          if (job.contactEmail) {
                            return (
                              <a
                                href={`mailto:${job.contactEmail}?subject=Application%20for%20${encodeURIComponent(job.title)}`}
                                className={orangeButton}
                              >
                                <span>Email</span>
                                <i className="fas fa-envelope text-[10px]" />
                              </a>
                            );
                          }
                          return null;
                        }

                        if (rec?.status === "REQUESTED") {
                          return (
                            <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <i className="fas fa-hourglass-half" />
                              <span>Under Review</span>
                            </span>
                          );
                        }

                        if (rec?.status === "REJECTED") {
                          return (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleRequestJob(job)}
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <i className="fas fa-redo" />
                              <span>Request Again</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleRequestJob(job)}
                            className={orangeButton}
                          >
                            <i className="fas fa-hand-paper" />
                            <span>Request to Participate</span>
                          </button>
                        );
                      })()}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Full Job Specifications Modal */}
      {selectedJob && (
        <StudentJobDetailsModal
          job={selectedJob}
          isRecommended={recommendedJobIds.has(selectedJob.id)}
          recommendation={recMap.get(selectedJob.id)}
          onRequest={() => {
            const j = selectedJob;
            setSelectedJob(null);
            handleRequestJob(j);
          }}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}

function StudentJobDetailsModal({
  job,
  isRecommended,
  recommendation,
  onRequest,
  onClose,
}: {
  job: JobPostingItem;
  isRecommended: boolean;
  recommendation?: JobRecommendationRow;
  onRequest: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
                {job.companyName}
              </span>
              {isRecommended && (
                <span className="rounded-full bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[9px] font-bold text-orange-400">
                  Recommended For You
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {job.title}
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

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase block">Nature of Work</span>
            <span className="font-bold text-white mt-1 block">{job.natureOfWork}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase block">Duration</span>
            <span className="font-bold text-white mt-1 block">{job.duration}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase block">Vacancies</span>
            <span className="font-bold text-purple-400 mt-1 block">
              {job.vacanciesCount} Open {job.vacanciesCount === 1 ? "Slot" : "Slots"}
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase block">Department</span>
            <span className="font-bold text-orange-400 mt-1 block truncate">{job.department}</span>
          </div>
        </div>

        {/* Salary & Location */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {job.salaryRange && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300 font-semibold flex items-center gap-2">
              <i className="fas fa-money-bill-wave" />
              <span>Remuneration: {job.salaryRange}</span>
            </div>
          )}
          {job.location && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-gray-300 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-orange-400" />
              <span>Location: {job.location}</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {job.summary && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs sm:text-sm text-gray-200 leading-relaxed">
            {job.summary}
          </div>
        )}

        {/* Full Detailed Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-orange-400">
            Full Position Description
          </h4>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-xl border border-white/5">
            {job.description}
          </p>
        </div>

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-orange-400">
              Key Responsibilities
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              {job.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <i className="fas fa-check text-orange-400 mt-1 text-xs shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-purple-400">
              Candidate Requirements & Qualifications
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <i className="fas fa-angle-right text-purple-400 mt-1 text-xs shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills */}
        {job.skills && (
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-gray-400">
              Target Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-xs font-mono text-orange-300"
                  >
                    {s}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Application CTA Footer */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#40297B]/30 to-[#FF7F24]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-white block">Ready to Apply?</span>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Ensure your KSITM resume and academic portfolio are updated before submitting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(() => {
              const isAuthorized =
                recommendation &&
                (recommendation.status === "RECOMMENDED" ||
                  recommendation.status === "APPLIED" ||
                  recommendation.status === "IN_PROGRESS" ||
                  recommendation.status === "COMPLETED");

              if (isAuthorized) {
                return (
                  <>
                    {job.applicationUrl && (
                      <a
                        href={job.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={orangeButton}
                      >
                        <i className="fas fa-external-link-alt" />
                        <span>Visit Application Portal</span>
                      </a>
                    )}
                    {job.contactEmail && (
                      <a
                        href={`mailto:${job.contactEmail}?subject=Application%20for%20${encodeURIComponent(job.title)}`}
                        className={secondaryButton}
                      >
                        <i className="fas fa-envelope" />
                        <span>Contact Recruiter</span>
                      </a>
                    )}
                  </>
                );
              }

              if (recommendation?.status === "REQUESTED") {
                return (
                  <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <i className="fas fa-hourglass-half" />
                    <span>Participation Request Under Review</span>
                  </span>
                );
              }

              if (recommendation?.status === "REJECTED") {
                return (
                  <button
                    type="button"
                    onClick={onRequest}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fas fa-redo" />
                    <span>Request Again</span>
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  onClick={onRequest}
                  className={orangeButton}
                >
                  <i className="fas fa-hand-paper" />
                  <span>Request to Participate</span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
