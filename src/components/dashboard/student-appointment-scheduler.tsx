"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestConsultationAction,
  cancelStudentConsultationAction,
  cancelStudentAppointmentAction,
  type StudentConsultationRequestItem,
  type StudentScheduledAppointmentItem,
} from "@/actions/appointments";

const CATEGORIES = [
  "Career Advisory & Pathway Planning",
  "Resume & ATS CV Review",
  "Virtual Internship Guidance",
  "Job Placement & Employer Outreach",
  "Interview Coaching & Readiness",
  "Academic & Skills Assessment Review",
];

const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
];

export function StudentAppointmentScheduler({
  initialAppointments = [],
  initialRequests = [],
  isModalOpenInitially = false,
}: {
  initialAppointments?: StudentScheduledAppointmentItem[];
  initialRequests?: StudentConsultationRequestItem[];
  isModalOpenInitially?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"appointments" | "requests">("appointments");
  const [appointments, setAppointments] = useState(initialAppointments);
  const [requests, setRequests] = useState(initialRequests);

  // Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(isModalOpenInitially);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    // Format YYYY-MM-DD
    return d.toISOString().split("T")[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState(TIME_SLOTS[0]);
  const [reason, setReason] = useState("");
  const [studentNotes, setStudentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Cancellation State
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Min date is tomorrow
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await requestConsultationAction({
        category,
        reason,
        preferredDate,
        preferredTimeSlot,
        studentNotes: studentNotes || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to submit request.");
        return;
      }

      setSuccessMsg("Consultation request successfully submitted! An advisor will review and confirm your session.");
      setReason("");
      setStudentNotes("");
      setIsModalOpen(false);

      // Optimistically add to requests list
      if (res.requestId) {
        setRequests((prev) => [
          {
            id: res.requestId!,
            category,
            reason,
            preferredDate,
            preferredTimeSlot,
            status: "REQUESTED",
            studentNotes: studentNotes || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...prev,
        ]);
        setActiveTab("requests");
      }

      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this consultation request?")) return;
    setCancellingId(requestId);
    setErrorMsg("");

    try {
      const res = await cancelStudentConsultationAction(requestId, "Cancelled by student from portal.");
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "CANCELLED" } : r)),
        );
        setSuccessMsg("Consultation request cancelled.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to cancel request.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to cancel request.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled appointment?")) return;
    setCancellingId(appointmentId);
    setErrorMsg("");

    try {
      const res = await cancelStudentAppointmentAction(appointmentId, "Cancelled by student from portal.");
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: "CANCELLED" } : a)),
        );
        setSuccessMsg("Appointment cancelled.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to cancel appointment.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  };

  const activeAppointments = appointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "RESCHEDULED",
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW",
  );

  const pendingRequests = requests.filter(
    (r) => r.status === "REQUESTED" || r.status === "UNDER_REVIEW",
  );
  const otherRequests = requests.filter(
    (r) => r.status !== "REQUESTED" && r.status !== "UNDER_REVIEW",
  );

  return (
    <section id="appointments-section" className="space-y-6 scroll-mt-20">
      {/* Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FF7F24]/10 border border-[#FF7F24]/20 text-[#FF7F24] text-xs font-bold uppercase tracking-wider mb-1.5">
            <i className="fas fa-calendar-check" />
            <span>Appointment Scheduling System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Advisory Consultations & Sessions
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Book one-on-one appointments with KSITM Career Coordinators and track scheduled meeting details, location, and assigned staff officers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMsg("");
            setSuccessMsg("");
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF7F24] text-[#0A0A1A] font-extrabold text-xs sm:text-sm hover:bg-[#40297B] hover:text-white transition-all shadow-md shadow-[#FF7F24]/20 shrink-0 cursor-pointer"
        >
          <i className="fas fa-plus-circle" />
          <span>Book New Consultation</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <i className="fas fa-check-circle text-emerald-400 text-sm" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-red-400 text-sm" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            className="text-red-400 hover:text-red-200"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("appointments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "appointments"
              ? "bg-[#FF7F24]/15 border border-[#FF7F24]/40 text-[#FF7F24]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-calendar-alt" />
          <span>Scheduled Appointments ({activeAppointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "requests"
              ? "bg-[#FF7F24]/15 border border-[#FF7F24]/40 text-[#FF7F24]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-inbox" />
          <span>Pending Requests ({pendingRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: Scheduled Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          {activeAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#101023]/60 p-8 text-center space-y-3">
              <span className="w-12 h-12 rounded-2xl bg-[#FF7F24]/10 border border-[#FF7F24]/20 text-[#FF7F24] inline-flex items-center justify-center text-xl">
                <i className="fas fa-calendar-plus" />
              </span>
              <h3 className="text-base font-bold text-white">No active appointments scheduled</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                You do not have any confirmed sessions with a Career Advisor yet. Request a consultation below to meet with our advisory team.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-200 hover:bg-[#FF7F24] hover:text-[#0A0A1A] transition-all cursor-pointer"
              >
                <i className="fas fa-calendar-check text-[#FF7F24]" />
                <span>Request Your First Consultation</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAppointments.map((appt) => {
                const startDate = new Date(appt.scheduledStart);
                const endDate = new Date(appt.scheduledEnd);
                const isCancelling = cancellingId === appt.id;

                return (
                  <article
                    key={appt.id}
                    className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#101023] to-[#0A2016]/40 p-5 space-y-4 shadow-lg shadow-emerald-950/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                          <i className="fas fa-user-tie" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">
                            {appt.staffName}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {appt.staffDesignation || "Career Center Advisor"}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        ● {appt.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs border-t border-b border-white/5 py-3">
                      <div className="flex items-center gap-2 text-gray-200">
                        <i className="fas fa-calendar-day text-[#FF7F24] w-4 text-center" />
                        <span className="font-semibold">
                          {startDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-200">
                        <i className="fas fa-clock text-[#FF7F24] w-4 text-center" />
                        <span>
                          {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" — "}
                          {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-200">
                        <i className="fas fa-location-dot text-[#FF7F24] w-4 text-center" />
                        <span>{appt.meetingLocation}</span>
                      </div>
                    </div>

                    {appt.studentVisibleNotes && (
                      <p className="text-xs text-gray-300 bg-white/5 rounded-xl p-3 border border-white/5 italic">
                        &quot;{appt.studentVisibleNotes}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(appt.id)}
                        disabled={isCancelling}
                        className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isCancelling ? "Cancelling…" : "Cancel Appointment"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Past & Concluded Sessions ({pastAppointments.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pastAppointments.map((pa) => (
                  <div
                    key={pa.id}
                    className="rounded-xl border border-white/5 bg-[#101023]/40 p-3 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white">{pa.staffName}</span>
                      <p className="text-gray-400 text-[11px]">
                        {new Date(pa.scheduledStart).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pa.status === "COMPLETED"
                          ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}
                    >
                      {pa.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#101023]/60 p-8 text-center space-y-3">
              <span className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 inline-flex items-center justify-center text-xl">
                <i className="fas fa-inbox" />
              </span>
              <h3 className="text-base font-bold text-white">No pending requests awaiting assignment</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Any consultation requests you submit will appear here while our Coordinators review and assign an advisor.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-200 hover:bg-[#FF7F24] hover:text-[#0A0A1A] transition-all cursor-pointer"
              >
                <i className="fas fa-plus text-[#FF7F24]" />
                <span>Submit Consultation Request</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => {
                const isCancelling = cancellingId === req.id;
                return (
                  <article
                    key={req.id}
                    className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#101023] to-[#251b08]/30 p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 uppercase">
                          {req.category}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">
                          {req.reason}
                        </h4>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0">
                        ⏳ Under Review
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 rounded-xl p-3 border border-white/5">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">
                          Preferred Date
                        </span>
                        <span className="font-semibold text-white">{req.preferredDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">
                          Preferred Slot
                        </span>
                        <span className="font-semibold text-white">{req.preferredTimeSlot}</span>
                      </div>
                    </div>

                    {req.studentNotes && (
                      <p className="text-xs text-gray-300 italic">
                        Note: &quot;{req.studentNotes}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-gray-400">
                        Submitted: {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={isCancelling}
                        className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isCancelling ? "Cancelling…" : "Withdraw Request"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {otherRequests.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Resolved Requests History ({otherRequests.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherRequests.map((oq) => (
                  <div
                    key={oq.id}
                    className="rounded-xl border border-white/5 bg-[#101023]/40 p-3 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white">{oq.category}</span>
                      <p className="text-gray-400 text-[11px]">
                        Target Date: {oq.preferredDate}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        oq.status === "SCHEDULED"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : oq.status === "COMPLETED"
                          ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}
                    >
                      {oq.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Consultation Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#101023] p-6 sm:p-8 text-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#FF7F24]/15 border border-[#FF7F24]/30 text-[#FF7F24] flex items-center justify-center text-lg">
                  <i className="fas fa-calendar-plus" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    Request Career Consultation
                  </h3>
                  <p className="text-xs text-gray-400">
                    Schedule time with our certified advisory team.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Consultation Focus Area *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#FF7F24] focus:outline-none"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#FF7F24] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#FF7F24] focus:outline-none"
                    required
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Objectives & Topics to Address *
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., I would like guidance on tailoring my resume for software engineering internships and reviewing my technical project portfolio."
                  className="w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-[#FF7F24] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Additional Notes or Questions (Optional)
                </label>
                <input
                  type="text"
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="Any specific questions or materials you are bringing..."
                  className="w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-[#FF7F24] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF7F24] text-[#0A0A1A] font-extrabold text-xs sm:text-sm hover:bg-[#40297B] hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#FF7F24]/20"
                >
                  {submitting && <i className="fas fa-spinner fa-spin" />}
                  <span>{submitting ? "Submitting Request…" : "Confirm & Place Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
