/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  listJobRecommendationsAction,
  updateRecommendationReasonAction,
  updateJobSupervisionStatusAction,
  recommendJobToStudentAction,
  listPartnerEmployersAction,
  onboardPartnerEmployerAction,
  updatePartnerEmployerAction,
  deletePartnerEmployerAction,
  createOrResetEmployerLoginAction,
  updateEmployerTrustStatusAction,
  seedStandardEmployersAction,
  type JobRecommendationRow,
  type PartnerEmployerItem,
  type OnboardEmployerInput,
} from "@/actions/employers";
import { listJobPostingsAction, type JobPostingItem } from "@/actions/jobs";
import { listStudentsAction, type StudentTableRow } from "@/actions/students";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "RECOMMENDED", label: "Recommended" },
  { value: "APPLIED", label: "Applied" },
  { value: "IN_PROGRESS", label: "In-Progress (Supervised Placement)" },
  { value: "COMPLETED", label: "Completed (Placement Concluded)" },
  { value: "TERMINATED", label: "Terminated (Early Exit)" },
];

export function EmployerEngagementWorkspace() {
  const [activeTab, setActiveTab] = useState<"MATRIX" | "RECOMMEND" | "EMPLOYERS">("MATRIX");
  const [recommendations, setRecommendations] = useState<JobRecommendationRow[]>([]);
  const [employers, setEmployers] = useState<PartnerEmployerItem[]>([]);
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [students, setStudents] = useState<StudentTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Matrix
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Filters for Employers Directory
  const [employerSearch, setEmployerSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  // Modals state
  const [supervisingRec, setSupervisingRec] = useState<JobRecommendationRow | null>(null);
  const [editingReasonRec, setEditingReasonRec] = useState<JobRecommendationRow | null>(null);
  const [editingEmployer, setEditingEmployer] = useState<PartnerEmployerItem | "NEW" | null>(null);
  const [credentialsTarget, setCredentialsTarget] = useState<PartnerEmployerItem | null>(null);

  // Notice banner
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      listJobRecommendationsAction({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: search.trim() || undefined,
      }),
      listPartnerEmployersAction({
        search: employerSearch.trim() || undefined,
        partnershipTier: tierFilter !== "ALL" ? tierFilter : undefined,
        verificationStatus: verificationFilter !== "ALL" ? verificationFilter : undefined,
      }),
      listJobPostingsAction({ publishedOnly: true }),
      listStudentsAction(),
    ])
      .then(async ([recs, emps, jobList, stList]) => {
        if (emps.length === 0 && !employerSearch && verificationFilter === "ALL" && tierFilter === "ALL") {
          await seedStandardEmployersAction();
          const seededEmps = await listPartnerEmployersAction();
          setEmployers(seededEmps);
        } else {
          setEmployers(emps);
        }
        setRecommendations(recs);
        setJobs(jobList);
        setStudents(stList);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load engagement data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      listJobRecommendationsAction({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: search.trim() || undefined,
      }),
      listPartnerEmployersAction({
        search: employerSearch.trim() || undefined,
        partnershipTier: tierFilter !== "ALL" ? tierFilter : undefined,
        verificationStatus: verificationFilter !== "ALL" ? verificationFilter : undefined,
      }),
      listJobPostingsAction({ publishedOnly: true }),
      listStudentsAction(),
    ])
      .then(async ([recs, emps, jobList, stList]) => {
        if (!active) return;
        if (emps.length === 0 && !employerSearch && verificationFilter === "ALL" && tierFilter === "ALL") {
          await seedStandardEmployersAction();
          const seededEmps = await listPartnerEmployersAction();
          if (active) setEmployers(seededEmps);
        } else {
          setEmployers(emps);
        }
        if (active) {
          setRecommendations(recs);
          setJobs(jobList);
          setStudents(stList);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Failed to load engagement data:", err);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [statusFilter, search, employerSearch, verificationFilter, tierFilter]);

  const inProgressCount = recommendations.filter((r) => r.status === "IN_PROGRESS").length;
  const completedCount = recommendations.filter((r) => r.status === "COMPLETED").length;

  const handleDeleteEmployer = (id: string, name: string) => {
    if (!window.confirm(`Delete partner employer "${name}"?`)) return;
    startTransition(async () => {
      const res = await deletePartnerEmployerAction(id);
      if (res.success) {
        setEmployers((prev) => prev.filter((e) => e.id !== id));
        setNotice(`Employer "${name}" removed.`);
        setTimeout(() => setNotice(null), 3000);
      } else {
        alert(res.error || "Failed to delete employer.");
      }
    });
  };

  const handleQuickStatusChange = (
    id: string,
    name: string,
    newStatus: "PENDING" | "VERIFIED" | "SUSPENDED",
  ) => {
    startTransition(async () => {
      const res = await updateEmployerTrustStatusAction(id, { verificationStatus: newStatus });
      if (res.success) {
        setEmployers((prev) =>
          prev.map((e) => (e.id === id ? { ...e, verificationStatus: newStatus } : e)),
        );
        setNotice(`Verification status for "${name}" set to ${newStatus}.`);
        setTimeout(() => setNotice(null), 3000);
      } else {
        alert(res.error || "Failed to update employer status.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-handshake" />
            <span>Employer Engagement & Student Supervision</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            Employer Engagement & Job Recommendations
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-2xl">
            Recommend students directly to employer job openings, track who recommended who to who, update recommendation rationale, and supervise placements through in-progress, completed, and terminated lifecycles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("RECOMMEND")}
          className={orangeButton}
        >
          <i className="fas fa-user-plus" />
          <span>New Student Recommendation</span>
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-300">
          <i className="fas fa-check-circle text-emerald-400 shrink-0" />
          <span className="flex-1 font-medium">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Total Recommendations
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {recommendations.length}
          </div>
          <p className="mt-1 text-xs text-gray-500">Student endorsements made</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Active In-Progress
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-cyan-400">
            {inProgressCount}
          </div>
          <p className="mt-1 text-xs text-gray-500">Supervised work placements</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Completed Placements
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {completedCount}
          </div>
          <p className="mt-1 text-xs text-gray-500">Successfully concluded</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Corporate Partners
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-orange-400">
            {employers.length}
          </div>
          <p className="mt-1 text-xs text-gray-500">Partner organizations</p>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-white/10 gap-3 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("MATRIX")}
          className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "MATRIX"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-network-wired" />
          <span>Recommendations & Supervision Matrix</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">
            {recommendations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("RECOMMEND")}
          className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "RECOMMEND"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-user-plus" />
          <span>Recommend Student to Job</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EMPLOYERS")}
          className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "EMPLOYERS"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-building" />
          <span>Partner Organizations ({employers.length})</span>
        </button>
      </div>

      {/* TAB 1: RECOMMENDATIONS & SUPERVISION MATRIX */}
      {activeTab === "MATRIX" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101023] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3.5 top-3 text-xs text-gray-500" />
              <input
                type="text"
                placeholder="Search by student, recommending officer, job, or employer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputStyle} pl-9`}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/15 bg-[#090918] px-3 py-2 text-xs text-white focus:border-orange-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          {loading ? (
            <div className="py-20 text-center text-xs text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl text-orange-400 mb-2" />
              <p>Loading engagement matrix...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#101023] p-12 text-center">
              <i className="fas fa-user-friends text-4xl text-gray-600 mb-3" />
              <h3 className="text-base font-bold text-white">No Job Recommendations Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                No recommendations match your current query. Recommend a student to a job opening to initiate supervised employer engagement.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("RECOMMEND")}
                className={`${orangeButton} mt-5`}
              >
                <i className="fas fa-user-plus" />
                <span>Make First Recommendation</span>
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101023] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3.5">Recommending Officer</th>
                      <th className="px-4 py-3.5">Target Student</th>
                      <th className="px-4 py-3.5">Job & Employer</th>
                      <th className="px-4 py-3.5">Recommendation Rationale</th>
                      <th className="px-4 py-3.5">Supervision Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {recommendations.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* WHO RECOMMENDED */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-300 font-bold text-[11px] border border-purple-500/20">
                              <i className="fas fa-user-tie" />
                            </div>
                            <div className="truncate">
                              <div className="text-white font-semibold truncate">{row.recommenderName}</div>
                              <div className="text-[10px] text-gray-500 truncate">
                                {row.recommenderDesignation || "Career Staff"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* WHO WAS RECOMMENDED */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                              {row.studentAvatarUrl ? (
                                <img
                                  src={row.studentAvatarUrl}
                                  alt={row.studentName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center font-bold text-orange-400 text-xs">
                                  {row.studentName.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{row.studentName}</div>
                              <div className="text-[10px] font-mono text-orange-400 truncate">
                                {row.studentRegNumber} · {row.studentDepartment || "General"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* FOR WHAT JOB & TO WHICH EMPLOYER */}
                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{row.jobTitle}</div>
                            <div className="text-[11px] text-gray-400 truncate">
                              <span className="text-orange-400 font-semibold">{row.companyName}</span> · {row.natureOfWork}
                            </div>
                            <div className="text-[10px] text-gray-500">{row.duration}</div>
                          </div>
                        </td>

                        {/* WHY RECOMMENDED (Editable) */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="space-y-1">
                            <p className="text-gray-300 line-clamp-2 leading-relaxed text-[11px]">
                              {row.recommendationReason}
                            </p>
                            <button
                              type="button"
                              onClick={() => setEditingReasonRec(row)}
                              className="text-[10px] font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <i className="fas fa-edit text-[9px]" />
                              <span>Update Rationale</span>
                            </button>
                          </div>
                        </td>

                        {/* SUPERVISION STATUS & SUPERVISOR */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <SupervisionStatusBadge status={row.status} />
                            <div className="text-[10px] text-gray-500">
                              Supervisor: <span className="text-gray-300">{row.supervisorName || row.recommenderName}</span>
                            </div>
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSupervisingRec(row)}
                              className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500 hover:text-black transition-all cursor-pointer flex items-center gap-1"
                              title="Supervise and update status"
                            >
                              <i className="fas fa-tasks text-[10px]" />
                              <span>Supervise Status</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECOMMEND STUDENT TO A JOB OPENING */}
      {activeTab === "RECOMMEND" && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-[#101023] p-6 sm:p-8 shadow-xl">
          <div className="border-b border-white/10 pb-4 mb-6">
            <h3 className="text-xl font-bold text-white">
              Endorse & Recommend Student for Job Opening
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Select an enrolled student, choose from active corporate job postings, specify your professional recommendation rationale, and register as the placement supervisor.
            </p>
          </div>

          <RecommendationForm
            students={students}
            jobs={jobs}
            onSuccess={() => {
              setNotice("Student successfully recommended! Registered in Employer Engagement matrix.");
              setActiveTab("MATRIX");
              loadData();
              setTimeout(() => setNotice(null), 5000);
            }}
          />
        </div>
      )}

      {/* TAB 3: PARTNER ORGANIZATIONS DIRECTORY */}
      {activeTab === "EMPLOYERS" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-0.5 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <i className="fas fa-building" />
                <span>Verified Corporate Directory</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Partner Organizations & Employers
              </h3>
              <p className="text-xs text-gray-400 max-w-2xl">
                Onboard trusted enterprise recruiters with official CAC registration, corporate contact credentials, and verified portal dashboards for recruitment and student supervision.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEditingEmployer("NEW")}
              className={orangeButton}
            >
              <i className="fas fa-plus" />
              <span>Onboard Trusted Employer</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-[#101023] p-4">
            <div className="relative sm:col-span-2">
              <i className="fas fa-search absolute left-3.5 top-3 text-xs text-gray-500" />
              <input
                type="text"
                placeholder="Search by company name, RC number, email, or contact..."
                value={employerSearch}
                onChange={(e) => setEmployerSearch(e.target.value)}
                className={`${inputStyle} pl-9`}
              />
            </div>

            <div>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#090918] px-3 py-2 text-xs text-white focus:border-orange-500 cursor-pointer"
              >
                <option value="ALL">All Verification Statuses</option>
                <option value="VERIFIED">Verified Partners Only</option>
                <option value="PENDING">Verification Pending</option>
                <option value="SUSPENDED">Suspended Organizations</option>
              </select>
            </div>

            <div>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#090918] px-3 py-2 text-xs text-white focus:border-orange-500 cursor-pointer"
              >
                <option value="ALL">All Partnership Tiers</option>
                <option value="STRATEGIC">Strategic Partners</option>
                <option value="MOA_SIGNED">MoU Signed Partners</option>
                <option value="RECRUITING_PARTNER">Recruiting Partners</option>
                <option value="AFFILIATE">Affiliate Partners</option>
              </select>
            </div>
          </div>

          {employers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 text-2xl">
                <i className="fas fa-building" />
              </div>
              <h4 className="mt-4 text-base font-bold text-white">No partner employers found</h4>
              <p className="mt-1 text-xs text-gray-400 max-w-md mx-auto">
                No organizations match your current search and filter criteria. You can onboard a new employer or reset filters.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmployerSearch("");
                    setVerificationFilter("ALL");
                    setTierFilter("ALL");
                  }}
                  className={secondaryButton}
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEmployer("NEW")}
                  className={orangeButton}
                >
                  <i className="fas fa-plus" />
                  <span>Onboard New Partner</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {employers.map((emp) => (
                <div
                  key={emp.id}
                  className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#101023] p-5 sm:p-6 shadow-xl transition-all hover:border-orange-500/40"
                >
                  <div className="space-y-4">
                    {/* Header Strip */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 truncate block">
                          {emp.industry}
                        </span>
                        <h4 className="text-lg font-extrabold text-white mt-0.5 truncate" title={emp.name}>
                          {emp.name}
                        </h4>
                        {emp.registrationNumber && (
                          <div className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                            <i className="fas fa-certificate text-[9px]" />
                            <span>RC: {emp.registrationNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <TierBadge tier={emp.partnershipTier} />
                        <VerificationBadge status={emp.verificationStatus} />
                      </div>
                    </div>

                    {emp.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {emp.description}
                      </p>
                    )}

                    {/* Trust Details Box */}
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs space-y-2">
                      {emp.officialEmail && (
                        <div className="flex items-center gap-2 text-gray-300 font-mono text-[11px] truncate">
                          <i className="fas fa-shield-alt text-emerald-400 w-3.5 text-center shrink-0" />
                          <span className="truncate">{emp.officialEmail}</span>
                        </div>
                      )}

                      {emp.contactPerson && (
                        <div className="flex items-center gap-2 text-gray-300 text-xs truncate">
                          <i className="fas fa-user-tie text-gray-500 w-3.5 text-center shrink-0" />
                          <span className="font-semibold text-white truncate">{emp.contactPerson}</span>
                          {emp.contactDesignation && (
                            <span className="text-gray-400 text-[11px] truncate">({emp.contactDesignation})</span>
                          )}
                        </div>
                      )}

                      {emp.contactEmail && (
                        <div className="flex items-center gap-2 text-gray-300 font-mono text-[11px] truncate">
                          <i className="fas fa-envelope text-gray-500 w-3.5 text-center shrink-0" />
                          <a href={`mailto:${emp.contactEmail}`} className="text-orange-400 hover:underline truncate">
                            {emp.contactEmail}
                          </a>
                        </div>
                      )}

                      {emp.contactPhone && (
                        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-mono">
                          <i className="fas fa-phone text-gray-500 w-3.5 text-center shrink-0" />
                          <a href={`tel:${emp.contactPhone}`} className="hover:text-white">
                            {emp.contactPhone}
                          </a>
                        </div>
                      )}

                      {emp.websiteUrl && (
                        <div className="flex items-center gap-2 text-[11px] truncate">
                          <i className="fas fa-globe text-cyan-400 w-3.5 text-center shrink-0" />
                          <a
                            href={emp.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline truncate"
                          >
                            {emp.websiteUrl.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}

                      {emp.address && (
                        <div className="flex items-center gap-2 text-gray-400 text-[11px] truncate">
                          <i className="fas fa-map-marker-alt text-gray-500 w-3.5 text-center shrink-0" />
                          <span className="truncate">{emp.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Trust Badges */}
                    {Array.isArray(emp.trustBadges) && emp.trustBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {emp.trustBadges.map((badge, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300"
                          >
                            <i className="fas fa-check-shield text-cyan-400 text-[9px]" />
                            <span>{badge}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Portal Account Credential Status */}
                    <div className="pt-1">
                      {emp.hasLoginAccount ? (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2.5 text-xs">
                          <div className="min-w-0 flex items-center gap-2">
                            <i className="fas fa-user-check text-emerald-400 text-sm shrink-0" />
                            <div className="truncate">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                Portal Dashboard Active
                              </div>
                              <div className="text-gray-300 font-mono text-[11px] truncate">
                                {emp.loginEmail}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setCredentialsTarget(emp)}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Reset Portal Password"
                          >
                            <i className="fas fa-key text-[10px] mr-1" />
                            <span>Reset</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-xs">
                          <div className="min-w-0 flex items-center gap-2">
                            <i className="fas fa-user-slash text-gray-500 text-sm shrink-0" />
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                No Portal Login
                              </div>
                              <div className="text-gray-500 text-[11px]">Dashboard not activated</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setCredentialsTarget(emp)}
                            className="rounded-lg bg-orange-500/20 border border-orange-500/40 px-2.5 py-1 text-[11px] font-bold text-orange-400 hover:bg-orange-500/30 transition-colors cursor-pointer shrink-0"
                            title="Provision Portal Credentials"
                          >
                            <i className="fas fa-user-plus text-[10px] mr-1" />
                            <span>Provision Login</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-gray-400">
                        <span title="Active Vacancies">
                          <i className="fas fa-briefcase text-cyan-400 mr-1" />
                          {emp.activeJobsCount} Jobs
                        </span>
                        <span title="Supervised Candidate Placements">
                          <i className="fas fa-user-graduate text-emerald-400 mr-1" />
                          {emp.placementsCount} Placements
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingEmployer(emp)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                          title="Edit Employer Details"
                        >
                          <i className="fas fa-edit" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDeleteEmployer(emp.id, emp.name)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Employer"
                        >
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Verification Status Selector */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px]">
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Verification Status:
                      </span>
                      <select
                        value={emp.verificationStatus || "PENDING"}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            emp.id,
                            emp.name,
                            e.target.value as "PENDING" | "VERIFIED" | "SUSPENDED",
                          )
                        }
                        className="rounded-lg border border-white/10 bg-[#090918] px-2 py-1 text-[11px] font-semibold text-white focus:border-orange-500 cursor-pointer"
                      >
                        <option value="VERIFIED">Verified Partner</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SUPERVISE STATUS & UPDATE NOTES */}
      {supervisingRec && (
        <SuperviseStatusModal
          recommendation={supervisingRec}
          onClose={() => setSupervisingRec(null)}
          onSuccess={(updatedStatus, updatedNotes) => {
            setRecommendations((prev) =>
              prev.map((r) =>
                r.id === supervisingRec.id
                  ? { ...r, status: updatedStatus, supervisionNotes: updatedNotes, updatedAt: new Date() }
                  : r,
              ),
            );
            setNotice(`Supervision status for ${supervisingRec.studentName} updated to "${updatedStatus}".`);
            setSupervisingRec(null);
            setTimeout(() => setNotice(null), 4000);
          }}
        />
      )}

      {/* MODAL: UPDATE RECOMMENDATION REASON / RATIONALE */}
      {editingReasonRec && (
        <UpdateReasonModal
          recommendation={editingReasonRec}
          onClose={() => setEditingReasonRec(null)}
          onSuccess={(newReason) => {
            setRecommendations((prev) =>
              prev.map((r) =>
                r.id === editingReasonRec.id ? { ...r, recommendationReason: newReason } : r,
              ),
            );
            setNotice("Recommendation rationale updated successfully.");
            setEditingReasonRec(null);
            setTimeout(() => setNotice(null), 4000);
          }}
        />
      )}

      {/* MODAL: CREATE OR EDIT PARTNER EMPLOYER */}
      {editingEmployer && (
        <EmployerEditorModal
          initialData={editingEmployer === "NEW" ? null : editingEmployer}
          onClose={() => setEditingEmployer(null)}
          onSuccess={(saved) => {
            if (editingEmployer === "NEW") {
              setEmployers((prev) => [saved, ...prev]);
              setNotice(`Partner organization "${saved.name}" onboarded successfully.`);
            } else {
              setEmployers((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
              setNotice(`Partner organization "${saved.name}" updated successfully.`);
            }
            setEditingEmployer(null);
            loadData();
            setTimeout(() => setNotice(null), 4000);
          }}
        />
      )}

      {/* MODAL: PROVISION / RESET PORTAL CREDENTIALS */}
      {credentialsTarget && (
        <ManageCredentialsModal
          employer={credentialsTarget}
          onClose={() => setCredentialsTarget(null)}
          onSuccess={(email) => {
            setEmployers((prev) =>
              prev.map((e) =>
                e.id === credentialsTarget.id
                  ? {
                      ...e,
                      hasLoginAccount: true,
                      loginEmail: email,
                      userId: e.userId || "temp_usr_active",
                    }
                  : e,
              ),
            );
            setNotice(`Portal login credentials configured for "${credentialsTarget.name}" (${email}).`);
            setCredentialsTarget(null);
            loadData();
            setTimeout(() => setNotice(null), 4000);
          }}
        />
      )}
    </div>
  );
}

function VerificationBadge({ status }: { status?: string | null }) {
  switch (status) {
    case "VERIFIED":
      return (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
          <i className="fas fa-check-circle text-[8px]" /> Verified
        </span>
      );
    case "SUSPENDED":
      return (
        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
          <i className="fas fa-ban text-[8px]" /> Suspended
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
          <i className="fas fa-clock text-[8px]" /> Pending
        </span>
      );
  }
}

function SupervisionStatusBadge({ status }: { status: JobRecommendationRow["status"] }) {
  switch (status) {
    case "IN_PROGRESS":
      return (
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1 w-fit">
          <i className="fas fa-spinner fa-spin text-[8px]" /> In-Progress
        </span>
      );
    case "COMPLETED":
      return (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1 w-fit">
          <i className="fas fa-check-circle text-[8px]" /> Completed
        </span>
      );
    case "TERMINATED":
      return (
        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1 w-fit">
          <i className="fas fa-times-circle text-[8px]" /> Terminated
        </span>
      );
    case "APPLIED":
      return (
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1 w-fit">
          <i className="fas fa-paper-plane text-[8px]" /> Applied
        </span>
      );
    case "RECOMMENDED":
    default:
      return (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 w-fit">
          <i className="fas fa-clock text-[8px]" /> Recommended
        </span>
      );
  }
}

function TierBadge({ tier }: { tier: string }) {
  switch (tier) {
    case "STRATEGIC":
      return (
        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 uppercase shrink-0">
          Strategic
        </span>
      );
    case "MOA_SIGNED":
      return (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase shrink-0">
          MoU Signed
        </span>
      );
    case "AFFILIATE":
      return (
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase shrink-0">
          Affiliate
        </span>
      );
    case "RECRUITING_PARTNER":
    default:
      return (
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase shrink-0">
          Recruiter
        </span>
      );
  }
}

/**
 * Recommendation Form for Tab 2
 */
function RecommendationForm({
  students,
  jobs,
  onSuccess,
}: {
  students: StudentTableRow[];
  jobs: JobPostingItem[];
  onSuccess: () => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [recommendationReason, setRecommendationReason] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.regNumber.toLowerCase().includes(q);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedStudentId) {
      setError("Please select a student.");
      return;
    }
    if (!selectedJobId) {
      setError("Please select a job vacancy.");
      return;
    }
    if (!recommendationReason.trim()) {
      setError("Please provide a reason why you are making this recommendation.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await recommendJobToStudentAction({
          jobId: selectedJobId,
          studentId: selectedStudentId,
          recommendationReason: recommendationReason.trim(),
        });
        if (!res.success) throw new Error(res.error);
        onSuccess();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to record recommendation.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* 1. Target Job Vacancy */}
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1">
          1. Select Job Opportunity & Employer *
        </label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className={inputStyle}
          required
        >
          <option value="">-- Choose Job Opening ({jobs.length} Available) --</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} — {j.companyName} ({j.natureOfWork}, {j.vacanciesCount} vacancies)
            </option>
          ))}
        </select>
      </div>

      {/* 2. Target Student */}
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1">
          2. Select Candidate Student *
        </label>
        <input
          type="text"
          placeholder="Filter students by name or reg number..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          className={`${inputStyle} mb-2 py-1.5 text-xs`}
        />
        <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-[#070714] divide-y divide-white/5">
          {filteredStudents.slice(0, 30).map((st) => {
            const selected = selectedStudentId === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStudentId(st.id)}
                className={`flex w-full items-center justify-between p-2.5 text-left text-xs transition-colors cursor-pointer ${
                  selected ? "bg-orange-500/20 text-white font-bold" : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <div>
                  <div>{st.fullName}</div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {st.regNumber} · {st.department || "General"}
                  </div>
                </div>
                {selected && <i className="fas fa-check-circle text-orange-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Why Making Recommendation */}
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1">
          3. Why are you making this recommendation? (Rationale / Justification) *
        </label>
        <textarea
          rows={4}
          required
          placeholder="State your professional endorsement: candidate possesses high aptitude in relevant frameworks, completed workplace readiness benchmark, and demonstrated exemplary technical rigor..."
          value={recommendationReason}
          onChange={(e) => setRecommendationReason(e.target.value)}
          className={inputStyle}
        />
        <p className="mt-1 text-[11px] text-gray-500">
          This rationale will be visible on the student&apos;s dashboard and in the Employer Engagement supervision ledger.
        </p>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={isPending} className={`${orangeButton} w-full py-3`}>
          <i className="fas fa-paper-plane" />
          <span>{isPending ? "Recording Recommendation..." : "Recommend Candidate & Assume Supervision"}</span>
        </button>
      </div>
    </form>
  );
}

/**
 * Modal: Supervise Job Placement & Update Status (In-Progress, Completed, Terminated)
 */
function SuperviseStatusModal({
  recommendation,
  onClose,
  onSuccess,
}: {
  recommendation: JobRecommendationRow;
  onClose: () => void;
  onSuccess: (status: JobRecommendationRow["status"], notes: string) => void;
}) {
  const [status, setStatus] = useState<JobRecommendationRow["status"]>(recommendation.status);
  const [supervisionNote, setSupervisionNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const res = await updateJobSupervisionStatusAction(recommendation.id, {
          status,
          supervisionNotes: supervisionNote.trim() || undefined,
        });

        if (!res.success) throw new Error(res.error);
        const combinedNotes = recommendation.supervisionNotes
          ? `${recommendation.supervisionNotes}\n[${new Date().toLocaleDateString()}] ${supervisionNote}`
          : supervisionNote;
        onSuccess(status, combinedNotes);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update supervision status.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Placement Supervision Console
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Supervise Placement: {recommendation.studentName}
            </h3>
            <p className="text-xs text-gray-400">{recommendation.jobTitle} at {recommendation.companyName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-white cursor-pointer">
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Placement Engagement Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobRecommendationRow["status"])}
              className={inputStyle}
            >
              <option value="RECOMMENDED">RECOMMENDED — Initial staff endorsement</option>
              <option value="APPLIED">APPLIED — Student submitted application</option>
              <option value="IN_PROGRESS">IN_PROGRESS — Active work placement under supervision</option>
              <option value="COMPLETED">COMPLETED — Placement duration successfully concluded</option>
              <option value="TERMINATED">TERMINATED — Placement prematurely terminated or discontinued</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Supervision Observation / Status Update Note
            </label>
            <textarea
              rows={4}
              placeholder="Record supervisory check-in notes: e.g. Employer confirmed student commenced onboarding; performing well in team deliverables..."
              value={supervisionNote}
              onChange={(e) => setSupervisionNote(e.target.value)}
              className={inputStyle}
            />
          </div>

          {recommendation.supervisionNotes && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs space-y-1">
              <span className="font-bold text-gray-400 text-[10px] uppercase">Previous Supervision History:</span>
              <p className="text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto text-[11px]">
                {recommendation.supervisionNotes}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={orangeButton}>
              <i className="fas fa-check" />
              <span>{isPending ? "Updating..." : "Commit Status & Log Note"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal: Update Recommendation Reason
 */
function UpdateReasonModal({
  recommendation,
  onClose,
  onSuccess,
}: {
  recommendation: JobRecommendationRow;
  onClose: () => void;
  onSuccess: (newReason: string) => void;
}) {
  const [reason, setReason] = useState(recommendation.recommendationReason);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateRecommendationReasonAction(recommendation.id, reason.trim());
        if (!res.success) throw new Error(res.error);
        onSuccess(reason.trim());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update reason.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              Update Recommendation Rationale
            </h3>
            <p className="text-xs text-gray-400">{recommendation.studentName} for {recommendation.jobTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-white cursor-pointer">
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Why are you recommending this student? *
            </label>
            <textarea
              rows={5}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={orangeButton}>
              <i className="fas fa-save" />
              <span>{isPending ? "Saving..." : "Save Updated Rationale"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal: Provision or Reset Employer Portal Login Credentials
 */
function ManageCredentialsModal({
  employer,
  onClose,
  onSuccess,
}: {
  employer: PartnerEmployerItem;
  onClose: () => void;
  onSuccess: (email: string) => void;
}) {
  const [email, setEmail] = useState(
    employer.loginEmail || employer.officialEmail || employer.contactEmail || "",
  );
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Both corporate login email and password are required.");
      return;
    }

    if (password.trim().length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createOrResetEmployerLoginAction(
          employer.id,
          email.trim(),
          password.trim(),
        );
        if (!res.success) throw new Error(res.error);
        onSuccess(email.trim());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to set employer credentials.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              Corporate Account Provisioning
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {employer.hasLoginAccount ? "Reset Employer Credentials" : "Provision Portal Access"}
            </h3>
            <p className="text-xs text-gray-400">{employer.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:text-white cursor-pointer"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Employer Login Email *
            </label>
            <input
              type="email"
              required
              placeholder="corporate.login@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputStyle}
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Used by employer representative to sign into their corporate portal at /login.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-300">
                Portal Password *
              </label>
              <button
                type="button"
                onClick={() => setPassword("KSITM" + Math.floor(1000 + Math.random() * 9000) + "!")}
                className="text-[11px] font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
              >
                Generate Password
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputStyle} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white cursor-pointer"
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-400 space-y-1">
            <div className="font-semibold text-gray-300">Privileges Granted:</div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Post, edit, and manage company job openings</li>
              <li>View recommended student profiles with passports & contact details</li>
              <li>Review the reason why Career staff made each recommendation</li>
              <li>Update interview feedback and placement hiring stages</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={orangeButton}>
              <i className="fas fa-key" />
              <span>{isPending ? "Configuring..." : "Commit Login Access"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AVAILABLE_BADGES = [
  "CAC Registered",
  "Identity Verified",
  "Strategic MOA Partner",
  "Vetted Enterprise Recruiter",
  "NITDA Backed",
  "Regional Incubator",
  "Tax Compliant",
  "Public Sector Sponsor",
];

/**
 * Modal: Add or Edit Partner Employer
 */
function EmployerEditorModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData: PartnerEmployerItem | null;
  onClose: () => void;
  onSuccess: (saved: PartnerEmployerItem) => void;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [industry, setIndustry] = useState(initialData?.industry || "Technology");
  const [partnershipTier, setPartnershipTier] = useState<PartnerEmployerItem["partnershipTier"]>(
    initialData?.partnershipTier || "RECRUITING_PARTNER",
  );
  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registrationNumber || "");
  const [officialEmail, setOfficialEmail] = useState(initialData?.officialEmail || "");
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson || "");
  const [contactDesignation, setContactDesignation] = useState(initialData?.contactDesignation || "");
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.websiteUrl || "");
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [verificationStatus, setVerificationStatus] = useState<"PENDING" | "VERIFIED" | "SUSPENDED">(
    initialData?.verificationStatus || "VERIFIED",
  );
  const [badges, setBadges] = useState<string[]>(
    Array.isArray(initialData?.trustBadges) && initialData.trustBadges.length > 0
      ? initialData.trustBadges
      : ["CAC Registered", "Vetted Enterprise Recruiter"],
  );
  const [customBadge, setCustomBadge] = useState("");

  // Portal Account generation (new employer)
  const [createAccount, setCreateAccount] = useState(!initialData);
  const [loginEmail, setLoginEmail] = useState(initialData?.loginEmail || initialData?.officialEmail || "");
  const [loginPassword, setLoginPassword] = useState("Password123!");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const toggleBadge = (badge: string) => {
    setBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge],
    );
  };

  const handleAddCustomBadge = () => {
    if (!customBadge.trim()) return;
    if (!badges.includes(customBadge.trim())) {
      setBadges([...badges, customBadge.trim()]);
    }
    setCustomBadge("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Employer organization name is required.");
      return;
    }

    const payload: OnboardEmployerInput = {
      name: name.trim(),
      industry: industry.trim(),
      partnershipTier,
      registrationNumber: registrationNumber.trim() || undefined,
      officialEmail: officialEmail.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      contactDesignation: contactDesignation.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      address: address.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      description: description.trim() || undefined,
      verificationStatus,
      trustBadges: badges,
      isActive: true,
      createLoginAccount: !initialData && createAccount,
      loginEmail: createAccount ? loginEmail.trim() || undefined : undefined,
      loginPassword: createAccount ? loginPassword.trim() || undefined : undefined,
    };

    startTransition(async () => {
      try {
        if (initialData) {
          const res = await updatePartnerEmployerAction(initialData.id, payload);
          if (!res.success) throw new Error(res.error);
          onSuccess({
            ...initialData,
            name: payload.name,
            industry: payload.industry,
            partnershipTier: payload.partnershipTier,
            registrationNumber: payload.registrationNumber || null,
            officialEmail: payload.officialEmail || null,
            contactPerson: payload.contactPerson || null,
            contactDesignation: payload.contactDesignation || null,
            contactEmail: payload.contactEmail || null,
            contactPhone: payload.contactPhone || null,
            address: payload.address || null,
            websiteUrl: payload.websiteUrl || null,
            logoUrl: payload.logoUrl || null,
            description: payload.description || null,
            verificationStatus: payload.verificationStatus || "VERIFIED",
            trustBadges: badges,
            updatedAt: new Date(),
          });
        } else {
          const res = await onboardPartnerEmployerAction(payload);
          if (!res.success || !res.employerId) throw new Error(res.error);
          onSuccess({
            id: res.employerId,
            name: payload.name,
            slug: name.toLowerCase().replace(/\s+/g, "-"),
            industry: payload.industry,
            partnershipTier: payload.partnershipTier,
            registrationNumber: payload.registrationNumber || null,
            officialEmail: payload.officialEmail || null,
            contactPerson: payload.contactPerson || null,
            contactDesignation: payload.contactDesignation || null,
            contactEmail: payload.contactEmail || null,
            contactPhone: payload.contactPhone || null,
            address: payload.address || null,
            websiteUrl: payload.websiteUrl || null,
            logoUrl: payload.logoUrl || null,
            description: payload.description || null,
            verificationStatus: payload.verificationStatus || "VERIFIED",
            verifiedAt: new Date(),
            verifiedByUserId: null,
            trustBadges: badges,
            userId: createAccount ? "new_user" : null,
            loginEmail: createAccount ? loginEmail.trim() : null,
            hasLoginAccount: createAccount,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            activeJobsCount: 0,
            placementsCount: 0,
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to save employer.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              {initialData ? "Edit Partner Organization" : "Employer Onboarding & Compliance"}
            </span>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {initialData ? `Edit "${initialData.name}"` : "Onboard Trusted Partner Employer"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:text-white cursor-pointer"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Identification */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Company / Organization Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MTN Nigeria PLC"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                CAC Registration / RC Number
              </label>
              <input
                type="text"
                placeholder="e.g. RC-392571 or BN-89210"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Industry Sector *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Telecommunications, FinTech"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Partnership Tier *
              </label>
              <select
                value={partnershipTier}
                onChange={(e) =>
                  setPartnershipTier(e.target.value as PartnerEmployerItem["partnershipTier"])
                }
                className={inputStyle}
              >
                <option value="STRATEGIC">STRATEGIC — High priority multi-hire partner</option>
                <option value="MOA_SIGNED">MOA_SIGNED — Formal memorandum of agreement</option>
                <option value="RECRUITING_PARTNER">RECRUITING_PARTNER — Regular job poster</option>
                <option value="AFFILIATE">AFFILIATE — Periodic internship partner</option>
              </select>
            </div>
          </div>

          {/* 2. Official Corporate Contact */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Official Corporate Email (Domain-level)
              </label>
              <input
                type="email"
                placeholder="corporate.recruitment@company.com"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Official Website URL
              </label>
              <input
                type="url"
                placeholder="https://company.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          {/* 3. Contact Person & Designation */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                placeholder="e.g. Engr. Aliyu Sanusi"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Designation / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Talent Acquisition Director"
                value={contactDesignation}
                onChange={(e) => setContactDesignation(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Direct Contact Email
              </label>
              <input
                type="email"
                placeholder="aliyu.sanusi@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Direct Contact Phone
              </label>
              <input
                type="text"
                placeholder="+234 803 000 0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          {/* 4. Physical Office & Logo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Office / Regional Address
              </label>
              <input
                type="text"
                placeholder="e.g. Daura Road, Katsina"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Company Logo URL
              </label>
              <input
                type="url"
                placeholder="https://.../logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          {/* 5. Verification Status & Trust Badges */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Verification Status *
              </label>
              <select
                value={verificationStatus}
                onChange={(e) =>
                  setVerificationStatus(e.target.value as "PENDING" | "VERIFIED" | "SUSPENDED")
                }
                className={inputStyle}
              >
                <option value="VERIFIED">VERIFIED — Fully vetted trusted partner</option>
                <option value="PENDING">PENDING — Documentation under review</option>
                <option value="SUSPENDED">SUSPENDED — Organization paused</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Add Custom Trust Badge
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ISO Certified"
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  className={inputStyle}
                />
                <button
                  type="button"
                  onClick={handleAddCustomBadge}
                  className={secondaryButton}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Trust & Compliance Badges
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_BADGES.map((b) => {
                const selected = badges.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBadge(b)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      selected
                        ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <i className={`fas ${selected ? "fa-check-circle" : "fa-plus"} mr-1 text-[10px]`} />
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Overview */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Partnership Summary & Overview
            </label>
            <textarea
              rows={3}
              placeholder="Overview of institutional collaboration and talent pipeline..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* 7. Provision Login Credentials (Only for new employer onboarding) */}
          {!initialData && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span>Provision Employer Portal Login Account Immediately</span>
              </label>

              {createAccount && (
                <div className="grid sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      Login Email Address *
                    </label>
                    <input
                      type="email"
                      required={createAccount}
                      placeholder={officialEmail || "employer@ksitmcareers.org.ng"}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      Initial Temporary Password *
                    </label>
                    <input
                      type="text"
                      required={createAccount}
                      minLength={8}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={orangeButton}>
              <i className="fas fa-save" />
              <span>
                {isPending ? "Saving..." : initialData ? "Save Changes" : "Onboard Trusted Partner"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
