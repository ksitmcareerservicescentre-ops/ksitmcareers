/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  listCareerFairsAction,
  createCareerFairAction,
  updateCareerFairAction,
  deleteCareerFairAction,
  addCareerFairBoothAction,
  deleteCareerFairBoothAction,
  getCareerFairDetailsAction,
  listCareerFairAttendeesAction,
  markCareerFairAttendanceAction,
  type CareerFairListItem,
  type CareerFairDetail,
  type CareerFairAttendee,
} from "@/actions/career-fairs";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function CareerFairWorkspace() {
  const [fairs, setFairs] = useState<CareerFairListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"FAIRS" | "ATTENDEES">("FAIRS");
  const [selectedFairId, setSelectedFairId] = useState<string | null>(null);
  const [fairDetails, setFairDetails] = useState<CareerFairDetail | null>(null);
  const [attendees, setAttendees] = useState<CareerFairAttendee[]>([]);
  const [attendeeLoading, setAttendeeLoading] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editFair, setEditFair] = useState<CareerFairListItem | null>(null);
  const [boothModalFair, setBoothModalFair] = useState<CareerFairListItem | null>(null);
  const [newBoothCompany, setNewBoothCompany] = useState("");
  const [newBoothNumber, setNewBoothNumber] = useState("");
  const [newBoothIndustry, setNewBoothIndustry] = useState("");
  const [newBoothRoles, setNewBoothRoles] = useState("");
  const [newBoothPositions, setNewBoothPositions] = useState(1);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadFairs = () => {
    setLoading(true);
    setError(null);
    void listCareerFairsAction()
      .then((data) => {
        setFairs(data);
        if (data.length > 0 && !selectedFairId) {
          setSelectedFairId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load career fairs:", err);
        setError("Failed to load career fairs.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFairs();
  }, []);

  // When selected fair changes, load details & attendees
  useEffect(() => {
    if (!selectedFairId) return;
    void getCareerFairDetailsAction(selectedFairId).then((res) => {
      setFairDetails(res);
    });

    if (activeTab === "ATTENDEES") {
      setAttendeeLoading(true);
      void listCareerFairAttendeesAction(selectedFairId).then((res) => {
        setAttendees(res);
        setAttendeeLoading(false);
      });
    }
  }, [selectedFairId, activeTab]);

  const handleDeleteFair = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete career fair "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteCareerFairAction(id);
      if (res.success) {
        setNotice(`Career Fair "${title}" deleted.`);
        setFairs((prev) => prev.filter((f) => f.id !== id));
        if (selectedFairId === id) setSelectedFairId(null);
        setTimeout(() => setNotice(null), 4000);
      } else {
        alert(res.error || "Failed to delete career fair.");
      }
    });
  };

  const handleAddBooth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boothModalFair || !newBoothCompany.trim()) return;

    startTransition(async () => {
      const res = await addCareerFairBoothAction({
        fairId: boothModalFair.id,
        companyName: newBoothCompany.trim(),
        boothNumber: newBoothNumber.trim() || `Booth ${fairDetails?.booths.length ? fairDetails.booths.length + 1 : 1}`,
        industry: newBoothIndustry.trim() || "Technology",
        targetRoles: newBoothRoles.trim() || undefined,
        openPositionsCount: Number(newBoothPositions) || 1,
      });

      if (res.success) {
        setNotice(`Booth for "${newBoothCompany}" added!`);
        setNewBoothCompany("");
        setNewBoothNumber("");
        setNewBoothIndustry("");
        setNewBoothRoles("");
        setNewBoothPositions(1);
        void getCareerFairDetailsAction(boothModalFair.id).then((d) => setFairDetails(d));
        setTimeout(() => setNotice(null), 3000);
      } else {
        alert(res.error || "Failed to add booth.");
      }
    });
  };

  const handleDeleteBooth = (boothId: string) => {
    if (!window.confirm("Remove this booth from the fair?")) return;
    startTransition(async () => {
      const res = await deleteCareerFairBoothAction(boothId);
      if (res.success) {
        setNotice("Booth removed.");
        if (fairDetails) {
          setFairDetails({
            ...fairDetails,
            booths: fairDetails.booths.filter((b) => b.id !== boothId),
          });
        }
        setTimeout(() => setNotice(null), 3000);
      }
    });
  };

  const handleToggleAttendance = (registrationId: string, current: boolean) => {
    startTransition(async () => {
      const res = await markCareerFairAttendanceAction(registrationId, !current);
      if (res.success) {
        setAttendees((prev) =>
          prev.map((a) => (a.registrationId === registrationId ? { ...a, attended: !current } : a)),
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-calendar-star" />
            <span>Campus Recruitment & Industry Expos</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            Career Fair Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-2xl">
            Schedule institutional career fairs, manage corporate employer exhibition booths, register scholar attendees, and record verified event participation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className={orangeButton}
          >
            <i className="fas fa-plus" />
            <span>Create Career Fair</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <i className="fas fa-check-circle text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-bold text-red-300 flex items-center gap-2">
          <i className="fas fa-exclamation-circle text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("FAIRS")}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "FAIRS"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-calendar-alt mr-1.5" />
          Fairs Directory ({fairs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ATTENDEES")}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "ATTENDEES"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <i className="fas fa-users mr-1.5" />
          Registered Attendees {fairDetails ? `(${fairDetails.registeredCount})` : ""}
        </button>
      </div>

      {/* TAB 1: FAIRS LIST & BOOTHS */}
      {activeTab === "FAIRS" && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl mr-2 text-orange-400" />
              <span>Loading career fairs...</span>
            </div>
          ) : fairs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <i className="fas fa-calendar-times text-4xl text-gray-500 mb-3" />
              <h3 className="text-base font-bold text-white">No Career Fairs Scheduled</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Create a career fair expo to invite partner employers and register student scholars.
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className={`${orangeButton} mt-4`}
              >
                Schedule First Career Fair
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column: Fairs List */}
              <div className="space-y-4 lg:col-span-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Select Event
                </span>
                {fairs.map((fair) => (
                  <div
                    key={fair.id}
                    onClick={() => setSelectedFairId(fair.id)}
                    className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                      selectedFairId === fair.id
                        ? "border-orange-500 bg-[#16162d] shadow-lg shadow-orange-500/10"
                        : "border-white/10 bg-[#101023] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          fair.status === "UPCOMING"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : fair.status === "ONGOING"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse"
                            : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {fair.status}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {new Date(fair.startDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-2 leading-snug line-clamp-2">
                      {fair.title}
                    </h3>

                    {fair.theme && (
                      <p className="text-[11px] text-orange-300/80 mt-1 line-clamp-1 italic">
                        &quot;{fair.theme}&quot;
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-[11px] text-gray-400">
                      <span>
                        <i className="fas fa-store text-orange-400 mr-1" />
                        {fair.boothsCount} {fair.boothsCount === 1 ? "Booth" : "Booths"}
                      </span>
                      <span>
                        <i className="fas fa-users text-cyan-400 mr-1" />
                        {fair.registeredCount} Registered
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Active Fair Details & Booth Management */}
              <div className="lg:col-span-2 space-y-6">
                {fairDetails ? (
                  <div className="rounded-2xl border border-white/10 bg-[#101023] p-6 space-y-6">
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                            {fairDetails.targetAudience}
                          </span>
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            {fairDetails.status}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white">
                          {fairDetails.title}
                        </h2>
                        {fairDetails.theme && (
                          <p className="text-xs text-orange-300 italic">
                            Theme: &quot;{fairDetails.theme}&quot;
                          </p>
                        )}
                        <p className="text-xs text-gray-400 flex items-center gap-2 pt-1">
                          <i className="fas fa-map-marker-alt text-orange-400" />
                          <span>{fairDetails.venue}</span>
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          <i className="fas fa-clock text-cyan-400" />
                          <span>
                            {new Date(fairDetails.startDate).toLocaleString()} —{" "}
                            {new Date(fairDetails.endDate).toLocaleTimeString()}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditFair(fairDetails)}
                          className={secondaryButton}
                        >
                          <i className="fas fa-edit" />
                          <span>Edit Event</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFair(fairDetails.id, fairDetails.title)}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Event Description & Overview
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
                        {fairDetails.description}
                      </p>
                    </div>

                    {/* Booths Directory */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <i className="fas fa-store text-orange-400" />
                            <span>Participating Employer Booths ({fairDetails.booths.length})</span>
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Vetted employers hosting digital and physical interview stands at this fair.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBoothModalFair(fairDetails)}
                          className={orangeButton}
                        >
                          <i className="fas fa-plus" />
                          <span>Add Employer Booth</span>
                        </button>
                      </div>

                      {fairDetails.booths.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center text-xs text-gray-400">
                          No exhibition booths registered yet. Click &quot;Add Employer Booth&quot; to assign participating companies.
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {fairDetails.booths.map((booth) => (
                            <div
                              key={booth.id}
                              className="rounded-xl border border-white/10 bg-[#090918] p-4 space-y-2 relative group hover:border-orange-500/30 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="rounded-md bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-400">
                                  {booth.boothNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBooth(booth.id)}
                                  className="text-gray-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                  title="Remove booth"
                                >
                                  <i className="fas fa-trash text-xs" />
                                </button>
                              </div>

                              <div className="font-bold text-white text-sm">
                                {booth.companyName}
                              </div>

                              <div className="text-[11px] text-gray-400 font-mono">
                                {booth.industry}
                              </div>

                              {booth.targetRoles && (
                                <div className="text-[11px] text-cyan-300">
                                  <span className="text-gray-400 font-semibold">Target: </span>
                                  {booth.targetRoles}
                                </div>
                              )}

                              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                                <span>{booth.openPositionsCount} Open Positions</span>
                                {booth.websiteUrl && (
                                  <a
                                    href={booth.websiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-orange-400 hover:underline"
                                  >
                                    Website
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-gray-400 text-xs">
                    Select a career fair to inspect details and manage booths.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED ATTENDEES */}
      {activeTab === "ATTENDEES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Registered Student Scholars
              </h3>
              <p className="text-xs text-gray-400">
                Scholars who signed up to attend and pitch to recruiters at this expo.
              </p>
            </div>
            {fairDetails && (
              <div className="text-xs font-mono text-orange-400">
                Fair: {fairDetails.title}
              </div>
            )}
          </div>

          {attendeeLoading ? (
            <div className="flex h-36 items-center justify-center text-gray-400 text-xs">
              <i className="fas fa-spinner fa-spin mr-2 text-orange-400" />
              Loading attendee records...
            </div>
          ) : attendees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center text-gray-400 text-xs">
              No students have registered for this career fair yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#101023]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-gray-400">
                    <th className="px-4 py-3 font-semibold">Scholar</th>
                    <th className="px-4 py-3 font-semibold">Department & Level</th>
                    <th className="px-4 py-3 font-semibold">Registered Date</th>
                    <th className="px-4 py-3 font-semibold">Attendance</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attendees.map((row) => (
                    <tr key={row.registrationId} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{row.studentName}</div>
                        <div className="font-mono text-[10px] text-gray-400">
                          {row.studentRegNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {row.studentDepartment || "KSITM Scholar"} • {row.studentLevel || "ND/HND"}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">
                        {new Date(row.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            row.attended
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {row.attended ? "Attended" : "Registered"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(row.registrationId, row.attended)}
                          className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          {row.attended ? "Mark Absent" : "Mark Attended"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE FAIR MODAL */}
      {createModalOpen && (
        <CreateFairModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            setNotice("Career fair created successfully!");
            loadFairs();
            setTimeout(() => setNotice(null), 4000);
          }}
        />
      )}

      {/* EDIT FAIR MODAL */}
      {editFair && (
        <EditFairModal
          fair={editFair}
          onClose={() => setEditFair(null)}
          onSuccess={() => {
            setEditFair(null);
            setNotice("Career fair updated successfully!");
            loadFairs();
            if (selectedFairId) {
              void getCareerFairDetailsAction(selectedFairId).then((res) => setFairDetails(res));
            }
            setTimeout(() => setNotice(null), 4000);
          }}
        />
      )}

      {/* ADD BOOTH MODAL */}
      {boothModalFair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d1e] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-orange-400 uppercase font-bold">
                  {boothModalFair.title}
                </span>
                <h3 className="text-lg font-bold text-white">Add Employer Booth</h3>
              </div>
              <button
                type="button"
                onClick={() => setBoothModalFair(null)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <form onSubmit={handleAddBooth} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Katsina Digital Innovations"
                  value={newBoothCompany}
                  onChange={(e) => setNewBoothCompany(e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Booth Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Booth A-01"
                    value={newBoothNumber}
                    onChange={(e) => setNewBoothNumber(e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software & FinTech"
                    value={newBoothIndustry}
                    onChange={(e) => setNewBoothIndustry(e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Target Roles / Positions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Junior Frontend Devs, Network Interns"
                  value={newBoothRoles}
                  onChange={(e) => setNewBoothRoles(e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Open Hiring Slots
                </label>
                <input
                  type="number"
                  min={1}
                  value={newBoothPositions}
                  onChange={(e) => setNewBoothPositions(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setBoothModalFair(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={orangeButton}
                >
                  <span>{isPending ? "Adding..." : "Add Booth"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateFairModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("KSITM Main Convocation Arena & Virtual Livestream");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetAudience, setTargetAudience] = useState("All Students & Alumni");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !startDate || !endDate) return;

    startTransition(async () => {
      const res = await createCareerFairAction({
        title,
        theme,
        description,
        venue,
        startDate,
        endDate,
        targetAudience,
      });

      if (res.success) {
        onSuccess();
      } else {
        alert(res.error || "Failed to create career fair.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-white">Create New Career Fair</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KSITM Technology & Engineering Career Fair 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Theme (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Empowering Northern Nigeria Digital Workforce"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Venue *
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Description & Highlights *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detailed description of keynote events, recruiter stands, and interview criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={orangeButton}>
              <span>{isPending ? "Creating..." : "Create Event"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditFairModal({
  fair,
  onClose,
  onSuccess,
}: {
  fair: CareerFairListItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(fair.title);
  const [theme, setTheme] = useState(fair.theme || "");
  const [description, setDescription] = useState(fair.description);
  const [venue, setVenue] = useState(fair.venue);
  const [status, setStatus] = useState(fair.status);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await updateCareerFairAction(fair.id, {
        title,
        theme,
        description,
        venue,
        status: status as "UPCOMING" | "ONGOING" | "CONCLUDED" | "CANCELLED",
      });

      if (res.success) {
        onSuccess();
      } else {
        alert(res.error || "Failed to update career fair.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-white">Edit Career Fair</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Theme
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "UPCOMING" | "ONGOING" | "CONCLUDED" | "CANCELLED")}
                className={inputStyle}
              >
                <option value="UPCOMING">UPCOMING</option>
                <option value="ONGOING">ONGOING</option>
                <option value="CONCLUDED">CONCLUDED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={orangeButton}>
              <span>{isPending ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
