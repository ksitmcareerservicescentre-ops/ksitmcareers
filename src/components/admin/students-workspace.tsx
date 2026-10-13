/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  listStudentsAction,
  getStudentDossierAction,
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  logStudentOccurrenceAction,
  listStudentMasterListAction,
  createMasterRecordAction,
  updateMasterRecordAction,
  deleteMasterRecordAction,
  seedStandardMasterRecordsAction,
  type StudentTableRow,
  type StudentDossierData,
  type MasterListTableRow,
} from "@/actions/students";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const cardStyle =
  "rounded-2xl border border-white/[0.08] bg-[#0c0c1e]/80 p-5 backdrop-blur-sm transition-all hover:border-white/20";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

const DEPARTMENTS = [
  "ALL",
  "Computer Software Engineering",
  "Networking & System Security",
  "Banking Operations",
  "Multimedia Technology",
  "Telecommunications Technology",
  "Electrical & Electronics Engineering",
  "Accountancy & Financial Management",
  "Business & Entrepreneurship Studies",
  "Library & Information Science",
];

const LEVELS = [
  "ALL",
  "National Diploma I (ND 1)",
  "National Diploma II (ND 2)",
  "Higher National Diploma I (HND 1)",
  "Higher National Diploma II (HND 2)",
];

export function StudentsWorkspace() {
  const [students, setStudents] = useState<StudentTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  // Tab state
  const [activeTab, setActiveTab] = useState<"REGISTERED" | "MASTER_LIST">(
    "REGISTERED",
  );

  // Master list state
  const [masterRecords, setMasterRecords] = useState<MasterListTableRow[]>([]);
  const [masterStats, setMasterStats] = useState({
    totalMaster: 0,
    totalRegistered: 0,
    totalPending: 0,
  });
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterSearch, setMasterSearch] = useState("");
  const [masterStatus, setMasterStatus] = useState<
    "ALL" | "REGISTERED" | "PENDING"
  >("ALL");
  const [masterDept, setMasterDept] = useState("ALL");
  const [createMasterOpen, setCreateMasterOpen] = useState(false);
  const [editMasterRecord, setEditMasterRecord] =
    useState<MasterListTableRow | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentTableRow | null>(null);
  const [dossierStudentId, setDossierStudentId] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await listStudentsAction({
        search,
        department,
        level,
        status,
      });
      setStudents(rows);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load students directory.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMasterList = async () => {
    setMasterLoading(true);
    try {
      const res = await listStudentMasterListAction({
        search: masterSearch,
        status: masterStatus,
        department: masterDept,
      });
      setMasterRecords(res.records);
      setMasterStats(res.stats);
    } catch (err: unknown) {
      console.error("Failed to load master list:", err);
    } finally {
      setMasterLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void listStudentsAction({
      search,
      department,
      level,
      status,
    })
      .then((rows) => {
        if (active) {
          setStudents(rows);
          setError("");
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load students directory.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, level, status]);

  useEffect(() => {
    let active = true;
    void listStudentMasterListAction({
      search: masterSearch,
      status: masterStatus,
      department: masterDept,
    })
      .then((res) => {
        if (active) {
          setMasterRecords(res.records);
          setMasterStats(res.stats);
          setMasterLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load master list:", err);
        if (active) {
          setMasterLoading(false);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterStatus, masterDept]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const handleMasterSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMasterList();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deactivate student record for ${name}?`)) {
      const res = await deleteStudentAction(id);
      if (res.success) {
        await loadStudents();
      } else {
        alert(res.error || "Failed to deactivate student.");
      }
    }
  };

  const handleSeedMaster = () => {
    startTransition(async () => {
      const res = await seedStandardMasterRecordsAction();
      if (res.success) {
        await loadMasterList();
        alert(
          `Successfully synchronized ${res.addedCount} accredited KSITM institutional master records.`,
        );
      } else {
        alert(res.error || "Failed to seed master records.");
      }
    });
  };

  const handleDeleteMaster = async (id: string, name: string) => {
    if (
      confirm(
        `Remove "${name}" from institutional master list? (Only un-registered records can be removed)`,
      )
    ) {
      const res = await deleteMasterRecordAction(id);
      if (res.success) {
        await loadMasterList();
      } else {
        alert(res.error || "Failed to delete master record.");
      }
    }
  };

  const totalStudents = students.length;
  const activeCount = students.filter((s) => s.isActive).length;
  const totalAssessmentsTaken = students.reduce(
    (acc, curr) => acc + curr.assessmentsCount,
    0,
  );
  const totalOccurrences = students.reduce(
    (acc, curr) => acc + curr.occurrencesCount,
    0,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-400">
            <i className="fas fa-users-cog text-xs" />
            <span>Institutional Governance · Student Registry</span>
          </div>
          <h1 className="font-academic mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Students Registry & Master List
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Official institutional master list, matriculation authentication
            records, and active student dossiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "REGISTERED" ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={orangeButton}
            >
              <i className="fas fa-user-plus" />
              <span>Enroll New Student</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSeedMaster}
                disabled={isPending}
                className={secondaryButton}
                title="Populate standard accredited KSITM records"
              >
                <i
                  className={`fas ${isPending ? "fa-circle-notch fa-spin" : "fa-magic"}`}
                />
                <span>Seed KSITM Master</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateMasterOpen(true)}
                className={orangeButton}
              >
                <i className="fas fa-plus" />
                <span>Add to Master List</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex border-b border-white/[0.08] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("REGISTERED")}
          className={`inline-flex items-center gap-2 border-b-2 pb-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "REGISTERED"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <i className="fas fa-user-graduate" />
          <span>Registered Students ({totalStudents})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("MASTER_LIST");
            loadMasterList();
          }}
          className={`inline-flex items-center gap-2 border-b-2 pb-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "MASTER_LIST"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <i className="fas fa-clipboard-check" />
          <span>Institutional Master List ({masterStats.totalMaster})</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <i className="fas fa-exclamation-circle text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "REGISTERED" ? (
        <>
          {/* KPI Matrix Strip */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Enrolled Students
            </span>
            <i className="fas fa-user-graduate text-purple-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {totalStudents}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Matriculated student profiles</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Active Accounts
            </span>
            <i className="fas fa-user-check text-emerald-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
            {activeCount}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">In good standing</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Assessment Attempts
            </span>
            <i className="fas fa-clipboard-check text-orange-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {totalAssessmentsTaken}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Completed examinations</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Academic Occurrences
            </span>
            <i className="fas fa-history text-cyan-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {totalOccurrences}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Logged milestones & observations</p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3.5 top-3.5 text-xs text-gray-500" />
            <input
              type="text"
              placeholder="Search by full name, registration number, or email…"
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
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l === "ALL" ? "All Levels" : l}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated</option>
          </select>

          <button type="submit" className={secondaryButton}>
            <span>Filter</span>
          </button>
        </form>
      </div>

      {/* High-Density Students Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <i className="fas fa-spinner fa-spin text-2xl text-purple-400 mb-2 block" />
          <span>Loading students registry…</span>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0c0c1e] p-10 text-center space-y-3">
          <i className="fas fa-user-slash text-gray-500 text-3xl" />
          <h3 className="text-sm font-bold text-white">No Matching Students Found</h3>
          <p className="text-xs text-gray-400">
            No students found matching your search and filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDepartment("ALL");
              setLevel("ALL");
              setStatus("ALL");
            }}
            className={secondaryButton}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c1e] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">Student Profile</th>
                  <th className="py-3 px-3">Registration No.</th>
                  <th className="py-3 px-3">Department & Level</th>
                  <th className="py-3 px-3 text-center">Assessments</th>
                  <th className="py-3 px-3 text-center">Occurrences</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {st.avatarUrl ? (
                          <img
                            src={st.avatarUrl}
                            alt={`${st.fullName} Passport`}
                            className="h-9 w-9 rounded-xl object-cover border-2 border-orange-500/40 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 text-orange-300 font-bold text-xs border border-orange-500/30 shrink-0">
                            {st.fullName[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-academic text-sm font-bold text-white hover:text-orange-400 cursor-pointer transition-colors" onClick={() => setDossierStudentId(st.id)}>
                            {st.fullName}
                          </div>
                          <div className="text-[11px] text-gray-400">{st.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 font-mono font-bold text-white text-xs">
                      {st.regNumber}
                    </td>

                    <td className="py-4 px-3">
                      <div className="text-white text-xs font-medium">{st.department || "General"}</div>
                      <div className="text-[10px] text-gray-400">{st.level || "Unspecified Level"}</div>
                    </td>

                    <td className="py-4 px-3 text-center font-mono font-bold text-orange-400">
                      <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 border border-orange-500/20">
                        {st.assessmentsCount} Tests
                      </span>
                    </td>

                    <td className="py-4 px-3 text-center font-mono font-bold text-cyan-400">
                      <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/20">
                        {st.occurrencesCount} Logs
                      </span>
                    </td>

                    <td className="py-4 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          st.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                        {st.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDossierStudentId(st.id)}
                          className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                          title="Open Full Academic Dossier & Records"
                        >
                          <i className="fas fa-folder-open text-xs" />
                          <span>Student File</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditStudent(st)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-all cursor-pointer"
                          title="Edit Student Information"
                        >
                          <i className="fas fa-pen" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(st.id, st.fullName)}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                          title="Deactivate Student"
                        >
                          <i className="fas fa-user-times" />
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
        </>
      ) : (
        <>
          {/* Master List KPI Matrix Strip */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className={cardStyle}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  Institutional Master Records
                </span>
                <i className="fas fa-id-card text-purple-400 text-sm" />
              </div>
              <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
                {masterStats.totalMaster}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Official KSITM school list</p>
            </div>

            <div className={cardStyle}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  Registered Students
                </span>
                <i className="fas fa-check-circle text-emerald-400 text-sm" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
                {masterStats.totalRegistered}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Online portal activated</p>
            </div>

            <div className={cardStyle}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  Pending Registration
                </span>
                <i className="fas fa-hourglass-half text-amber-400 text-sm" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-300 sm:text-3xl">
                {masterStats.totalPending}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Awaiting student sign up</p>
            </div>

            <div className={cardStyle}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  Portal Adoption Rate
                </span>
                <i className="fas fa-chart-line text-cyan-400 text-sm" />
              </div>
              <div className="mt-2 text-2xl font-black text-cyan-400 sm:text-3xl">
                {masterStats.totalMaster > 0
                  ? Math.round((masterStats.totalRegistered / masterStats.totalMaster) * 100)
                  : 0}
                %
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Of accredited student body</p>
            </div>
          </section>

          {/* Master List Filter and Search Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleMasterSearchSubmit} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-3.5 top-3.5 text-xs text-gray-500" />
                <input
                  type="text"
                  placeholder="Search master list by Reg No, First Name, Surname, or Department…"
                  value={masterSearch}
                  onChange={(e) => setMasterSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#090918] pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <select
                value={masterDept}
                onChange={(e) => setMasterDept(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Departments" : d}
                  </option>
                ))}
              </select>

              <select
                value={masterStatus}
                onChange={(e) => setMasterStatus(e.target.value as "ALL" | "REGISTERED" | "PENDING")}
                className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="REGISTERED">Registered Only</option>
                <option value="PENDING">Pending Registration</option>
              </select>

              <button type="submit" className={secondaryButton}>
                <i className="fas fa-filter" />
                <span>Filter</span>
              </button>
            </form>
          </div>

          {/* Master List Table */}
          {masterLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <i className="fas fa-circle-notch fa-spin text-3xl text-orange-500 mb-3" />
              <p className="text-sm">Loading KSITM institutional master records…</p>
            </div>
          ) : masterRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <i className="fas fa-clipboard-list text-4xl text-gray-500 mb-3" />
              <h3 className="text-base font-bold text-white">No Master Records Found</h3>
              <p className="mt-1 text-xs text-gray-400 max-w-md mx-auto">
                No institutional records matched your filter criteria. You can add enrolled students individually or seed standard KSITM records.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSeedMaster}
                  className={secondaryButton}
                >
                  <i className="fas fa-magic" />
                  <span>Seed KSITM Master Records</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMasterOpen(true)}
                  className={orangeButton}
                >
                  <i className="fas fa-plus" />
                  <span>Add First Student Record</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c1e]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-5 py-3.5">Registration Number</th>
                      <th className="px-5 py-3.5">Official Student Name</th>
                      <th className="px-5 py-3.5">Department & Level</th>
                      <th className="px-5 py-3.5 text-center">Portal Authentication</th>
                      <th className="px-5 py-3.5">Contact / Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {masterRecords.map((r) => (
                      <tr
                        key={r.id}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs text-purple-300 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1">
                            {r.regNumber}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-white text-xs sm:text-sm">
                            {r.fullName}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            First: <span className="text-gray-300 font-semibold">{r.firstName}</span> · Surname: <span className="text-gray-300 font-semibold">{r.lastName}</span>
                            {r.middleName ? ` · Middle: ${r.middleName}` : ""}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-300">
                            {r.department || "General"}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium">
                            {r.level || "Enrolled"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {r.isRegistered ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                              <i className="fas fa-check-circle" />
                              <span>Registered & Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                              <i className="fas fa-hourglass-half" />
                              <span>Pending Sign Up</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-300">
                            {r.phone || "No phone"}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Added {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.studentProfileId && (
                              <button
                                type="button"
                                onClick={() => setDossierStudentId(r.studentProfileId)}
                                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                                title="Open Student File / Dossier"
                              >
                                <i className="fas fa-folder-open text-xs" />
                                <span>Student File</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditMasterRecord(r)}
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-all cursor-pointer"
                              title="Edit Master Record"
                            >
                              <i className="fas fa-pen" />
                            </button>

                            {!r.isRegistered && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMaster(r.id, r.fullName)}
                                className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                title="Delete Unregistered Master Record"
                              >
                                <i className="fas fa-trash-alt" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Master Record Modal */}
      {createMasterOpen && (
        <CreateMasterRecordModal
          onClose={() => setCreateMasterOpen(false)}
          onCreated={() => {
            setCreateMasterOpen(false);
            loadMasterList();
          }}
        />
      )}

      {/* Edit Master Record Modal */}
      {editMasterRecord && (
        <EditMasterRecordModal
          record={editMasterRecord}
          onClose={() => setEditMasterRecord(null)}
          onUpdated={() => {
            setEditMasterRecord(null);
            loadMasterList();
          }}
        />
      )}

      {/* Create Student Modal */}
      {createOpen && (
        <CreateStudentModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            loadStudents();
          }}
        />
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onUpdated={() => {
            setEditStudent(null);
            loadStudents();
          }}
        />
      )}

      {/* Student Academic Dossier Modal */}
      {dossierStudentId && (
        <StudentDossierModal
          studentId={dossierStudentId}
          onClose={() => setDossierStudentId(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// MODAL: CREATE STUDENT
// ============================================================
function CreateStudentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [level, setLevel] = useState("ND I");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("Ksitm@2026");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!fullName.trim() || !regNumber.trim() || !email.trim()) {
      setError("Full name, registration number, and institutional email are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await createStudentAction({
        fullName,
        regNumber,
        email,
        department,
        level,
        phone,
        password,
        avatarUrl,
      });
      if (!res.success) throw new Error(res.error);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
              Registry Enrollment Gateway
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl">
              Enroll New Student
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

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-300">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Amina Mustapha Lawal"
                className={inputStyle}
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300">Registration Number *</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. KSITM/ND/CS/2024/042"
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-300">Institutional Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. a.mustapha@student.ksitm.edu.ng"
                className={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-300">Academic Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputStyle}
              >
                {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                  <option key={d} value={d}>
                    {d}
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
                {LEVELS.filter((l) => l !== "ALL").map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Initial Temporary Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputStyle}
            />
            <p className="text-[11px] text-gray-500 mt-1">Student can change this upon initial login.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Student Passport Photograph URL</span>
              <span className="text-[10px] text-gray-500">Official student identity photo link</span>
            </label>
            <div className="mt-1 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Passport preview"
                  className="h-11 w-11 rounded-xl object-cover border-2 border-orange-500/40 shrink-0"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-white/20 text-gray-500 text-xs bg-white/[0.02]">
                  <i className="fas fa-camera text-xs" />
                  <span className="text-[8px] font-mono mt-0.5">Passport</span>
                </div>
              )}
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... (e.g. passport photo URL)"
                className={inputStyle}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={orangeButton}
          >
            {saving ? "Registering…" : "Enroll Student"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: EDIT STUDENT
// ============================================================
function EditStudentModal({
  student,
  onClose,
  onUpdated,
}: {
  student: StudentTableRow;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [fullName, setFullName] = useState(student.fullName);
  const [regNumber, setRegNumber] = useState(student.regNumber);
  const [department, setDepartment] = useState(student.department || "Computer Science");
  const [level, setLevel] = useState(student.level || "ND I");
  const [phone, setPhone] = useState(student.phone || "");
  const [isActive, setIsActive] = useState(student.isActive);
  const [avatarUrl, setAvatarUrl] = useState(student.avatarUrl || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!fullName.trim() || !regNumber.trim()) {
      setError("Full name and registration number are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await updateStudentAction(student.id, {
        fullName,
        regNumber,
        department,
        level,
        phone,
        isActive,
        avatarUrl,
      });
      if (!res.success) throw new Error(res.error);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
              Registry Update
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl">
              Edit Student Record
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

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Registration Number</label>
            <input
              type="text"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-300">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputStyle}
              >
                {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputStyle}
              >
                {LEVELS.filter((l) => l !== "ALL").map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Student Passport Photograph URL</span>
              <span className="text-[10px] text-gray-500">Official student identity photo link</span>
            </label>
            <div className="mt-1 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Passport preview"
                  className="h-11 w-11 rounded-xl object-cover border-2 border-orange-500/40 shrink-0"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-white/20 text-gray-500 text-xs bg-white/[0.02]">
                  <i className="fas fa-camera text-xs" />
                  <span className="text-[8px] font-mono mt-0.5">Passport</span>
                </div>
              )}
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... (e.g. passport photo URL)"
                className={inputStyle}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-white/20 text-orange-500 focus:ring-0"
            />
            <span>Active Student Account</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={orangeButton}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// UNIVERSAL CLICKABLE LINKS & ATTACHMENT RENDERER
// ============================================================
function FormattedTextWithLinks({ content }: { content: string }) {
  if (!content) return null;

  // Check if content matches document file format: [Document: <label>]\n<url>\n?<note>?
  const docMatch = content.match(
    /^\[Document:\s*([^\]]+)\]\s*\n\s*(https?:\/\/[^\s]+)(?:\s*\n([\s\S]*))?$/,
  );
  if (docMatch) {
    const [, docName, docUrl, docNote] = docMatch;
    return (
      <div className="space-y-2 pt-0.5">
        {docNote && (
          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
            <InlineLinks text={docNote} />
          </p>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:scale-[1.01] shadow-sm cursor-pointer"
            title="Access Verified Document Attachment"
          >
            <i className="fas fa-file-alt text-cyan-400" />
            <span className="font-mono">{docName}</span>
            <i className="fas fa-external-link-alt text-[10px] opacity-75" />
          </a>
        </div>
      </div>
    );
  }

  // Pure single URL
  const trimmed = content.trim();
  if (/^https?:\/\/[^\s]+$/.test(trimmed)) {
    return (
      <div className="pt-1">
        <a
          href={trimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 text-xs font-semibold text-orange-400 transition-all break-all hover:scale-[1.01] shadow-sm cursor-pointer"
          title="Access External Web Resource"
        >
          <i className="fas fa-link text-xs shrink-0" />
          <span className="break-all">{trimmed}</span>
          <i className="fas fa-external-link-alt text-[10px] opacity-75 shrink-0" />
        </a>
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
      <InlineLinks text={content} />
    </div>
  );
}

function InlineLinks({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-2 break-all transition-colors"
            >
              <i className="fas fa-external-link-alt text-[9px] opacity-75 shrink-0" />
              <span>{part}</span>
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ============================================================
// MODAL: STUDENT ACADEMIC DOSSIER & OCCURRENCES LEDGER
// ============================================================
function StudentDossierModal({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<StudentDossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "assessments" | "modules" | "occurrences">("overview");

  // Occurrence logger state with polymorphic switch nav (Text | Link | File)
  type OccurrenceDetailMode = "text" | "link" | "file";
  const [detailMode, setDetailMode] = useState<OccurrenceDetailMode>("text");
  const [logTitle, setLogTitle] = useState("");
  const [textDetail, setTextDetail] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [logCategory, setLogCategory] = useState<
    "ACHIEVEMENT" | "IMPROVEMENT" | "COUNSELING_NOTE" | "OCCURRENCE" | "ASSESSMENT_RESULT" | "OTHER"
  >("ACHIEVEMENT");
  const [logging, setLogging] = useState(false);

  const loadDossier = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentDossierAction(studentId);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load student dossier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void getStudentDossierAction(studentId)
      .then((res) => {
        if (active) {
          setData(res);
          setError("");
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load student dossier.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [studentId]);

  const handleAddOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) return;

    let computedDesc = "";
    if (detailMode === "text") {
      if (!textDetail.trim()) return;
      computedDesc = textDetail.trim();
    } else if (detailMode === "link") {
      if (!linkUrl.trim()) return;
      computedDesc = linkNote.trim()
        ? `${linkNote.trim()}\n${linkUrl.trim()}`
        : linkUrl.trim();
    } else if (detailMode === "file") {
      if (!fileUrl.trim()) return;
      const fileLabel = fileName.trim() || "Attached Document";
      computedDesc = `[Document: ${fileLabel}]\n${fileUrl.trim()}${
        fileNote.trim() ? `\n${fileNote.trim()}` : ""
      }`;
    }

    if (!computedDesc.trim()) return;

    setLogging(true);
    try {
      const res = await logStudentOccurrenceAction(studentId, {
        category: logCategory,
        title: logTitle,
        description: computedDesc,
      });
      if (res.success) {
        setLogTitle("");
        setTextDetail("");
        setLinkUrl("");
        setLinkNote("");
        setFileUrl("");
        setFileName("");
        setFileNote("");
        await loadDossier();
      }
    } catch {
      alert("Failed to log occurrence.");
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Sticky Header with Proportionate Space and Prominent Close Button */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block truncate">
              Student Academic Dossier & Career Records
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl truncate">
              {data?.profile.fullName || "Student File"} ({data?.profile.regNumber || "…"})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-all shadow-sm cursor-pointer shrink-0"
            title="Close dossier"
          >
            <i className="fas fa-times text-sm text-orange-400" />
            <span>Close</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">
            <i className="fas fa-spinner fa-spin text-2xl text-purple-400 mb-2 block" />
            <span>Opening student academic file…</span>
          </div>
        ) : error || !data ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
            {error || "Unable to locate student file."}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student Profile Quick Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  {data.profile.avatarUrl ? (
                    <img
                      src={data.profile.avatarUrl}
                      alt={`${data.profile.fullName} Passport`}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-orange-500/50 shadow-xl ring-2 ring-purple-500/20"
                    />
                  ) : (
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/40 to-black/80 border-2 border-dashed border-orange-500/40 text-orange-300 shadow-xl">
                      <i className="fas fa-id-badge text-xl mb-0.5 text-orange-400" />
                      <span className="text-[9px] uppercase font-mono tracking-wider text-gray-300">Passport</span>
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 rounded-md text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase shadow ${data.profile.isActive ? "bg-emerald-500/90 text-black" : "bg-red-500/90 text-white"}`}>
                    {data.profile.isActive ? "Active" : "Archived"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-mono text-purple-300 mb-1">
                    <i className="fas fa-graduation-cap text-[10px]" />
                    <span>Student Academic Dossier</span>
                  </div>
                  <h3 className="font-academic text-lg sm:text-xl font-bold text-white truncate">
                    {data.profile.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                    <span className="font-mono text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{data.profile.regNumber}</span>
                    <span>·</span>
                    <span>{data.profile.department}</span>
                    <span>·</span>
                    <span className="text-orange-400 font-semibold">{data.profile.level}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span><i className="fas fa-envelope text-[10px] mr-1 text-gray-500" />{data.profile.email}</span>
                    {data.profile.phone && <span><i className="fas fa-phone text-[10px] mr-1 text-gray-500" />{data.profile.phone}</span>}
                  </div>
                </div>
              </div>

              {data.profile.linkedInUrl && (
                <a
                  href={data.profile.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all self-start sm:self-auto shrink-0"
                >
                  <i className="fab fa-linkedin" />
                  <span>Student Profile Link</span>
                </a>
              )}
            </div>

            {/* Live Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5">
                <span className="text-[10px] font-mono uppercase text-gray-400">Assessments Taken</span>
                <div className="text-xl font-black text-white mt-1">{data.metrics.totalAssessments}</div>
                <span className="text-[10px] text-emerald-400">{data.metrics.passedAssessments} Passed</span>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5">
                <span className="text-[10px] font-mono uppercase text-gray-400">Average Score</span>
                <div className="text-xl font-black text-orange-400 mt-1">{data.metrics.averageScore}%</div>
                <span className="text-[10px] text-gray-500">Institutional index</span>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5">
                <span className="text-[10px] font-mono uppercase text-gray-400">Completed Modules</span>
                <div className="text-xl font-black text-cyan-400 mt-1">{data.metrics.completedModules}</div>
                <span className="text-[10px] text-gray-500">Learning milestones</span>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5">
                <span className="text-[10px] font-mono uppercase text-gray-400">Logged Milestones</span>
                <div className="text-xl font-black text-purple-400 mt-1">{data.metrics.totalOccurrences}</div>
                <span className="text-[10px] text-gray-500">Official file notes</span>
              </div>
            </div>

            {/* Navigation Tabs inside Dossier */}
            <div className="flex border-b border-white/[0.08] gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`pb-2.5 text-xs font-bold transition-all ${
                  activeTab === "overview"
                    ? "border-b-2 border-orange-500 text-orange-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Overview & Summary
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assessments")}
                className={`pb-2.5 text-xs font-bold transition-all ${
                  activeTab === "assessments"
                    ? "border-b-2 border-orange-500 text-orange-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Assessments Ledger ({data.assessments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("occurrences")}
                className={`pb-2.5 text-xs font-bold transition-all ${
                  activeTab === "occurrences"
                    ? "border-b-2 border-orange-500 text-orange-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Occurrences & Milestones ({data.occurrences.length})
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c1e] p-4 space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-orange-400">
                    Student Improvement & Academic Progress Trajectory
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {data.metrics.totalAssessments > 0
                      ? `Student has attempted ${data.metrics.totalAssessments} formal assessment(s) with an institutional pass rate benchmark of ${Math.round((data.metrics.passedAssessments / data.metrics.totalAssessments) * 100)}%. Recorded average diagnostic score is ${data.metrics.averageScore}%.`
                      : "Student has not yet completed formal job readiness assessments."}
                  </p>
                </div>

                {/* Consultations Summary */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c1e] p-4 space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-purple-400">
                    Advisory Appointments & Consultations
                  </h4>
                  {data.appointments.length === 0 ? (
                    <p className="text-xs text-gray-500">No scheduled consultations on record.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.appointments.map((ap) => (
                        <div key={ap.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2.5 text-xs">
                          <div>
                            <span className="font-bold text-white">{ap.staffName}</span>
                            <span className="text-gray-500 ml-2">· {ap.meetingLocation}</span>
                          </div>
                          <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-300">
                            {ap.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ASSESSMENTS LEDGER */}
            {activeTab === "assessments" && (
              <div className="space-y-3">
                {data.assessments.length === 0 ? (
                  <p className="py-8 text-center text-xs text-gray-500">No assessment attempts recorded.</p>
                ) : (
                  <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#0c0c1e]">
                    {data.assessments.map((a) => (
                      <div key={a.attemptId} className="flex items-center justify-between p-4">
                        <div>
                          <div className="font-bold text-white text-xs">{a.assessmentTitle}</div>
                          <div className="text-[10px] text-gray-400">{a.category} · Benchmark: {a.passingScore}%</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-black text-white">
                            {a.score !== null ? `${a.score}%` : "In Progress"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              a.passed
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-red-500/10 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {a.passed ? "Passed" : "Needs Review"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: OCCURRENCES & MILESTONES */}
            {activeTab === "occurrences" && (
              <div className="space-y-6">
                {/* Form to log new occurrence with Polymorphic Switcher Nav */}
                <form onSubmit={handleAddOccurrence} className="rounded-xl border border-purple-500/30 bg-purple-500/[0.04] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
                    <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <i className="fas fa-pen-alt text-xs text-orange-400" />
                      <span>Log Official Occurrence, Milestone or Observation</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Academic Dossier Ledger</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-gray-300 font-semibold mb-1 block">Occurrence Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Attended CV Masterclass, Mock Interview Observation, Verified Certificate"
                        value={logTitle}
                        onChange={(e) => setLogTitle(e.target.value)}
                        className={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-300 font-semibold mb-1 block">Record Category *</label>
                      <select
                        value={logCategory}
                        onChange={(e) =>
                          setLogCategory(
                            e.target.value as
                              | "ACHIEVEMENT"
                              | "IMPROVEMENT"
                              | "COUNSELING_NOTE"
                              | "OCCURRENCE"
                              | "ASSESSMENT_RESULT"
                              | "OTHER",
                          )
                        }
                        className={inputStyle}
                      >
                        <option value="ACHIEVEMENT">Achievement</option>
                        <option value="IMPROVEMENT">Improvement Milestone</option>
                        <option value="COUNSELING_NOTE">Counseling Note</option>
                        <option value="ASSESSMENT_RESULT">Assessment Result</option>
                        <option value="OCCURRENCE">General Occurrence</option>
                        <option value="OTHER">Others</option>
                      </select>
                    </div>
                  </div>

                  {/* Polymorphic Switcher Nav */}
                  <div className="rounded-xl border border-white/10 bg-[#080816] p-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
                        <i className="fas fa-sliders-h text-orange-400 text-xs" />
                        <span>Detail Input Format:</span>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-xl bg-black/60 p-1 border border-white/10 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setDetailMode("text")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            detailMode === "text"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold shadow-sm"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <i className="fas fa-align-left text-xs" />
                          <span>Text Note</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailMode("link")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            detailMode === "link"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold shadow-sm"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <i className="fas fa-link text-xs" />
                          <span>Web Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailMode("file")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            detailMode === "file"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold shadow-sm"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <i className="fas fa-file-upload text-xs" />
                          <span>Document / File</span>
                        </button>
                      </div>
                    </div>

                    {detailMode === "text" && (
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block">Observation / Performance Details:</label>
                        <textarea
                          rows={3}
                          placeholder="Provide details of the academic observation, student performance, or intervention…"
                          value={textDetail}
                          onChange={(e) => setTextDetail(e.target.value)}
                          className={`${inputStyle} resize-none`}
                          required
                        />
                      </div>
                    )}

                    {detailMode === "link" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-orange-400 font-semibold mb-1 block">Web Link URL *</label>
                          <input
                            type="url"
                            placeholder="https://... (e.g. Credly badge, GitHub repo, Drive folder)"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className={inputStyle}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-400 mb-1 block">Context / Label (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Verified Capstone Project Repository"
                            value={linkNote}
                            onChange={(e) => setLinkNote(e.target.value)}
                            className={inputStyle}
                          />
                        </div>
                      </div>
                    )}

                    {detailMode === "file" && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-cyan-400 font-semibold mb-1 block">Document / File URL *</label>
                            <input
                              type="url"
                              placeholder="https://... (e.g. cloud document link, file share URL)"
                              value={fileUrl}
                              onChange={(e) => setFileUrl(e.target.value)}
                              className={inputStyle}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-400 mb-1 block">Document Title / File Name</label>
                            <input
                              type="text"
                              placeholder="e.g. KSITM_Certificate_ND2.pdf"
                              value={fileName}
                              onChange={(e) => setFileName(e.target.value)}
                              className={inputStyle}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-400 mb-1 block">Verification Directive / Brief Note (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Verified official certificate issuance from Registrar"
                            value={fileNote}
                            onChange={(e) => setFileNote(e.target.value)}
                            className={inputStyle}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={logging}
                      className={orangeButton}
                    >
                      <i className="fas fa-check-circle text-xs" />
                      <span>{logging ? "Recording…" : "Log into Student File"}</span>
                    </button>
                  </div>
                </form>

                {/* List of occurrences with Clickable Universal Links */}
                <div className="space-y-3">
                  {data.occurrences.length === 0 ? (
                    <p className="py-6 text-center text-xs text-gray-500">No occurrences logged yet.</p>
                  ) : (
                    data.occurrences.map((occ) => (
                      <div
                        key={occ.id}
                        className="rounded-xl border border-white/[0.06] bg-[#0c0c1e] p-4 space-y-2 hover:border-white/15 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-300">
                              {occ.category.replace("_", " ")}
                            </span>
                            <span className="font-bold text-white text-xs">{occ.title}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 shrink-0 font-mono">
                            {new Date(occ.occurrenceDate).toLocaleDateString()}
                          </span>
                        </div>
                        <FormattedTextWithLinks content={occ.description} />
                        {occ.actionTaken && (
                          <div className="rounded-lg bg-black/40 p-2.5 border border-white/[0.04] text-[11px] text-gray-300">
                            <span className="text-orange-400 font-semibold mr-1">Action Taken:</span>
                            <FormattedTextWithLinks content={occ.actionTaken} />
                          </div>
                        )}
                        <div className="text-[10px] text-gray-500 pt-0.5">Logged by: <span className="text-gray-400 font-semibold">{occ.actorName}</span></div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MODAL: CREATE MASTER RECORD
// ============================================================
function CreateMasterRecordModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [regNumber, setRegNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [department, setDepartment] = useState("Computer Software Engineering");
  const [level, setLevel] = useState("National Diploma I (ND 1)");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!regNumber.trim() || !firstName.trim() || !lastName.trim()) {
      setError(
        "Registration number, First Name, and Second Name / Surname are required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await createMasterRecordAction({
        regNumber,
        firstName,
        lastName,
        middleName: middleName || undefined,
        department,
        level,
        phone: phone || undefined,
      });

      if (res.success) {
        onCreated();
      } else {
        setError(res.error || "Failed to create master record.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6">
      <div className="my-8 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e24] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0e0e24] px-6 py-4">
          <div>
            <h2 className="font-academic text-base font-bold text-white">
              Add Student to Institutional Master List
            </h2>
            <p className="text-xs text-gray-400">
              Accredited enrollment record for matriculation authentication
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Registration Number <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. KSITM/ND/STE/24/001"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
              className={`${inputStyle} uppercase`}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                First Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Amina"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputStyle}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Second Name / Surname <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Yusuf"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputStyle}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Middle Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bello"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputStyle}
              >
                {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputStyle}
              >
                {LEVELS.filter((l) => l !== "ALL").map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="e.g. +234 802 111 2201"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputStyle}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={orangeButton}
          >
            {saving ? "Saving Record…" : "Add to Master List"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: EDIT MASTER RECORD
// ============================================================
function EditMasterRecordModal({
  record,
  onClose,
  onUpdated,
}: {
  record: MasterListTableRow;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [regNumber, setRegNumber] = useState(record.regNumber);
  const [firstName, setFirstName] = useState(record.firstName);
  const [lastName, setLastName] = useState(record.lastName);
  const [middleName, setMiddleName] = useState(record.middleName || "");
  const [department, setDepartment] = useState(
    record.department || "Computer Software Engineering",
  );
  const [level, setLevel] = useState(
    record.level || "National Diploma I (ND 1)",
  );
  const [phone, setPhone] = useState(record.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!regNumber.trim() || !firstName.trim() || !lastName.trim()) {
      setError(
        "Registration number, First Name, and Second Name / Surname are required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await updateMasterRecordAction(record.id, {
        regNumber,
        firstName,
        lastName,
        middleName: middleName || undefined,
        department,
        level,
        phone: phone || undefined,
      });

      if (res.success) {
        onUpdated();
      } else {
        setError(res.error || "Failed to update master record.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6">
      <div className="my-8 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e24] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0e0e24] px-6 py-4">
          <div>
            <h2 className="font-academic text-base font-bold text-white">
              Edit Institutional Master Record
            </h2>
            <p className="text-xs text-gray-400">
              {record.regNumber} ·{" "}
              {record.isRegistered
                ? "Registered Student"
                : "Pending Student Sign Up"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Registration Number <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
              className={`${inputStyle} uppercase`}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                First Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputStyle}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Second Name / Surname <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputStyle}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Middle Name (Optional)
            </label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputStyle}
              >
                {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputStyle}
              >
                {LEVELS.filter((l) => l !== "ALL").map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputStyle}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={orangeButton}
          >
            {saving ? "Saving Changes…" : "Update Master Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
