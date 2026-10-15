/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  enrollVirtualInternshipAction,
  requestInternshipParticipationAction,
  submitInternshipOutcomeAction,
  type VirtualInternshipItem,
  type EnrollmentTableRow,
  type StudentPortfolioData,
} from "@/actions/internships";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

type OutcomeTypeOption = "TEXT" | "URL" | "FILE" | "VIDEO" | "HYBRID";

export function StudentInternshipsView({
  initialCatalog,
  initialEnrollments,
  initialPortfolio,
  studentName,
  regNumber,
  department,
}: {
  initialCatalog: VirtualInternshipItem[];
  initialEnrollments: EnrollmentTableRow[];
  initialPortfolio: StudentPortfolioData;
  studentName: string;
  regNumber: string;
  department: string | null;
}) {
  const [activeTab, setActiveTab] = useState<"MY_INTERNSHIPS" | "CATALOG" | "PORTFOLIO">("MY_INTERNSHIPS");
  const [catalog] = useState<VirtualInternshipItem[]>(initialCatalog);
  const [enrollments, setEnrollments] = useState<EnrollmentTableRow[]>(initialEnrollments);
  const [portfolio, setPortfolio] = useState<StudentPortfolioData>(initialPortfolio);

  // Filters for Catalog
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogDept, setCatalogDept] = useState("ALL");
  const [catalogDiff, setCatalogDiff] = useState("ALL");

  // State for Outcome Submission Modal
  const [submittingEnrollment, setSubmittingEnrollment] = useState<EnrollmentTableRow | null>(null);

  // State for View Details Modal
  const [previewInternship, setPreviewInternship] = useState<VirtualInternshipItem | null>(null);

  // Success / Notice banner
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const enrolledMap = new Map<string, EnrollmentTableRow>();
  enrollments.forEach((e) => enrolledMap.set(e.internshipId, e));

  const filteredCatalog = catalog.filter((item) => {
    if (catalogDept !== "ALL" && item.department !== catalogDept) return false;
    if (catalogDiff !== "ALL" && item.difficulty !== catalogDiff) return false;
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.organizationName.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRequestParticipation = (internship: VirtualInternshipItem, note?: string) => {
    startTransition(async () => {
      try {
        const res = await requestInternshipParticipationAction(internship.id, note);
        if (!res.success) throw new Error(res.error);

        const requestedEnrollment: EnrollmentTableRow = {
          id: res.enrollmentId || String(Date.now()),
          internshipId: internship.id,
          internshipTitle: internship.title,
          organizationName: internship.organizationName,
          internshipDepartment: internship.department,
          internshipDifficulty: internship.difficulty,
          internshipDuration: internship.duration,
          internshipBannerUrl: internship.bannerUrl,
          studentId: "self",
          studentName,
          studentRegNumber: regNumber,
          studentDepartment: department,
          studentLevel: "ND/HND",
          studentAvatarUrl: null,
          status: "REQUESTED",
          assignedByStaffName: null,
          assignmentNote: note || "Student requested participation",
          enrolledAt: new Date(),
          startedAt: null,
          submittedAt: null,
          reviewedAt: null,
          reviewedByStaffName: null,
          staffFeedback: null,
          gradeScore: null,
          outcomeType: null,
          outcomeTitle: null,
          outcomeText: null,
          outcomeUrl: null,
          outcomeFileUrl: null,
          outcomeFileName: null,
          outcomeMetadata: null,
        };

        setEnrollments((prev) => [
          requestedEnrollment,
          ...prev.filter((e) => e.internshipId !== internship.id),
        ]);

        setNotice(
          `Request to participate in "${internship.title}" submitted! Your assigned Career Staff or Super Admin will review and approve it.`,
        );
        setTimeout(() => setNotice(null), 6000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to submit participation request.");
      }
    });
  };

  const handleEnroll = (internship: VirtualInternshipItem) => {
    startTransition(async () => {
      try {
        const res = await enrollVirtualInternshipAction(internship.id);
        if (!res.success) throw new Error(res.error);

        setEnrollments((prev) =>
          prev.map((e) =>
            e.internshipId === internship.id
              ? { ...e, status: "IN_PROGRESS", startedAt: new Date() }
              : e,
          ),
        );

        setNotice(`Successfully started "${internship.title}"! You can now complete the project deliverables.`);
        setActiveTab("MY_INTERNSHIPS");
        setTimeout(() => setNotice(null), 5000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to start internship.");
      }
    });
  };

  const handleOutcomeSubmitted = (updatedEnrollment: EnrollmentTableRow) => {
    setEnrollments((prev) =>
      prev.map((e) => (e.id === updatedEnrollment.id ? updatedEnrollment : e)),
    );
    setPortfolio((prev) => {
      const updatedList = prev.enrollments.map((e) =>
        e.id === updatedEnrollment.id ? updatedEnrollment : e,
      );
      return {
        ...prev,
        totalSubmitted: updatedList.filter((e) => e.status === "SUBMITTED").length,
        enrollments: updatedList,
      };
    });
    setSubmittingEnrollment(null);
    setNotice("Internship outcome submitted successfully! Your career advisor will review and grade your work.");
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-laptop-code" />
            <span>Simulated Work Experience</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            Virtual Internships Hub
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-2xl">
            Complete industry-standard tasks curated by leading organizations (Google Cloud, Microsoft, Paystack, and Katsina Tech Hub), submit your polymorphic project outcomes, and earn certified evaluations.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:border-orange-500/40 hover:bg-white/10 hover:text-white transition-all self-start sm:self-auto"
        >
          <i className="fas fa-arrow-left text-orange-400" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Global Notification Banner */}
      {notice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-300 shadow-lg">
          <i className="fas fa-check-circle text-emerald-400 text-base shrink-0" />
          <span className="flex-1 font-medium">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-emerald-400 hover:text-white"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            My Enrolled Programs
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {portfolio.totalEnrolled}
          </div>
          <p className="mt-1 text-xs text-gray-500">Active or completed tracks</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Approved & Verified
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {portfolio.totalApproved}
          </div>
          <p className="mt-1 text-xs text-gray-500">Evaluated by career staff</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Pending Review
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400">
            {portfolio.totalSubmitted}
          </div>
          <p className="mt-1 text-xs text-gray-500">Under staff evaluation</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Average Score
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-purple-400">
            {portfolio.averageScore !== null ? `${portfolio.averageScore}%` : "—"}
          </div>
          <p className="mt-1 text-xs text-gray-500">Performance benchmark</p>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-white/10 gap-2 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("MY_INTERNSHIPS")}
          className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "MY_INTERNSHIPS"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-tasks" />
          <span>My Active Internships</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">
            {enrollments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CATALOG")}
          className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "CATALOG"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-compass" />
          <span>Explore Catalog & Take</span>
          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400">
            {catalog.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PORTFOLIO")}
          className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "PORTFOLIO"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-award" />
          <span>Cumulative Portfolio & Outcomes</span>
        </button>
      </div>

      {/* TAB 1: MY ACTIVE INTERNSHIPS */}
      {activeTab === "MY_INTERNSHIPS" && (
        <div className="space-y-6">
          {enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#101023] p-12 text-center">
              <i className="fas fa-laptop-code text-4xl text-gray-600 mb-3" />
              <h3 className="text-base font-bold text-white">No Enrolled Internships Yet</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                You haven&apos;t enrolled in any virtual internships or had any assigned to you yet. Explore the institution catalog and take your first industry simulation!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("CATALOG")}
                className={`${orangeButton} mt-5`}
              >
                <i className="fas fa-compass" />
                <span>Browse Available Programs</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {enrollments.map((item) => {
                const isAssigned = item.status === "ASSIGNED";
                const isInProgress = item.status === "IN_PROGRESS";
                const isSubmitted = item.status === "SUBMITTED";
                const isApproved = item.status === "APPROVED";
                const isRevision = item.status === "REVISION_REQUESTED";

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#101023] shadow-xl transition-all hover:border-orange-500/40"
                  >
                    <div>
                      {/* Banner */}
                      {item.internshipBannerUrl ? (
                        <div className="relative h-36 w-full overflow-hidden bg-black/40">
                          <img
                            src={item.internshipBannerUrl}
                            alt={item.internshipTitle}
                            className="h-full w-full object-cover opacity-85"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#101023] via-transparent to-transparent" />
                          <div className="absolute top-3 right-3">
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
                          <span className="font-bold text-xs uppercase tracking-wider text-orange-400">
                            {item.organizationName}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                      )}

                      <div className="p-5 space-y-4">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                            {item.organizationName}
                          </div>
                          <h3 className="text-lg font-extrabold text-white mt-0.5">
                            {item.internshipTitle}
                          </h3>
                        </div>

                        {/* Badges strip */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {item.internshipDepartment && (
                            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                              <i className="fas fa-layer-group text-orange-400 mr-1" />
                              {item.internshipDepartment}
                            </span>
                          )}
                          {item.internshipDuration && (
                            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                              <i className="fas fa-clock text-cyan-400 mr-1" />
                              {item.internshipDuration}
                            </span>
                          )}
                          {item.internshipDifficulty && (
                            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                              <i className="fas fa-signal text-purple-400 mr-1" />
                              {item.internshipDifficulty}
                            </span>
                          )}
                        </div>

                        {/* Staff Assignment Note */}
                        {item.assignmentNote && (
                          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-300">
                            <div className="font-bold flex items-center gap-1.5 mb-1">
                              <i className="fas fa-user-tie" />
                              <span>Career Advisor Guidance:</span>
                            </div>
                            <p className="text-gray-300">{item.assignmentNote}</p>
                          </div>
                        )}

                        {/* Attached Outcome Preview if Submitted / Approved / Revision */}
                        {item.outcomeType && (
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-gray-300 flex items-center gap-1.5">
                                <i className="fas fa-paperclip text-orange-400" />
                                <span>Attached Outcome:</span>
                              </span>
                              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                                {item.outcomeType}
                              </span>
                            </div>
                            {item.outcomeTitle && (
                              <div className="text-xs font-bold text-white">
                                {item.outcomeTitle}
                              </div>
                            )}
                            {item.outcomeText && (
                              <p className="text-xs text-gray-400 line-clamp-2">
                                {item.outcomeText}
                              </p>
                            )}
                            {item.outcomeUrl && (
                              <a
                                href={item.outcomeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-2 break-all"
                              >
                                <i className="fas fa-external-link-alt text-[10px]" />
                                <span>{item.outcomeUrl}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Staff Review Feedback & Score if Approved or Revision */}
                        {(isApproved || isRevision) && (
                          <div
                            className={`rounded-xl border p-3.5 space-y-2 text-xs ${
                              isApproved
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1.5">
                                <i className={isApproved ? "fas fa-check-circle text-emerald-400" : "fas fa-exclamation-triangle text-amber-400"} />
                                <span>{isApproved ? "Staff Evaluation Result" : "Revision Instructions"}</span>
                              </span>
                              {item.gradeScore !== null && (
                                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold font-mono">
                                  Score: {item.gradeScore}/100
                                </span>
                              )}
                            </div>
                            {item.staffFeedback && (
                              <p className="text-gray-300">{item.staffFeedback}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="border-t border-white/10 p-4 bg-white/[0.01] flex items-center justify-between gap-3">
                      <div className="text-[11px] text-gray-500">
                        {isSubmitted ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <i className="fas fa-hourglass-half" /> Under Review
                          </span>
                        ) : isApproved ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <i className="fas fa-badge-check" /> Completed
                          </span>
                        ) : (
                          <span>Due upon deliverable completion</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Attach Outcome Button */}
                        {(isAssigned || isInProgress || isRevision) && (
                          <button
                            type="button"
                            onClick={() => setSubmittingEnrollment(item)}
                            className={orangeButton}
                          >
                            <i className="fas fa-paperclip" />
                            <span>{item.outcomeType ? "Edit Outcome" : "Attach Outcome"}</span>
                          </button>
                        )}

                        {isSubmitted && (
                          <button
                            type="button"
                            onClick={() => setSubmittingEnrollment(item)}
                            className={secondaryButton}
                          >
                            <i className="fas fa-edit" />
                            <span>Update Submission</span>
                          </button>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("PORTFOLIO")}
                            className={secondaryButton}
                          >
                            <i className="fas fa-certificate text-emerald-400" />
                            <span>View in Portfolio</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPLORE CATALOG & TAKE INTERNSHIPS */}
      {activeTab === "CATALOG" && (
        <div className="space-y-6">
          {/* Catalog Filter Controls */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101023] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3.5 top-3 text-xs text-gray-500" />
              <input
                type="text"
                placeholder="Search simulations by role, company, skills..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className={`${inputStyle} pl-9`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={catalogDept}
                onChange={(e) => setCatalogDept(e.target.value)}
                className="rounded-xl border border-white/15 bg-[#090918] px-3 py-2 text-xs text-white focus:border-orange-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Computer Software Engineering">Computer Software Engineering</option>
                <option value="Networking & System Security">Networking & System Security</option>
                <option value="Banking Operations & FinTech">Banking Operations & FinTech</option>
                <option value="Mass Communication">Mass Communication</option>
                <option value="Business Administration">Business Administration</option>
              </select>

              <select
                value={catalogDiff}
                onChange={(e) => setCatalogDiff(e.target.value)}
                className="rounded-xl border border-white/15 bg-[#090918] px-3 py-2 text-xs text-white focus:border-orange-500"
              >
                <option value="ALL">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCatalog.map((item) => {
              const enrollment = enrolledMap.get(item.id);
              const isEnrolled = Boolean(enrollment);

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#101023] shadow-lg transition-all hover:border-orange-500/40"
                >
                  <div>
                    {item.bannerUrl ? (
                      <div className="relative h-36 w-full overflow-hidden bg-black/40">
                        <img
                          src={item.bannerUrl}
                          alt={item.title}
                          className="h-full w-full object-cover opacity-85"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#101023] via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="h-12 border-b border-white/10 bg-white/[0.02]" />
                    )}

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                          {item.organizationName}
                        </span>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gray-300">
                          {item.difficulty}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-gray-400 line-clamp-3">
                        {item.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                          <i className="fas fa-layer-group text-orange-400 mr-1" />
                          {item.department}
                        </span>
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                          <i className="fas fa-clock text-cyan-400 mr-1" />
                          {item.duration}
                        </span>
                      </div>

                      {/* Deliverables snippet */}
                      {item.tasksDeliverables && item.tasksDeliverables.length > 0 && (
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs space-y-1">
                          <div className="font-semibold text-gray-300 text-[11px] flex items-center gap-1.5">
                            <i className="fas fa-clipboard-list text-orange-400" />
                            <span>Tasks ({item.tasksDeliverables.length}):</span>
                          </div>
                          <p className="text-gray-400 truncate">
                            • {item.tasksDeliverables[0].title}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Actions */}
                    <div className="border-t border-white/10 p-4 bg-white/[0.01] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewInternship(item)}
                        className="text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <i className="fas fa-info-circle mr-1" /> Details
                      </button>

                      {enrollment?.status === "REQUESTED" ? (
                        <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <i className="fas fa-hourglass-half" />
                          <span>Request Pending</span>
                        </span>
                      ) : enrollment?.status === "REJECTED" ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleRequestParticipation(item)}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className="fas fa-redo" />
                          <span>Request Again</span>
                        </button>
                      ) : enrollment?.status === "ASSIGNED" ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleEnroll(item)}
                          className={orangeButton}
                        >
                          <i className="fas fa-play" />
                          <span>Start Deliverables</span>
                        </button>
                      ) : enrollment ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab("MY_INTERNSHIPS")}
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className="fas fa-check" />
                          <span>Active Project</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleRequestParticipation(item)}
                          className={orangeButton}
                        >
                          <i className="fas fa-hand-paper" />
                          <span>Request to Take Part</span>
                        </button>
                      )}
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CUMULATIVE PORTFOLIO & OUTCOMES */}
      {activeTab === "PORTFOLIO" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#101023] p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 border-2 border-orange-500/40 text-orange-400 font-extrabold text-xl">
                  {studentName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">{studentName}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1 font-mono">
                    <span>Reg: {regNumber}</span>
                    <span>•</span>
                    <span>Dept: {department || "General"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  <i className="fas fa-shield-alt mr-1.5" /> Certified Portfolio Dossier
                </span>
              </div>
            </div>

            {/* List of completed/submitted outcomes */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                Submitted Artifacts & Cumulative Evaluations
              </h3>

              {portfolio.enrollments.filter((e) => e.outcomeType).length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-xs text-gray-500">
                  No deliverables submitted yet. Complete an active internship task to build your verified portfolio dossier.
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio.enrollments
                    .filter((e) => e.outcomeType)
                    .map((e) => (
                      <div
                        key={e.id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3 hover:border-orange-500/30 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                              {e.organizationName}
                            </span>
                            <h4 className="text-base font-bold text-white">
                              {e.internshipTitle}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 uppercase">
                              {e.outcomeType}
                            </span>
                            <StatusBadge status={e.status} />
                          </div>
                        </div>

                        {/* Title and summary */}
                        <div>
                          <div className="text-xs font-bold text-gray-200">
                            {e.outcomeTitle || "Submitted Project Outcome"}
                          </div>
                          {e.outcomeText && (
                            <p className="mt-1 text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">
                              {e.outcomeText}
                            </p>
                          )}
                        </div>

                        {/* Clickable links and file deliverables */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {e.outcomeUrl && (
                            <a
                              href={e.outcomeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-black transition-all"
                            >
                              <i className="fas fa-external-link-alt" />
                              <span>View Submission Artifact</span>
                            </a>
                          )}
                          {e.outcomeFileUrl && (
                            <a
                              href={e.outcomeFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500 hover:text-white transition-all"
                            >
                              <i className="fas fa-file-download" />
                              <span>{e.outcomeFileName || "Download File"}</span>
                            </a>
                          )}
                        </div>

                        {/* Staff Grade & Verification */}
                        {e.status === "APPROVED" && (
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <i className="fas fa-award text-emerald-400" />
                                <span>Verified by Career Staff:</span>
                              </div>
                              <p className="text-gray-300 mt-0.5">{e.staffFeedback || "Deliverables meet KSITM industry standards."}</p>
                            </div>
                            {e.gradeScore !== null && (
                              <div className="text-right shrink-0">
                                <span className="font-mono text-base font-extrabold text-emerald-300">
                                  {e.gradeScore}/100
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OUTCOME ATTACHMENT MODAL */}
      {submittingEnrollment && (
        <OutcomeAttachmentModal
          enrollment={submittingEnrollment}
          onClose={() => setSubmittingEnrollment(null)}
          onSuccess={handleOutcomeSubmitted}
        />
      )}

      {/* INTERNSHIP DETAILS MODAL */}
      {previewInternship && (
        <InternshipDetailsModal
          internship={previewInternship}
          enrollment={enrolledMap.get(previewInternship.id)}
          onClose={() => setPreviewInternship(null)}
          onEnroll={() => {
            setPreviewInternship(null);
            handleEnroll(previewInternship);
          }}
          onRequest={() => {
            setPreviewInternship(null);
            handleRequestParticipation(previewInternship);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: EnrollmentTableRow["status"] }) {
  switch (status) {
    case "REQUESTED":
      return (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
          Request Pending
        </span>
      );
    case "REJECTED":
      return (
        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
          Declined
        </span>
      );
    case "APPROVED":
      return (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
          Approved
        </span>
      );
    case "SUBMITTED":
      return (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
          Submitted
        </span>
      );
    case "REVISION_REQUESTED":
      return (
        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
          Revision
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
          In Progress
        </span>
      );
    case "ASSIGNED":
    default:
      return (
        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
          Assigned
        </span>
      );
  }
}

/**
 * Outcome Attachment Modal (Polymorphic: Text, URL, File, Video, Hybrid)
 */
function OutcomeAttachmentModal({
  enrollment,
  onClose,
  onSuccess,
}: {
  enrollment: EnrollmentTableRow;
  onClose: () => void;
  onSuccess: (updated: EnrollmentTableRow) => void;
}) {
  const [outcomeType, setOutcomeType] = useState<OutcomeTypeOption>(
    (enrollment.outcomeType as OutcomeTypeOption) || "URL",
  );
  const [title, setTitle] = useState(enrollment.outcomeTitle || "");
  const [text, setText] = useState(enrollment.outcomeText || "");
  const [url, setUrl] = useState(enrollment.outcomeUrl || "");
  const [fileUrl, setFileUrl] = useState(enrollment.outcomeFileUrl || "");
  const [fileName, setFileName] = useState(enrollment.outcomeFileName || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please provide an outcome title or deliverable summary.");
      return;
    }

    if (outcomeType === "URL" && !url.trim()) {
      setError("Please specify the project or repository URL.");
      return;
    }

    if (outcomeType === "VIDEO" && !url.trim()) {
      setError("Please specify the video presentation URL (e.g. YouTube, Loom, Google Drive).");
      return;
    }

    startTransition(async () => {
      try {
        const res = await submitInternshipOutcomeAction(enrollment.id, {
          outcomeType,
          outcomeTitle: title.trim(),
          outcomeText: text.trim() || undefined,
          outcomeUrl: url.trim() || undefined,
          outcomeFileUrl: fileUrl.trim() || undefined,
          outcomeFileName: fileName.trim() || undefined,
        });

        if (!res.success) throw new Error(res.error);

        onSuccess({
          ...enrollment,
          status: "SUBMITTED",
          submittedAt: new Date(),
          outcomeType,
          outcomeTitle: title.trim(),
          outcomeText: text.trim() || null,
          outcomeUrl: url.trim() || null,
          outcomeFileUrl: fileUrl.trim() || null,
          outcomeFileName: fileName.trim() || null,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to submit outcome.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              {enrollment.organizationName}
            </span>
            <h3 className="text-lg font-bold text-white">
              Attach Outcome — {enrollment.internshipTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Outcome Type Switcher */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">
              Deliverable Outcome Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: "URL", icon: "fa-link", label: "Project URL" },
                  { id: "TEXT", icon: "fa-align-left", label: "Text / Memo" },
                  { id: "VIDEO", icon: "fa-video", label: "Video Pitch" },
                  { id: "FILE", icon: "fa-file-alt", label: "File / Doc" },
                  { id: "HYBRID", icon: "fa-layer-group", label: "Hybrid" },
                ] as const
              ).map((type) => {
                const active = outcomeType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setOutcomeType(type.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-center text-[11px] font-bold transition-all border cursor-pointer ${
                      active
                        ? "border-orange-500 bg-orange-500/15 text-orange-400 shadow-md"
                        : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <i className={`fas ${type.icon} text-sm`} />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outcome Title */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Deliverable Title / Summary *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CI/CD Cloud Pipeline Implementation with Kubernetes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* URL Input (For URL, VIDEO, HYBRID, FILE) */}
          {(outcomeType === "URL" ||
            outcomeType === "VIDEO" ||
            outcomeType === "HYBRID" ||
            outcomeType === "FILE") && (
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                {outcomeType === "VIDEO"
                  ? "Video Presentation URL (YouTube, Loom, Google Drive) *"
                  : outcomeType === "FILE"
                    ? "File / Document Hosting Link (Google Drive, Dropbox, OneDrive) *"
                    : "Primary Project / Repository URL *"}
              </label>
              <input
                type="url"
                placeholder="https://github.com/ksitm/project or https://loom.com/share/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputStyle}
              />
            </div>
          )}

          {/* File Name & Direct File URL (Optional for Files / Hybrids) */}
          {(outcomeType === "FILE" || outcomeType === "HYBRID") && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  File Title / Reference Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. final-audit-report.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Direct Download URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://files.com/doc.pdf"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Description / Summary / Text Reflection */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Executive Reflection & Deliverable Notes
            </label>
            <textarea
              rows={4}
              placeholder="Explain how you completed the tasks, what technologies or methodologies were applied, and any challenges resolved..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className={secondaryButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={orangeButton}
            >
              <i className="fas fa-paper-plane" />
              <span>{isPending ? "Submitting..." : "Submit Deliverable Outcome"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Internship Details Modal
 */
function InternshipDetailsModal({
  internship,
  enrollment,
  onClose,
  onEnroll,
  onRequest,
}: {
  internship: VirtualInternshipItem;
  enrollment?: EnrollmentTableRow | null;
  onClose: () => void;
  onEnroll: () => void;
  onRequest: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              {internship.organizationName}
            </span>
            <h3 className="text-xl font-bold text-white">
              {internship.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {internship.bannerUrl && (
          <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-black/40">
            <img
              src={internship.bannerUrl}
              alt={internship.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-semibold text-gray-300">
            <i className="fas fa-layer-group text-orange-400 mr-1.5" />
            {internship.department}
          </span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-semibold text-gray-300">
            <i className="fas fa-clock text-cyan-400 mr-1.5" />
            {internship.duration}
          </span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-semibold text-gray-300">
            <i className="fas fa-signal text-purple-400 mr-1.5" />
            Level: {internship.difficulty}
          </span>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Overview
          </h4>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {internship.description || internship.summary}
          </p>
        </div>

        {internship.learningObjectives && internship.learningObjectives.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Key Learning Objectives
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              {internship.learningObjectives.map((obj: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-emerald-400 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {internship.tasksDeliverables && internship.tasksDeliverables.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Deliverable Tasks & Milestones
            </h4>
            <div className="space-y-2">
              {internship.tasksDeliverables.map((task, i: number) => (
                <div
                  key={task.id || i}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-300 flex items-start gap-3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-bold text-white">{task.title}</div>
                    {task.description && (
                      <p className="text-gray-400 text-[11px] mt-0.5">{task.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className={secondaryButton}
          >
            Close
          </button>
          {enrollment?.status === "ASSIGNED" ? (
            <button
              type="button"
              onClick={onEnroll}
              className={orangeButton}
            >
              <i className="fas fa-play" />
              <span>Start Deliverables</span>
            </button>
          ) : enrollment?.status === "REQUESTED" ? (
            <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <i className="fas fa-hourglass-half" />
              <span>Request Pending Review</span>
            </span>
          ) : enrollment?.status === "REJECTED" ? (
            <button
              type="button"
              onClick={onRequest}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-redo" />
              <span>Request Again</span>
            </button>
          ) : !enrollment ? (
            <button
              type="button"
              onClick={onRequest}
              className={orangeButton}
            >
              <i className="fas fa-hand-paper" />
              <span>Request to Take Part</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
