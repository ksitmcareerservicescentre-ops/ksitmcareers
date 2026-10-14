/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  listVirtualInternshipsAction,
  createVirtualInternshipAction,
  updateVirtualInternshipAction,
  deleteVirtualInternshipAction,
  assignVirtualInternshipAction,
  listInternshipEnrollmentsAction,
  submitInternshipOutcomeAction,
  reviewInternshipSubmissionAction,
  getCumulativeStudentOutcomesAction,
  type VirtualInternshipItem,
  type EnrollmentTableRow,
  type CumulativeStudentOutcome,
  type CreateInternshipInput,
} from "@/actions/internships";
import { listStudentsAction, type StudentTableRow } from "@/actions/students";

const DEPARTMENTS = [
  "ALL",
  "Computer Science",
  "Computer Software Engineering",
  "Networking & System Security",
  "Banking Operations & FinTech",
  "Mass Communication",
  "Business Administration",
];

const DIFFICULTIES = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"];

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";
const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function VirtualInternshipWorkspace() {
  const [activeTab, setActiveTab] = useState<"PROGRAMS" | "ENROLLMENTS" | "CUMULATIVE">("PROGRAMS");
  const [isPending, startTransition] = useTransition();

  // Programs State
  const [internships, setInternships] = useState<VirtualInternshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");

  // Students for Assignment Modal
  const [students, setStudents] = useState<StudentTableRow[]>([]);

  // Enrollments State
  const [enrollments, setEnrollments] = useState<EnrollmentTableRow[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");

  // Cumulative Outcomes State
  const [cumulativeOutcomes, setCumulativeOutcomes] = useState<CumulativeStudentOutcome[]>([]);
  const [cumulativeLoading, setCumulativeLoading] = useState(false);
  const [cumulativeSearch, setCumulativeSearch] = useState("");
  const [cumulativeDept, setCumulativeDept] = useState("ALL");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VirtualInternshipItem | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetInternshipId, setTargetInternshipId] = useState("");
  const [reviewItem, setReviewItem] = useState<EnrollmentTableRow | null>(null);
  const [testOutcomeItem, setTestOutcomeItem] = useState<EnrollmentTableRow | null>(null);

  // Load Internships
  const loadInternships = async () => {
    setLoading(true);
    try {
      const rows = await listVirtualInternshipsAction({
        search,
        department,
        difficulty,
      });
      setInternships(rows);
    } catch (err: unknown) {
      console.error("Failed to load internships:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Enrollments
  const loadEnrollments = async () => {
    setEnrollmentLoading(true);
    try {
      const rows = await listInternshipEnrollmentsAction({
        status: statusFilter,
        search: enrollmentSearch,
      });
      setEnrollments(rows);
    } catch (err: unknown) {
      console.error("Failed to load enrollments:", err);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Load Cumulative
  const loadCumulative = async () => {
    setCumulativeLoading(true);
    try {
      const rows = await getCumulativeStudentOutcomesAction({
        search: cumulativeSearch,
        department: cumulativeDept,
      });
      setCumulativeOutcomes(rows);
    } catch (err: unknown) {
      console.error("Failed to load cumulative outcomes:", err);
    } finally {
      setCumulativeLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    let active = true;
    void listVirtualInternshipsAction({
      search,
      department,
      difficulty,
    })
      .then((rows) => {
        if (active) {
          setInternships(rows);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load virtual internships:", err);
        if (active) setLoading(false);
      });

    void listStudentsAction().then((st) => {
      if (active) setStudents(st);
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, difficulty]);

  // Tab switch loads
  useEffect(() => {
    if (activeTab === "ENROLLMENTS") {
      let active = true;
      void listInternshipEnrollmentsAction({
        status: statusFilter,
        search: enrollmentSearch,
      }).then((rows) => {
        if (active) {
          setEnrollments(rows);
          setEnrollmentLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }
    if (activeTab === "CUMULATIVE") {
      let active = true;
      void getCumulativeStudentOutcomesAction({
        search: cumulativeSearch,
        department: cumulativeDept,
      }).then((rows) => {
        if (active) {
          setCumulativeOutcomes(rows);
          setCumulativeLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, cumulativeDept]);

  // Delete handler
  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the simulation: "${title}"?`)) {
      const res = await deleteVirtualInternshipAction(id);
      if (res.success) {
        await loadInternships();
      } else {
        alert(res.error || "Failed to delete internship.");
      }
    }
  };

  // Cumulative Metrics
  const totalSimulations = internships.length;
  const totalEnrolledAcrossAll = internships.reduce((sum, i) => sum + i.enrollmentsCount, 0);
  const totalCompletedAcrossAll = internships.reduce((sum, i) => sum + i.completedCount, 0);

  return (
    <div className="space-y-6">
      {/* Primary Workspace Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            <i className="fas fa-laptop-code text-xs" />
            <span>Practical Work Simulations · Industry Experiential Learning</span>
          </div>
          <h1 className="font-academic mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Virtual Internships Hub
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Industry simulation programs, student assignments, polymorphic outcome submissions,
            and cumulative performance dossiers.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">

          <button
            type="button"
            onClick={() => {
              setTargetInternshipId(internships[0]?.id || "");
              setAssignModalOpen(true);
            }}
            disabled={internships.length === 0}
            className={secondaryButton}
          >
            <i className="fas fa-user-plus text-xs" />
            <span>Assign to Students</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className={orangeButton}
          >
            <i className="fas fa-plus text-xs" />
            <span>New Internship</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Navigation Sub-Tabs */}
      <div className="flex border-b border-white/[0.08] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("PROGRAMS")}
          className={`inline-flex items-center gap-2 border-b-2 pb-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "PROGRAMS"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <i className="fas fa-layer-group" />
          <span>Internship Programs ({totalSimulations})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ENROLLMENTS")}
          className={`inline-flex items-center gap-2 border-b-2 pb-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "ENROLLMENTS"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <i className="fas fa-users-gear" />
          <span>Student Submissions & Review</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CUMULATIVE")}
          className={`inline-flex items-center gap-2 border-b-2 pb-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "CUMULATIVE"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <i className="fas fa-chart-pie" />
          <span>Cumulative Student Outcomes</span>
        </button>
      </div>

      {/* ================= TAB 1: PROGRAMS CATALOG (CRUD) ================= */}
      {activeTab === "PROGRAMS" && (
        <div className="space-y-6">
          {/* Executive Metrics Bar */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-gray-400">
                <span>Active Simulations</span>
                <i className="fas fa-briefcase text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
                {totalSimulations}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Available industry programs</p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-gray-400">
                <span>Total Enrolled</span>
                <i className="fas fa-user-graduate text-purple-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
                {totalEnrolledAcrossAll}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Students assigned or taking</p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-gray-400">
                <span>Approved Completions</span>
                <i className="fas fa-certificate text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
                {totalCompletedAcrossAll}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Verified student outcomes</p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-gray-400">
                <span>Completion Rate</span>
                <i className="fas fa-gauge-high text-orange-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-orange-400">
                {totalEnrolledAcrossAll > 0
                  ? Math.round((totalCompletedAcrossAll / totalEnrolledAcrossAll) * 100)
                  : 0}
                %
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Outcome delivery ratio</p>
            </div>
          </section>

          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 sm:flex-row sm:items-center sm:justify-between">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadInternships();
              }}
              className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-3.5 top-3.5 text-xs text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by simulation title, host organization, or skills…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#090918] pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Departments" : d}
                  </option>
                ))}
              </select>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {DIFFICULTIES.map((df) => (
                  <option key={df} value={df}>
                    {df === "ALL" ? "All Difficulties" : df}
                  </option>
                ))}
              </select>

              <button type="submit" className={secondaryButton}>
                <i className="fas fa-filter text-xs" />
                <span>Filter</span>
              </button>
            </form>
          </div>

          {/* Internships Cards Grid */}
          {loading ? (
            <div className="py-24 text-center text-xs text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl text-cyan-400 mb-2 block" />
              <span>Loading virtual work simulations…</span>
            </div>
          ) : internships.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c1e] p-12 text-center space-y-3">
              <i className="fas fa-laptop-code text-3xl text-gray-500" />
              <h3 className="text-sm font-bold text-white">No Virtual Internships Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No simulations match your current filters. Create a new practical work simulation to engage students.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditItem(null);
                  setCreateModalOpen(true);
                }}
                className={orangeButton}
              >
                <i className="fas fa-plus text-xs" />
                <span>Create Virtual Internship</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {internships.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c1e] transition-all hover:border-white/20 hover:shadow-xl"
                >
                  {/* Card Header & Banner */}
                  <div>
                    {item.bannerUrl ? (
                      <div className="relative h-40 w-full overflow-hidden bg-black/40">
                        <img
                          src={item.bannerUrl}
                          alt={item.title}
                          className="h-full w-full object-cover opacity-85 transition-transform hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c1e] via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-3 rounded-lg border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-md">
                          {item.organizationName}
                        </span>
                      </div>
                    ) : (
                      <div className="p-4 border-b border-white/[0.05] bg-gradient-to-r from-cyan-950/30 to-purple-950/30">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                          {item.organizationName}
                        </span>
                      </div>
                    )}

                    {/* Content Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            item.difficulty === "ADVANCED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : item.difficulty === "INTERMEDIATE"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {item.difficulty}
                        </span>
                        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-gray-300">
                          {item.duration}
                        </span>
                        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-gray-400">
                          {item.department === "ALL" ? "All Departments" : item.department}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>

                      {/* Deliverables / Tasks Strip */}
                      {item.tasksDeliverables.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-white/[0.05]">
                          <span className="text-[10px] font-mono text-gray-500 uppercase">
                            Deliverables Required ({item.tasksDeliverables.length})
                          </span>
                          <div className="space-y-1">
                            {item.tasksDeliverables.slice(0, 2).map((t, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 text-[11px] text-gray-300 truncate"
                              >
                                <i className="fas fa-check-circle text-[9px] text-cyan-400 shrink-0" />
                                <span className="truncate">{t.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Participation Counts */}
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/[0.05]">
                        <span className="flex items-center gap-1.5">
                          <i className="fas fa-user-graduate text-purple-400" />
                          <span>{item.enrollmentsCount} Enrolled</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <i className="fas fa-circle-check" />
                          <span>{item.completedCount} Completed</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] p-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetInternshipId(item.id);
                        setAssignModalOpen(true);
                      }}
                      className="flex-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer"
                    >
                      <i className="fas fa-user-plus mr-1" />
                      Assign
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditItem(item)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                      title="Edit Internship"
                    >
                      <i className="fas fa-edit" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                      title="Delete Internship"
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ENROLLMENTS & STAFF REVIEW ================= */}
      {activeTab === "ENROLLMENTS" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3.5 top-3.5 text-xs text-gray-500" />
              <input
                type="text"
                placeholder="Search by student name, registration number, or simulation…"
                value={enrollmentSearch}
                onChange={(e) => setEnrollmentSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadEnrollments()}
                className="w-full rounded-xl border border-white/10 bg-[#090918] pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Pending Staff Review (Submitted)</option>
              <option value="APPROVED">Approved & Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ASSIGNED">Assigned (Not Started)</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
            </select>

            <button type="button" onClick={loadEnrollments} className={secondaryButton}>
              <i className="fas fa-filter text-xs" />
              <span>Filter</span>
            </button>
          </div>

          {/* Enrollments Table */}
          {enrollmentLoading ? (
            <div className="py-20 text-center text-xs text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl text-cyan-400 mb-2 block" />
              <span>Loading student submissions…</span>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c1e] p-12 text-center space-y-3">
              <i className="fas fa-clipboard-check text-3xl text-gray-500" />
              <h3 className="text-sm font-bold text-white">No Enrollments or Submissions Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No students currently match this filter. Assign an internship to a student or use
                the simulation test action.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0c0c1e]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-gray-400">
                    <th className="px-4 py-3 font-semibold">Student / Scholar</th>
                    <th className="px-4 py-3 font-semibold">Target Simulation</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Attached Outcome</th>
                    <th className="px-4 py-3 font-semibold">Staff Grade & Feedback</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {enrollments.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Student Identity with Passport */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                            {row.studentAvatarUrl ? (
                              <img
                                src={row.studentAvatarUrl}
                                alt={row.studentName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-cyan-400">
                                {row.studentName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">{row.studentName}</div>
                            <div className="font-mono text-[11px] text-gray-400">
                              {row.studentRegNumber} · {row.studentDepartment || "KSITM"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Internship */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white max-w-xs truncate">
                          {row.internshipTitle}
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono">
                          {row.organizationName}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            row.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : row.status === "SUBMITTED"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                              : row.status === "IN_PROGRESS"
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                              : row.status === "REVISION_REQUESTED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          <i className="fas fa-circle text-[6px]" />
                          {row.status === "SUBMITTED" ? "Submitted (Pending Review)" : row.status}
                        </span>
                      </td>

                      {/* Attached Outcome */}
                      <td className="px-4 py-3">
                        {row.submittedAt ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-gray-200">
                              <i
                                className={`fas ${
                                  row.outcomeType === "URL"
                                    ? "fa-link text-cyan-400"
                                    : row.outcomeType === "VIDEO"
                                    ? "fa-video text-purple-400"
                                    : row.outcomeType === "FILE"
                                    ? "fa-file-pdf text-orange-400"
                                    : "fa-align-left text-emerald-400"
                                } text-xs`}
                              />
                              <span className="truncate max-w-[180px]">
                                {row.outcomeTitle || "Deliverables"}
                              </span>
                            </div>

                            {/* Clickable links */}
                            <div className="flex items-center gap-2 text-[11px]">
                              {row.outcomeUrl && (
                                <a
                                  href={row.outcomeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-cyan-400 hover:text-cyan-300"
                                >
                                  View Link
                                </a>
                              )}
                              {row.outcomeFileUrl && (
                                <a
                                  href={row.outcomeFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-orange-400 hover:text-orange-300"
                                >
                                  {row.outcomeFileName || "Attachment"}
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">No outcome submitted yet</span>
                        )}
                      </td>

                      {/* Staff Grade & Feedback */}
                      <td className="px-4 py-3">
                        {row.gradeScore ? (
                          <div>
                            <span className="font-bold text-emerald-400 font-mono">
                              {row.gradeScore}
                            </span>
                            {row.staffFeedback && (
                              <p className="text-[11px] text-gray-400 truncate max-w-xs">
                                {row.staffFeedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Student Outcome Simulation Test Button */}
                          <button
                            type="button"
                            onClick={() => setTestOutcomeItem(row)}
                            className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[11px] font-semibold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                            title="Simulate or attach student outcome"
                          >
                            <i className="fas fa-paperclip mr-1" />
                            Attach Outcome
                          </button>

                          {/* Staff Review Button */}
                          <button
                            type="button"
                            onClick={() => setReviewItem(row)}
                            className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 text-[11px] font-bold text-orange-400 hover:bg-orange-500/20 transition-colors cursor-pointer"
                          >
                            Review & Grade
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: CUMULATIVE STUDENT OUTCOMES ================= */}
      {activeTab === "CUMULATIVE" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0c0c1e] to-[#12122b] p-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <i className="fas fa-award text-orange-400" />
              <span>Cumulative Virtual Internship Transcripts & Artifact Repositories</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Consolidated registry tracking all approved work simulations, completed hours,
              and verifiable artifacts (GitHub repositories, Loom demo videos, technical documentation,
              and executive reflections) delivered by each student.
            </p>
          </div>

          {/* Search & Dept Filter */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3.5 top-3.5 text-xs text-gray-500" />
              <input
                type="text"
                placeholder="Search cumulative records by student name or registration number…"
                value={cumulativeSearch}
                onChange={(e) => setCumulativeSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadCumulative()}
                className="w-full rounded-xl border border-white/10 bg-[#090918] pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <select
              value={cumulativeDept}
              onChange={(e) => setCumulativeDept(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d === "ALL" ? "All Departments" : d}
                </option>
              ))}
            </select>

            <button type="button" onClick={loadCumulative} className={secondaryButton}>
              <i className="fas fa-filter text-xs" />
              <span>Filter</span>
            </button>
          </div>

          {/* Cumulative Dossier Cards */}
          {cumulativeLoading ? (
            <div className="py-20 text-center text-xs text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl text-cyan-400 mb-2 block" />
              <span>Compiling cumulative student outcomes…</span>
            </div>
          ) : cumulativeOutcomes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c1e] p-12 text-center space-y-3">
              <i className="fas fa-folder-open text-3xl text-gray-500" />
              <h3 className="text-sm font-bold text-white">No Cumulative Records Available</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No students currently have active or approved virtual internship enrollments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cumulativeOutcomes.map((st) => (
                <div
                  key={st.studentId}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-5 transition-all hover:border-white/20 space-y-4"
                >
                  {/* Student Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-orange-500/40 bg-black/40">
                        {st.avatarUrl ? (
                          <img
                            src={st.avatarUrl}
                            alt={st.studentName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-orange-400 text-lg">
                            {st.studentName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-base font-bold text-white">{st.studentName}</div>
                        <div className="text-xs text-gray-400 font-mono">
                          {st.regNumber} · {st.department || "KSITM"} · {st.level || "ND/HND"}
                        </div>
                      </div>
                    </div>

                    {/* Summary Counters */}
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-center">
                        <div className="text-[10px] font-mono uppercase text-gray-400">Total Enrolled</div>
                        <div className="text-base font-bold text-white">{st.totalEnrolled}</div>
                      </div>
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-center">
                        <div className="text-[10px] font-mono uppercase text-emerald-400">Approved</div>
                        <div className="text-base font-black text-emerald-400">{st.totalApproved}</div>
                      </div>
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-center">
                        <div className="text-[10px] font-mono uppercase text-amber-400">In Review</div>
                        <div className="text-base font-bold text-amber-400">{st.totalPendingReview}</div>
                      </div>
                    </div>
                  </div>

                  {/* Completed Artifacts Portfolio Strip */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <i className="fas fa-boxes-stacked text-cyan-400" />
                      <span>Approved Deliverables & Outcome Portfolio ({st.completedInternships.length})</span>
                    </span>

                    {st.completedInternships.length === 0 ? (
                      <p className="text-xs text-gray-500 italic pl-1">
                        No approved internships completed yet. In-progress work is underway.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {st.completedInternships.map((art, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-[#090918] p-3.5 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs truncate">
                                {art.internshipTitle}
                              </span>
                              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                                {art.gradeScore || "Approved"}
                              </span>
                            </div>

                            <div className="text-[11px] text-gray-400">
                              Host: <span className="text-cyan-400 font-medium">{art.organizationName}</span>
                            </div>

                            {/* Outcome Reflection Preview */}
                            {art.outcomeText && (
                              <p className="text-[11px] text-gray-300 italic line-clamp-2 bg-black/20 p-2 rounded-lg">
                                &ldquo;{art.outcomeText}&rdquo;
                              </p>
                            )}

                            {/* Direct Clickable Artifact Links */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.05]">
                              {art.outcomeUrl && (
                                <a
                                  href={art.outcomeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/20"
                                >
                                  <i className="fas fa-external-link-alt" />
                                  <span>Live Repo / Demo</span>
                                </a>
                              )}
                              {art.outcomeFileUrl && (
                                <a
                                  href={art.outcomeFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 border border-orange-500/30 px-2 py-1 text-[10px] font-bold text-orange-400 hover:bg-orange-500/20"
                                >
                                  <i className="fas fa-file-arrow-down" />
                                  <span>{art.outcomeFileName || "Document Artifact"}</span>
                                </a>
                              )}
                              {art.completedAt && (
                                <span className="text-[10px] text-gray-500 font-mono ml-auto">
                                  {new Date(art.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT INTERNSHIP ================= */}
      {(createModalOpen || editItem) && (
        <CreateOrEditInternshipModal
          item={editItem}
          onClose={() => {
            setCreateModalOpen(false);
            setEditItem(null);
          }}
          onSuccess={() => {
            setCreateModalOpen(false);
            setEditItem(null);
            loadInternships();
          }}
        />
      )}

      {/* ================= MODAL: ASSIGN INTERNSHIP TO STUDENTS ================= */}
      {assignModalOpen && (
        <AssignInternshipModal
          internships={internships}
          defaultInternshipId={targetInternshipId}
          students={students}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={() => {
            setAssignModalOpen(false);
            loadInternships();
            if (activeTab === "ENROLLMENTS") loadEnrollments();
          }}
        />
      )}

      {/* ================= MODAL: STAFF REVIEW & GRADING ================= */}
      {reviewItem && (
        <StaffReviewModal
          enrollment={reviewItem}
          onClose={() => setReviewItem(null)}
          onSuccess={() => {
            setReviewItem(null);
            loadEnrollments();
            if (activeTab === "CUMULATIVE") loadCumulative();
          }}
        />
      )}

      {/* ================= MODAL: TEST / ATTACH STUDENT OUTCOME ================= */}
      {testOutcomeItem && (
        <StudentOutcomeSubmissionModal
          enrollment={testOutcomeItem}
          onClose={() => setTestOutcomeItem(null)}
          onSuccess={() => {
            setTestOutcomeItem(null);
            loadEnrollments();
            if (activeTab === "CUMULATIVE") loadCumulative();
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-MODAL COMPONENTS
// ----------------------------------------------------------------------

function CreateOrEditInternshipModal({
  item,
  onClose,
  onSuccess,
}: {
  item: VirtualInternshipItem | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(item?.title || "");
  const [organizationName, setOrganizationName] = useState(item?.organizationName || "");
  const [department, setDepartment] = useState(item?.department || "ALL");
  const [level, setLevel] = useState(item?.level || "ALL");
  const [duration, setDuration] = useState(item?.duration || "4 Weeks (15 Hours Self-Paced)");
  const [difficulty, setDifficulty] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">(
    (item?.difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") || "INTERMEDIATE",
  );
  const [bannerUrl, setBannerUrl] = useState(item?.bannerUrl || "");
  const [summary, setSummary] = useState(item?.summary || "");
  const [description, setDescription] = useState(item?.description || "");
  const [skills, setSkills] = useState(item?.skills || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organizationName.trim() || !summary.trim()) {
      alert("Please fill required fields (Title, Host Organization, Summary).");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateInternshipInput = {
        title,
        organizationName,
        department,
        level,
        duration,
        difficulty,
        bannerUrl: bannerUrl.trim() || undefined,
        summary,
        description: description.trim() || summary,
        skills,
      };

      if (item) {
        const res = await updateVirtualInternshipAction(item.id, payload);
        if (res.success) onSuccess();
        else alert(res.error || "Failed to update.");
      } else {
        const res = await createVirtualInternshipAction(payload);
        if (res.success) onSuccess();
        else alert(res.error || "Failed to create.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c1e] p-6 space-y-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-laptop-code text-cyan-400" />
            <h3 className="text-base font-bold">
              {item ? "Edit Virtual Work Simulation" : "Create Virtual Work Simulation"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300">Simulation Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cloud Infrastructure & Distributed Microservices"
              className={inputStyle}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300">Host Organization / Sponsor *</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Google Cloud & Forage / Katsina Tech Hub"
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300">Estimated Duration *</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 4 Weeks (15 Hours)"
                className={inputStyle}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300">Target Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputStyle}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Departments" : d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300">Academic Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputStyle}
              >
                <option value="ALL">All Levels</option>
                <option value="ND 1">ND 1</option>
                <option value="ND 2">ND 2</option>
                <option value="HND 1">HND 1</option>
                <option value="HND 2">HND 2</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED")}
                className={inputStyle}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Banner Image URL</label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Executive Summary *</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief overview explaining what the student will experience and deliver..."
              className={inputStyle}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Full Description & Scenario</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed simulation briefing, background context, and instructions..."
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Target Skills & Technologies</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Docker, TypeScript, PostgreSQL, CI/CD, REST APIs"
              className={inputStyle}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={orangeButton}>
              {saving ? "Saving…" : item ? "Save Changes" : "Create Simulation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignInternshipModal({
  internships,
  defaultInternshipId,
  students,
  onClose,
  onSuccess,
}: {
  internships: VirtualInternshipItem[];
  defaultInternshipId: string;
  students: StudentTableRow[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [internshipId, setInternshipId] = useState(defaultInternshipId || internships[0]?.id || "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assignmentNote, setAssignmentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");

  const filteredStudents = students.filter((s) => {
    if (!searchStudent.trim()) return true;
    const q = searchStudent.toLowerCase().trim();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.regNumber.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredStudents.map((s) => s.id);
    setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...ids])));
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internshipId || selectedStudentIds.length === 0) {
      alert("Please select a virtual internship and at least one student.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await assignVirtualInternshipAction({
        internshipId,
        studentIds: selectedStudentIds,
        assignmentNote,
      });
      if (res.success) {
        alert(`Successfully assigned virtual internship to ${res.assignedCount} student(s).`);
        onSuccess();
      } else {
        alert(res.error || "Failed to assign.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c1e] p-6 space-y-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-user-plus text-cyan-400" />
            <h3 className="text-base font-bold">Assign Virtual Work Simulation</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300">Select Target Internship *</label>
            <select
              value={internshipId}
              onChange={(e) => setInternshipId(e.target.value)}
              className={inputStyle}
            >
              {internships.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.organizationName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Staff Guidance / Assignment Note</label>
            <input
              type="text"
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              placeholder="e.g. Recommended to complete prior to your Siemens advisory session..."
              className={inputStyle}
            />
          </div>

          {/* Student Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300">
                Choose Students ({selectedStudentIds.length} Selected) *
              </label>
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-[11px] font-bold text-orange-400 hover:underline cursor-pointer"
              >
                Select All ({filteredStudents.length})
              </button>
            </div>

            <input
              type="text"
              placeholder="Filter student list by name or registration number…"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#090918] px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
            />

            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#090918] p-2 space-y-1 divide-y divide-white/[0.04]">
              {filteredStudents.map((st) => (
                <label
                  key={st.id}
                  className="flex items-center gap-3 p-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(st.id)}
                    onChange={() => toggleStudent(st.id)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white block truncate">{st.fullName}</span>
                    <span className="text-[11px] font-mono text-gray-400">
                      {st.regNumber} · {st.department || "KSITM"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedStudentIds.length === 0}
              className={orangeButton}
            >
              {submitting ? "Assigning…" : `Assign to ${selectedStudentIds.length} Student(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffReviewModal({
  enrollment,
  onClose,
  onSuccess,
}: {
  enrollment: EnrollmentTableRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<"APPROVED" | "REVISION_REQUESTED">("APPROVED");
  const [gradeScore, setGradeScore] = useState(enrollment.gradeScore || "Distinction (95%)");
  const [staffFeedback, setStaffFeedback] = useState(
    enrollment.staffFeedback ||
      "Well-structured outcome. Demonstrates solid grasp of the simulation deliverables.",
  );
  const [saving, setSaving] = useState(false);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFeedback.trim()) {
      alert("Please provide staff feedback.");
      return;
    }

    setSaving(true);
    try {
      const res = await reviewInternshipSubmissionAction(enrollment.id, {
        status,
        gradeScore,
        staffFeedback,
      });
      if (res.success) {
        onSuccess();
      } else {
        alert(res.error || "Failed to submit review.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c1e] p-6 space-y-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-stamp text-orange-400" />
            <h3 className="text-base font-bold">Review & Grade Internship Submission</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>

        {/* Student & Simulation Summary Box */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white text-sm">{enrollment.studentName}</span>
            <span className="font-mono text-cyan-400">{enrollment.studentRegNumber}</span>
          </div>
          <div className="text-xs text-gray-400">
            Simulation: <span className="text-white font-semibold">{enrollment.internshipTitle}</span> ({enrollment.organizationName})
          </div>

          {/* Submitted Artifacts Viewer */}
          <div className="pt-2 border-t border-white/[0.05] space-y-2">
            <span className="text-[11px] font-mono text-orange-400 uppercase font-bold block">
              Student Submitted Outcome:
            </span>
            <div className="text-xs font-bold text-gray-200">
              {enrollment.outcomeTitle || "Deliverable Submission"}
            </div>

            {enrollment.outcomeText && (
              <div className="rounded-lg bg-black/30 p-3 text-xs text-gray-300 leading-relaxed whitespace-pre-line border border-white/[0.05]">
                {enrollment.outcomeText}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {enrollment.outcomeUrl && (
                <a
                  href={enrollment.outcomeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
                >
                  <i className="fas fa-arrow-up-right-from-square" />
                  <span>Open URL / Repo / Video Presentation</span>
                </a>
              )}
              {enrollment.outcomeFileUrl && (
                <a
                  href={enrollment.outcomeFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/30"
                >
                  <i className="fas fa-file-pdf" />
                  <span>{enrollment.outcomeFileName || "Download Attached Document / Image"}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Staff Review Form */}
        <form onSubmit={handleReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300">Approval Decision *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "APPROVED" | "REVISION_REQUESTED")}
                className={inputStyle}
              >
                <option value="APPROVED">Approve & Mark Completed</option>
                <option value="REVISION_REQUESTED">Request Revisions from Student</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300">Grade / Performance Score</label>
              <input
                type="text"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                placeholder="e.g. Distinction (95%) / Completed"
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Staff Feedback & Assessment Notes *</label>
            <textarea
              rows={4}
              value={staffFeedback}
              onChange={(e) => setStaffFeedback(e.target.value)}
              placeholder="Constructive feedback evaluating the student's solution, code quality, or presentation..."
              className={inputStyle}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={orangeButton}>
              {saving ? "Submitting…" : status === "APPROVED" ? "Approve & Complete" : "Request Revisions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentOutcomeSubmissionModal({
  enrollment,
  onClose,
  onSuccess,
}: {
  enrollment: EnrollmentTableRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [outcomeType, setOutcomeType] = useState<"TEXT" | "URL" | "FILE" | "VIDEO" | "HYBRID">(
    (enrollment.outcomeType as "TEXT" | "URL" | "FILE" | "VIDEO" | "HYBRID") || "HYBRID",
  );
  const [outcomeTitle, setOutcomeTitle] = useState(
    enrollment.outcomeTitle || "Simulation Deliverables & Technical Summary",
  );
  const [outcomeText, setOutcomeText] = useState(enrollment.outcomeText || "");
  const [outcomeUrl, setOutcomeUrl] = useState(enrollment.outcomeUrl || "");
  const [outcomeFileUrl, setOutcomeFileUrl] = useState(enrollment.outcomeFileUrl || "");
  const [outcomeFileName, setOutcomeFileName] = useState(
    enrollment.outcomeFileName || "Final_Simulation_Report.pdf",
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeText.trim() && !outcomeUrl.trim() && !outcomeFileUrl.trim()) {
      alert("Please provide at least one outcome (Text reflection, URL, or File).");
      return;
    }

    setSaving(true);
    try {
      const res = await submitInternshipOutcomeAction(enrollment.id, {
        outcomeType,
        outcomeTitle,
        outcomeText,
        outcomeUrl,
        outcomeFileUrl,
        outcomeFileName,
      });
      if (res.success) {
        alert("Internship outcome submitted successfully for staff review.");
        onSuccess();
      } else {
        alert(res.error || "Failed to submit outcome.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c1e] p-6 space-y-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-paperclip text-cyan-400" />
            <h3 className="text-base font-bold">Attach Student Internship Outcome</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-gray-400 space-y-1">
          <div>
            Student: <span className="text-white font-bold">{enrollment.studentName}</span> ({enrollment.studentRegNumber})
          </div>
          <div>
            Simulation: <span className="text-cyan-400 font-semibold">{enrollment.internshipTitle}</span>
          </div>
        </div>

        {/* Polymorphic Format Selector */}
        <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">
          {[
            { id: "HYBRID", label: "Comprehensive Package", icon: "fa-boxes-packing" },
            { id: "TEXT", label: "Executive Reflection", icon: "fa-align-left" },
            { id: "URL", label: "Web / GitHub Link", icon: "fa-link" },
            { id: "VIDEO", label: "Video Presentation", icon: "fa-video" },
            { id: "FILE", label: "Document / Image Proof", icon: "fa-file-pdf" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setOutcomeType(mode.id as typeof outcomeType)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                outcomeType === mode.id
                  ? "bg-cyan-500 text-[#090915] font-bold"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <i className={`fas ${mode.icon} text-[11px]`} />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300">Deliverable Title *</label>
            <input
              type="text"
              value={outcomeTitle}
              onChange={(e) => setOutcomeTitle(e.target.value)}
              className={inputStyle}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">
              Executive Reflection & Technical Writeup
            </label>
            <textarea
              rows={4}
              value={outcomeText}
              onChange={(e) => setOutcomeText(e.target.value)}
              placeholder="Summarize the core engineering deliverables achieved, challenges solved, and key competencies learned..."
              className={inputStyle}
            />
          </div>

          {(outcomeType === "URL" || outcomeType === "VIDEO" || outcomeType === "HYBRID") && (
            <div>
              <label className="text-xs font-semibold text-gray-300">
                Live URL / GitHub Repo / Loom Demo Video
              </label>
              <input
                type="url"
                value={outcomeUrl}
                onChange={(e) => setOutcomeUrl(e.target.value)}
                placeholder="https://github.com/... or https://loom.com/share/..."
                className={inputStyle}
              />
            </div>
          )}

          {(outcomeType === "FILE" || outcomeType === "HYBRID") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-300">Document / Image URL</label>
                <input
                  type="url"
                  value={outcomeFileUrl}
                  onChange={(e) => setOutcomeFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or cloud file link"
                  className={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300">Attachment Display Name</label>
                <input
                  type="text"
                  value={outcomeFileName}
                  onChange={(e) => setOutcomeFileName(e.target.value)}
                  placeholder="e.g. Architecture_Diagram.pdf"
                  className={inputStyle}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={orangeButton}>
              {saving ? "Submitting…" : "Submit Outcome for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
