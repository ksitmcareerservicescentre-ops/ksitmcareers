/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import {
  listSchedulerAppointmentsAction,
  scheduleAndAssignAppointmentAction,
  completeAppointmentWithNotesAction,
  type AppointmentItem,
} from "@/actions/appointments";
import { getStudentDossierAction, type StudentDossierData } from "@/actions/students";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const cardStyle =
  "rounded-2xl border border-white/[0.08] bg-[#0c0c1e]/80 p-5 backdrop-blur-sm transition-all hover:border-white/20";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

type StaffOption = {
  id: string;
  fullName: string;
  designation?: string | null;
};

export function AppointmentSchedulerWorkspace({
  officers = [],
}: {
  officers?: StaffOption[];
}) {
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "completed">("pending");
  const [data, setData] = useState<{
    pending: AppointmentItem[];
    active: AppointmentItem[];
    completed: AppointmentItem[];
  }>({ pending: [], active: [], completed: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [schedulingItem, setSchedulingItem] = useState<AppointmentItem | null>(null);
  const [outcomeItem, setOutcomeItem] = useState<AppointmentItem | null>(null);
  const [dossierStudentId, setDossierStudentId] = useState<string | null>(null);

  const loadAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listSchedulerAppointmentsAction();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    listSchedulerAppointmentsAction()
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load appointments.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const currentList =
    activeTab === "pending"
      ? data.pending
      : activeTab === "active"
        ? data.active
        : data.completed;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
            <i className="fas fa-calendar-alt text-xs" />
            <span>Advisory Logistics · Global Standard Appointment Scheduler</span>
          </div>
          <h1 className="font-academic mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Appointment Scheduler
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Process student consultation requests, assign sessions to career staff, and update student dossiers.
          </p>
        </div>

        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-hourglass-half mr-1.5" />
            Pending ({data.pending.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-calendar-check mr-1.5" />
            Active ({data.active.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "completed"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-check-double mr-1.5" />
            Completed ({data.completed.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <i className="fas fa-exclamation-circle text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
          <i className="fas fa-check-circle text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Matrix Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
              Pending Requests
            </span>
            <i className="fas fa-inbox text-amber-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 sm:text-3xl">
            {data.pending.length}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Awaiting staff assignment & confirmation</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              Active Appointments
            </span>
            <i className="fas fa-calendar-day text-emerald-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
            {data.active.length}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Confirmed & scheduled advisory sessions</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400">
              Completed Consultations
            </span>
            <i className="fas fa-user-check text-purple-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-400 sm:text-3xl">
            {data.completed.length}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Archived with assessment outcomes</p>
        </div>
      </section>

      {/* Main List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-400 mb-2 block" />
          <span>Loading appointment scheduler…</span>
        </div>
      ) : currentList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-[#0e0e22]/50 p-12 text-center space-y-3">
          <i className="fas fa-calendar-check text-gray-500 text-3xl" />
          <h3 className="text-base font-bold text-white">
            No {activeTab} appointments found
          </h3>
          <p className="text-xs text-gray-400">
            {activeTab === "pending"
              ? "All student consultation requests have been scheduled and assigned."
              : activeTab === "active"
                ? "No active consultations currently in progress."
                : "No completed appointment archives on record."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {currentList.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-5 space-y-4 hover:border-blue-500/30 transition-all shadow-md"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono text-blue-300">
                    {item.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : item.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="font-academic text-base font-bold text-white hover:text-orange-400 transition-colors cursor-pointer"
                      onClick={() => setDossierStudentId(item.studentId)}
                    >
                      {item.studentName}
                    </h3>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-purple-300">{item.studentRegNumber}</span>
                      <span>·</span>
                      <span>{item.studentDepartment}</span>
                      <span>·</span>
                      <span className="text-orange-400">{item.studentLevel}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDossierStudentId(item.studentId)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-300 transition-all cursor-pointer"
                    title="Inspect Student Academic File"
                  >
                    <i className="fas fa-folder-open text-[11px]" />
                    <span>View File</span>
                  </button>
                </div>

                {/* Scheduling Details */}
                <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 space-y-1.5 text-xs text-gray-300">
                  {item.scheduledStart ? (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-clock text-orange-400 text-[11px]" />
                      <span>
                        {new Date(item.scheduledStart).toLocaleDateString()} at{" "}
                        {new Date(item.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ) : item.preferredDate ? (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-calendar-alt text-amber-400 text-[11px]" />
                      <span>Preferred: {item.preferredDate} ({item.preferredTimeSlot})</span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <i className="fas fa-user-tie text-blue-400 text-[11px]" />
                    <span>Assigned Officer: <strong className="text-white">{item.staffName || "Unassigned"}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-emerald-400 text-[11px]" />
                    <span>Location: {item.meetingLocation}</span>
                  </div>

                  <div className="pt-1 border-t border-white/[0.04] text-[11px] text-gray-400">
                    <span className="text-gray-500">Reason:</span> {item.reason}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDossierStudentId(item.studentId)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <i className="fas fa-id-card text-purple-400" />
                  <span>Student Dossier</span>
                </button>

                {activeTab === "pending" && (
                  <button
                    type="button"
                    onClick={() => setSchedulingItem(item)}
                    className={orangeButton}
                  >
                    <i className="fas fa-calendar-plus" />
                    <span>Schedule & Assign</span>
                  </button>
                )}

                {activeTab === "active" && (
                  <button
                    type="button"
                    onClick={() => setOutcomeItem(item)}
                    className={orangeButton}
                  >
                    <i className="fas fa-check-circle" />
                    <span>Log Outcome & Update File</span>
                  </button>
                )}

                {activeTab === "completed" && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <i className="fas fa-check" />
                    <span>Consultation Recorded</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule & Assign Modal */}
      {schedulingItem && (
        <ScheduleAndAssignModal
          item={schedulingItem}
          officers={officers}
          onClose={() => setSchedulingItem(null)}
          onScheduled={() => {
            setSchedulingItem(null);
            setSuccessMsg("Appointment scheduled and assigned to Career Officer!");
            loadAppointments();
            setTimeout(() => setSuccessMsg(""), 3500);
          }}
        />
      )}

      {/* Complete & Log Outcome Modal */}
      {outcomeItem && (
        <CompleteAppointmentModal
          item={outcomeItem}
          onClose={() => setOutcomeItem(null)}
          onCompleted={() => {
            setOutcomeItem(null);
            setSuccessMsg("Consultation completed, assessment note recorded, and student file updated!");
            loadAppointments();
            setTimeout(() => setSuccessMsg(""), 3500);
          }}
        />
      )}

      {/* Student Academic Dossier Modal */}
      {dossierStudentId && (
        <StudentDossierDetailModal
          studentId={dossierStudentId}
          onClose={() => setDossierStudentId(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// MODAL: SCHEDULE & ASSIGN
// ============================================================
function ScheduleAndAssignModal({
  item,
  officers,
  onClose,
  onScheduled,
}: {
  item: AppointmentItem;
  officers: StaffOption[];
  onClose: () => void;
  onScheduled: () => void;
}) {
  const [selectedStaffId, setSelectedStaffId] = useState(officers[0]?.id || "");
  const [dateStr, setDateStr] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [timeStr, setTimeStr] = useState("10:00");
  const [location, setLocation] = useState("Career Services Centre, Room 204");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSchedule = async () => {
    if (!selectedStaffId) {
      setError("Please select a Career Officer to attend to this appointment.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const startIso = `${dateStr}T${timeStr}:00`;
      const endIso = `${dateStr}T${parseInt(timeStr.split(":")[0]) + 1}:${timeStr.split(":")[1]}:00`;

      const res = await scheduleAndAssignAppointmentAction({
        requestId: item.requestId,
        studentId: item.studentId,
        staffId: selectedStaffId,
        scheduledStart: startIso,
        scheduledEnd: endIso,
        meetingLocation: location,
        notes,
      });

      if (!res.success) throw new Error(res.error);
      onScheduled();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to schedule appointment.");
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
              Global Appointment Scheduler
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl">
              Schedule & Assign Consultation
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

        {/* Student Target Strip */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0c1e] p-3 text-xs">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Target Student</div>
          <div className="text-sm font-bold text-white mt-0.5">{item.studentName} ({item.studentRegNumber})</div>
          <div className="text-gray-400 text-[11px] mt-0.5">{item.studentDepartment} · {item.studentLevel}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300">Assign to Career Staff Officer *</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className={inputStyle}
            >
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.fullName} ({o.designation || "Career Staff"})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-300">Appointment Date *</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300">Start Time *</label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Meeting Location / Mode</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">Staff Notes / Instructions</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please bring updated printed draft of resume and SIWES completion log."
              className={`${inputStyle} resize-none`}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSchedule}
            className={orangeButton}
          >
            {saving ? "Confirming…" : "Confirm Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: COMPLETE APPOINTMENT & LOG ASSESSMENT NOTE
// ============================================================
function CompleteAppointmentModal({
  item,
  onClose,
  onCompleted,
}: {
  item: AppointmentItem;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [status, setStatus] = useState<"COMPLETED" | "NO_SHOW" | "CANCELLED">("COMPLETED");
  const [assessmentNote, setAssessmentNote] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    if (!assessmentNote.trim()) {
      setError("Please provide an assessment note or consultation summary.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await completeAppointmentWithNotesAction(item.id, {
        status,
        assessmentNote,
        actionPlan,
      });

      if (!res.success) throw new Error(res.error);
      onCompleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record consultation outcome.");
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
              Consultation Assessment Outcome
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl">
              Complete Appointment & Update File
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
            <label className="text-xs font-semibold text-gray-300">Session Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "COMPLETED" | "NO_SHOW" | "CANCELLED")
              }
              className={inputStyle}
            >
              <option value="COMPLETED">Session Completed & Attended</option>
              <option value="NO_SHOW">Student No-Show (Missed Session)</option>
              <option value="CANCELLED">Session Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">
              Staff Assessment Note on Student *
            </label>
            <textarea
              rows={4}
              value={assessmentNote}
              onChange={(e) => setAssessmentNote(e.target.value)}
              placeholder="Record your diagnostic assessment of the student. E.g., 'Completed mock technical interview. Student shows strong algorithmic grasp but needs refinement in explaining time complexity under pressure.'"
              className={`${inputStyle} resize-none`}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              This note is automatically written to the student&apos;s official Academic Dossier.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300">30-Day Action Plan / Next Milestones</label>
            <input
              type="text"
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder="e.g. Complete 2 LeetCode problems daily and finalize GitHub portfolio."
              className={inputStyle}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleComplete}
            className={orangeButton}
          >
            {saving ? "Saving…" : "Save Outcome & Update File"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: EMBEDDED STUDENT DOSSIER DETAIL
// ============================================================
function StudentDossierDetailModal({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<StudentDossierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentDossierAction(studentId)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
              Official Academic Dossier
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl">
              {data?.profile.fullName || "Student File"}
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
          <div className="text-center text-xs text-gray-500">Student file could not be found.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0c1e] p-4 text-xs flex items-center gap-3.5">
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
                <div className="text-gray-400 text-[11px] mt-0.5">{data.profile.department} · {data.profile.level} · {data.profile.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3">
                <span className="text-[10px] font-mono text-gray-500">Assessments</span>
                <div className="text-lg font-black text-white">{data.metrics.totalAssessments}</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3">
                <span className="text-[10px] font-mono text-gray-500">Avg Score</span>
                <div className="text-lg font-black text-orange-400">{data.metrics.averageScore}%</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3">
                <span className="text-[10px] font-mono text-gray-500">Milestones</span>
                <div className="text-lg font-black text-purple-400">{data.metrics.totalOccurrences}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase text-purple-400">Recent Occurrences</h4>
              {data.occurrences.length === 0 ? (
                <p className="text-xs text-gray-500">No occurrences logged.</p>
              ) : (
                data.occurrences.slice(0, 5).map((o) => (
                  <div key={o.id} className="rounded-lg bg-white/[0.02] p-3 text-xs space-y-1.5 border border-white/[0.04]">
                    <div className="flex justify-between font-bold text-white">
                      <span>{o.title}</span>
                      <span className="text-gray-500 text-[10px]">{new Date(o.occurrenceDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-400 text-[11px] leading-relaxed break-words">
                      {o.description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
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
                    <div className="text-[10px] text-gray-500">By: {o.actorName}</div>
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
