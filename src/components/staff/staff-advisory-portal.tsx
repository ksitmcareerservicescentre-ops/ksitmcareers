/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import {
  getStudentDossierAction,
  type StudentDossierData,
} from "@/actions/students";
import { completeAppointmentWithNotesAction } from "@/actions/appointments";
import { ProfileSettingsModal } from "@/components/profile/profile-settings-modal";
import { VirtualInternshipWorkspace } from "@/components/admin/virtual-internship-workspace";
import { JobBoardWorkspace } from "@/components/admin/job-board-workspace";
import { EmployerEngagementWorkspace } from "@/components/admin/employer-engagement-workspace";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export type AssignedStudentAppointment = {
  appointmentId: string;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
  studentDepartment: string | null;
  studentLevel: string | null;
  studentPhone: string | null;
  studentEmail: string;
  status: string;
  scheduledStart: Date;
  meetingLocation: string;
  notes: string | null;
};

export function StaffAdvisoryPortal({
  officer,
  assignedAppointments,
}: {
  officer: {
    fullName: string;
    staffCode: string | null;
    designation: string | null;
    email: string;
  };
  assignedAppointments: AssignedStudentAppointment[];
}) {
  const [portalTab, setPortalTab] = useState<
    "ADVISORY" | "INTERNSHIPS" | "JOBS" | "EMPLOYERS"
  >("ADVISORY");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dossierStudentId, setDossierStudentId] = useState<string | null>(null);
  const [assessingItem, setAssessingItem] = useState<AssignedStudentAppointment | null>(null);
  const [assessmentNote, setAssessmentNote] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [statusUpdate, setStatusUpdate] = useState<"COMPLETED" | "NO_SHOW" | "CANCELLED">("COMPLETED");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Unique assigned students
  const uniqueStudentMap = new Map<string, AssignedStudentAppointment>();
  assignedAppointments.forEach((a) => {
    if (!uniqueStudentMap.has(a.studentId)) uniqueStudentMap.set(a.studentId, a);
  });
  const uniqueStudents = Array.from(uniqueStudentMap.values());

  const completedCount = assignedAppointments.filter((a) => a.status === "COMPLETED").length;
  const pendingOrScheduledCount = assignedAppointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "RESCHEDULED",
  ).length;

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessingItem || !assessmentNote.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await completeAppointmentWithNotesAction(assessingItem.appointmentId, {
        status: statusUpdate,
        assessmentNote,
        actionPlan,
      });

      if (!res.success) throw new Error(res.error);
      setSuccessMsg("Assessment recorded and student academic dossier updated!");
      setAssessingItem(null);
      setAssessmentNote("");
      setActionPlan("");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record student assessment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      {/* Officer Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#FF7F24]/10 border border-[#FF7F24]/30 text-[#FF7F24] flex items-center justify-center font-bold text-sm">
              K
            </span>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block">
                KSITM Careers
              </span>
              <span className="text-[10px] text-[#FF7F24] font-bold uppercase tracking-widest block -mt-1">
                Career Officer Advisory Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors cursor-pointer"
          >
            <i className="fas fa-user-circle text-orange-400" />
            <span className="hidden sm:inline">My Profile & Security</span>
          </button>

          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-white">{officer.fullName}</div>
            <div className="text-[10px] text-[#FF7F24] font-mono">
              {officer.staffCode || "STAFF"} • {officer.designation || "Career Staff"}
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="py-1.5 px-3 rounded-lg border border-white/15 hover:border-red-500/50 hover:bg-red-500/10 text-gray-300 hover:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Welcome Banner */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#40297B]/30 via-[#101023] to-[#FF7F24]/10 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#FF7F24]/10 border border-[#FF7F24]/30 text-[#FF7F24] text-[11px] font-bold uppercase tracking-wider inline-block mb-2">
                Assigned Student Advisory Hub
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {officer.fullName}
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-2xl">
                Access your assigned students, inspect their complete academic files, and log diagnostic assessments to update their institutional dossiers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className={orangeButton}
            >
              <i className="fas fa-user-edit" />
              <span>Update My Profile & Bio</span>
            </button>
          </div>
        </section>

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
            <i className="fas fa-check-circle text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Assigned Students
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {uniqueStudents.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Under your advisory care</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Scheduled Sessions
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FF7F24] mt-1">
              {pendingOrScheduledCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Upcoming appointments</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Completed Assessments
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              {completedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Assessed and logged</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Advisory Designation
            </div>
            <div className="text-base sm:text-lg font-bold text-purple-400 mt-1 truncate">
              {officer.designation || "Career Staff"}
            </div>
            <p className="text-xs text-gray-500 mt-1">{officer.staffCode || "KSITM STAFF"}</p>
          </div>
        </section>

        {/* Staff Portal Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-3 sm:gap-6 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setPortalTab("ADVISORY")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              portalTab === "ADVISORY"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-calendar-check" />
            <span>Assigned Consultations & Roster</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">
              {assignedAppointments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPortalTab("INTERNSHIPS")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              portalTab === "INTERNSHIPS"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-laptop-code" />
            <span>Virtual Internships & Reviews</span>
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400">
              Workspace
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPortalTab("JOBS")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              portalTab === "JOBS"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-briefcase" />
            <span>Job Board & Vacancies</span>
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-400">
              Opportunities
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPortalTab("EMPLOYERS")}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              portalTab === "EMPLOYERS"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-handshake" />
            <span>Employer Engagement & Supervision</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Matrix
            </span>
          </button>
        </div>

        {portalTab === "INTERNSHIPS" ? (
          <VirtualInternshipWorkspace />
        ) : portalTab === "JOBS" ? (
          <JobBoardWorkspace />
        ) : portalTab === "EMPLOYERS" ? (
          <EmployerEngagementWorkspace />
        ) : (
          /* Assigned Students Roster */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  My Assigned Students & Scheduled Consultations
                </h2>
                <p className="text-gray-400 text-xs">
                  You have exclusive advisory access to review files and update dossiers for these assigned students.
                </p>
              </div>
            </div>

          <div className="bg-[#101023] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {assignedAppointments.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                <i className="fas fa-user-clock text-3xl text-gray-600 block mb-2" />
                <p className="text-sm font-bold text-white">No Assigned Students Yet</p>
                <p>When the Super Administrator assigns consultation requests to your calendar, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">Student Profile</th>
                      <th className="px-6 py-4">Reg Number</th>
                      <th className="px-6 py-4">Department & Level</th>
                      <th className="px-6 py-4">Appointment Schedule</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {assignedAppointments.map((st) => (
                      <tr key={st.appointmentId} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{st.studentName}</div>
                          <div className="text-[11px] text-gray-400">{st.studentEmail}</div>
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-[#FF7F24]">
                          {st.studentRegNumber}
                        </td>

                        <td className="px-6 py-4">
                          <div>{st.studentDepartment || "General"}</div>
                          <div className="text-gray-500">{st.studentLevel || "ND"}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">
                            <i className="fas fa-clock mr-1 text-orange-400 text-[10px]" />
                            {new Date(st.scheduledStart).toLocaleDateString()} at{" "}
                            {new Date(st.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-gray-500 text-[11px]">{st.meetingLocation}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              st.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {st.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDossierStudentId(st.studentId)}
                              className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300 hover:bg-purple-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                              title="Access Student File"
                            >
                              <i className="fas fa-folder-open text-xs" />
                              <span>Student File</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAssessingItem(st)}
                              className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-black transition-all cursor-pointer flex items-center gap-1"
                              title="Update File & Record Assessment"
                            >
                              <i className="fas fa-pen-alt text-xs" />
                              <span>Assess Student</span>
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
        </section>
      )}
      </main>

      {/* Profile & Security Settings Modal */}
      {profileModalOpen && (
        <ProfileSettingsModal onClose={() => setProfileModalOpen(false)} />
      )}

      {/* Student Dossier Modal */}
      {dossierStudentId && (
        <StaffStudentDossierModal
          studentId={dossierStudentId}
          onClose={() => setDossierStudentId(null)}
        />
      )}

      {/* Assess Student Modal */}
      {assessingItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
          <div className="relative my-4 sm:my-8 w-full max-w-xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
            <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
                  Staff Assessment Diagnostic
                </span>
                <h2 className="font-academic text-xl font-bold text-white sm:text-2xl">
                  Assess Student & Update File
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAssessingItem(null)}
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

            <div className="rounded-xl border border-white/[0.08] bg-[#0c0c1e] p-3 text-xs">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Target Student</span>
              <div className="text-sm font-bold text-white">{assessingItem.studentName} ({assessingItem.studentRegNumber})</div>
              <div className="text-gray-400 text-[11px] mt-0.5">{assessingItem.studentDepartment} · {assessingItem.studentLevel}</div>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300">Consultation Session Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value as "COMPLETED" | "NO_SHOW" | "CANCELLED")}
                  className={inputStyle}
                >
                  <option value="COMPLETED">Session Completed & Attended</option>
                  <option value="NO_SHOW">Student No-Show</option>
                  <option value="CANCELLED">Session Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">
                  Staff Assessment Note & Diagnostic Observation *
                </label>
                <textarea
                  rows={4}
                  value={assessmentNote}
                  onChange={(e) => setAssessmentNote(e.target.value)}
                  placeholder="Record your professional assessment of the student. This observation automatically writes to their official Academic Dossier."
                  className={`${inputStyle} resize-none`}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">Milestone Directives / Action Plan</label>
                <input
                  type="text"
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="e.g. Recommended for AI Assistant activation; rewrite ATS summary."
                  className={inputStyle}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
                <button type="button" onClick={() => setAssessingItem(null)} className={secondaryButton}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={orangeButton}
                >
                  {saving ? "Updating File…" : "Save Assessment to File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffStudentDossierModal({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<StudentDossierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getStudentDossierAction(studentId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
              Student Academic Dossier & Records
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl">
              {data?.profile?.fullName || "Student File"}
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

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">Loading student file…</div>
        ) : !data ? (
          <div className="text-center text-xs text-gray-500">Could not locate student records.</div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0c1e] p-4 flex items-center gap-3.5">
              <div className="relative shrink-0">
                {data.profile.avatarUrl ? (
                  <img
                    src={data.profile.avatarUrl}
                    alt={`${data.profile.fullName} Passport`}
                    className="h-14 w-14 rounded-xl object-cover border-2 border-orange-500/40 shadow-md"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-purple-900/40 to-black/80 border-2 border-dashed border-orange-500/40 text-orange-300">
                    <i className="fas fa-id-badge text-lg mb-0.5 text-orange-400" />
                    <span className="text-[8px] uppercase font-mono">Passport</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white font-bold text-sm truncate">{data.profile.fullName}</div>
                <div className="font-mono text-purple-300 text-xs font-semibold mt-0.5">{data.profile.regNumber}</div>
                <div className="text-gray-400 text-[11px] mt-0.5">{data.profile.department} · {data.profile.level}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-black/40 p-3 border border-white/[0.06]">
                <span className="text-[10px] text-gray-500">Assessments</span>
                <div className="text-base font-bold text-white mt-1">{data.metrics.totalAssessments}</div>
              </div>
              <div className="rounded-xl bg-black/40 p-3 border border-white/[0.06]">
                <span className="text-[10px] text-gray-500">Average Score</span>
                <div className="text-base font-bold text-orange-400 mt-1">{data.metrics.averageScore}%</div>
              </div>
              <div className="rounded-xl bg-black/40 p-3 border border-white/[0.06]">
                <span className="text-[10px] text-gray-500">File Milestones</span>
                <div className="text-base font-bold text-purple-400 mt-1">{data.metrics.totalOccurrences}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-mono text-purple-400 uppercase font-bold text-xs">Occurrences Ledger</h4>
              {data.occurrences.length === 0 ? (
                <p className="text-gray-500 py-3">No occurrences recorded yet.</p>
              ) : (
                data.occurrences.map((o) => (
                  <div key={o.id} className="rounded-lg bg-white/[0.02] p-3 border border-white/[0.04] space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>{o.title}</span>
                      <span className="text-gray-500 text-[10px]">{new Date(o.occurrenceDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-400 text-[11px] leading-relaxed break-words">
                      {o.description.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
                        /^https?:\/\//.test(part) ? (
                          <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-2 break-all"
                          >
                            <i className="fas fa-external-link-alt text-[9px] opacity-75" />
                            <span>{part}</span>
                          </a>
                        ) : (
                          <span key={i}>{part}</span>
                        ),
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500">Logged by: {o.actorName}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
