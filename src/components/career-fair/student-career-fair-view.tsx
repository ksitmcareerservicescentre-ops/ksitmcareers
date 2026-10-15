"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  registerForCareerFairAction,
  cancelCareerFairRegistrationAction,
  getCareerFairDetailsAction,
  type CareerFairListItem,
  type CareerFairDetail,
} from "@/actions/career-fairs";

interface StudentCareerFairViewProps {
  initialFairs: CareerFairListItem[];
  student: {
    id: string;
    fullName: string;
    regNumber: string;
    department?: string | null;
    level?: string | null;
  };
}

export function StudentCareerFairView({
  initialFairs,
  student,
}: StudentCareerFairViewProps) {
  const [fairs, setFairs] = useState<CareerFairListItem[]>(initialFairs);
  const [selectedFairDetails, setSelectedFairDetails] = useState<CareerFairDetail | null>(null);
  const [activePassFair, setActivePassFair] = useState<CareerFairListItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter fairs by search
  const filteredFairs = useMemo(() => {
    return fairs.filter((fair) => {
      const matchSearch =
        fair.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fair.theme && fair.theme.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (fair.venue && fair.venue.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [fairs, searchQuery]);

  // Handle register
  const handleRegister = (fairId: string) => {
    startTransition(async () => {
      setActionMessage(null);
      const res = await registerForCareerFairAction(fairId);
      if (res.success) {
        setFairs((prev) =>
          prev.map((f) =>
            f.id === fairId
              ? {
                  ...f,
                  isRegistered: true,
                  registrationId: res.registrationId,
                  registeredCount: f.registeredCount + 1,
                }
              : f,
          ),
        );
        setActionMessage({
          type: "success",
          text: "Registration confirmed! Your digital event pass is now active.",
        });
        const registeredFair = fairs.find((f) => f.id === fairId);
        if (registeredFair) {
          setActivePassFair({
            ...registeredFair,
            isRegistered: true,
            registrationId: res.registrationId,
          });
        }
      } else {
        setActionMessage({
          type: "error",
          text: res.error || "Failed to register for career fair.",
        });
      }
    });
  };

  // Handle cancel registration
  const handleCancelRegistration = (fairId: string) => {
    if (!confirm("Are you sure you want to cancel your attendance registration for this career fair?")) {
      return;
    }
    startTransition(async () => {
      setActionMessage(null);
      const res = await cancelCareerFairRegistrationAction(fairId);
      if (res.success) {
        setFairs((prev) =>
          prev.map((f) =>
            f.id === fairId
              ? {
                  ...f,
                  isRegistered: false,
                  registrationId: undefined,
                  registeredCount: Math.max(0, f.registeredCount - 1),
                }
              : f,
          ),
        );
        if (activePassFair?.id === fairId) {
          setActivePassFair(null);
        }
        setActionMessage({
          type: "success",
          text: "Your registration has been cancelled.",
        });
      } else {
        setActionMessage({
          type: "error",
          text: res.error || "Failed to cancel registration.",
        });
      }
    });
  };

  // View Booths
  const handleViewBooths = async (fair: CareerFairListItem) => {
    setLoadingDetails(true);
    const details = await getCareerFairDetailsAction(fair.id);
    setSelectedFairDetails(details);
    setLoadingDetails(false);
  };

  // Filter booths in modal
  const filteredBooths = useMemo(() => {
    if (!selectedFairDetails) return [];
    return selectedFairDetails.booths.filter((b) => {
      const matchIndustry =
        industryFilter === "ALL" ||
        (b.industry && b.industry.toLowerCase() === industryFilter.toLowerCase());
      return matchIndustry;
    });
  }, [selectedFairDetails, industryFilter]);

  const uniqueIndustries = useMemo(() => {
    if (!selectedFairDetails) return [];
    const set = new Set<string>();
    selectedFairDetails.booths.forEach((b) => {
      if (b.industry) set.add(b.industry);
    });
    return Array.from(set);
  }, [selectedFairDetails]);

  return (
    <div className="space-y-8">
      {/* Print stylesheet for Digital Event Pass */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #career-fair-event-pass,
          #career-fair-event-pass * {
            visibility: visible !important;
          }
          #career-fair-event-pass {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400">
            <i className="fas fa-calendar-check text-xs" />
            <span>KSITM Institutional Career Fair & Expo Directorate</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Career Fairs & Expos
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-2xl">
            Connect directly with verified corporate partners, discover hiring openings, explore interactive employer booths, and generate official student entry passes.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-gray-200 transition-all cursor-pointer self-start sm:self-auto"
        >
          <i className="fas fa-arrow-left text-xs" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Notification Toast */}
      {actionMessage && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-3 ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <i
              className={`fas ${
                actionMessage.type === "success" ? "fa-circle-check text-emerald-400" : "fa-circle-exclamation text-red-400"
              }`}
            />
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#101023] border border-white/10 rounded-2xl p-4">
        <div className="relative w-full sm:w-80">
          <i className="fas fa-search absolute left-3.5 top-3 text-xs text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fairs by title, theme, or venue…"
            className="w-full rounded-xl border border-white/10 bg-[#090918] pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-gray-400 self-end sm:self-auto">
          <span>Showing </span>
          <span className="font-bold text-white">{filteredFairs.length}</span>
          <span> event{filteredFairs.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {/* Fairs Cards Grid */}
      {filteredFairs.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#101023] p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl">
            <i className="fas fa-calendar-xmark" />
          </div>
          <h3 className="text-lg font-bold text-white">No Career Fairs Scheduled</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            There are currently no active public career fairs matching your search criteria. Please check back regularly for updates from the Career Development Directorate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFairs.map((fair) => {
            const startDate = new Date(fair.startDate);
            const endDate = new Date(fair.endDate);
            const isconcluded = fair.status === "CONCLUDED" || endDate.getTime() < Date.now();
            const isOngoing = fair.status === "ONGOING";

            return (
              <article
                key={fair.id}
                className="relative rounded-3xl border border-white/10 bg-[#101023] p-6 sm:p-7 flex flex-col justify-between hover:border-rose-500/30 transition-all space-y-6"
              >
                <div className="space-y-4">
                  {/* Top Status & Date Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${
                        isconcluded
                          ? "bg-gray-500/10 border-gray-500/20 text-gray-400"
                          : isOngoing
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 animate-pulse"
                          : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                      }`}
                    >
                      <i className={`fas ${isconcluded ? "fa-circle-check" : isOngoing ? "fa-circle-play" : "fa-calendar"}`} />
                      <span>{isconcluded ? "Concluded" : isOngoing ? "Live Now" : "Upcoming"}</span>
                    </span>

                    {fair.isRegistered && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-400">
                        <i className="fas fa-id-card" />
                        <span>Pass Active</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Theme */}
                  <div>
                    <h2 className="text-xl font-black text-white group-hover:text-rose-300 transition-colors">
                      {fair.title}
                    </h2>
                    {fair.theme && (
                      <p className="mt-1 text-xs font-semibold text-rose-400/90 italic">
                        &ldquo;{fair.theme}&rdquo;
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                    {fair.description}
                  </p>

                  {/* Meta Specs */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-gray-300">
                      <i className="fas fa-clock text-rose-400 w-4 text-center" />
                      <span>
                        {startDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        ·{" "}
                        {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-300">
                      <i className="fas fa-location-dot text-rose-400 w-4 text-center" />
                      <span className="truncate">{fair.venue || "KSITM Convocation Grounds"}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-300">
                      <i className="fas fa-store text-rose-400 w-4 text-center" />
                      <span>{fair.boothsCount} Employer Booths</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-300">
                      <i className="fas fa-users text-rose-400 w-4 text-center" />
                      <span>{fair.registeredCount} Students Registered</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleViewBooths(fair)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-gray-200 transition-all cursor-pointer"
                  >
                    <i className="fas fa-briefcase text-xs text-rose-400" />
                    <span>View Booths ({fair.boothsCount})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {fair.isRegistered ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setActivePassFair(fair)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-[#090915] transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                          <i className="fas fa-ticket" />
                          <span>Digital Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelRegistration(fair.id)}
                          disabled={isPending}
                          className="text-gray-500 hover:text-red-400 p-2 text-xs transition-colors cursor-pointer"
                          title="Cancel registration"
                        >
                          <i className="fas fa-times" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegister(fair.id)}
                        disabled={isPending || isconcluded}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 px-4 py-2 text-xs font-bold text-[#090915] transition-all cursor-pointer shadow-md shadow-rose-500/20 active:scale-95"
                      >
                        <i className="fas fa-user-plus" />
                        <span>{isconcluded ? "Event Closed" : "Register to Attend"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: DIGITAL EVENT PASS                             */}
      {/* ======================================================== */}
      {activePassFair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c0c1e] p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm">
                  <i className="fas fa-id-badge" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Institutional Event Entry Pass</h3>
                  <p className="text-[11px] text-gray-400">Authenticated Student Accreditation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePassFair(null)}
                className="text-gray-400 hover:text-white text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Print Pass Card */}
            <div
              id="career-fair-event-pass"
              className="rounded-2xl border-2 border-dashed border-white/20 bg-white p-6 text-gray-900 space-y-5 shadow-xl"
            >
              {/* KSITM Pass Header */}
              <div className="text-center border-b pb-4 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 block">
                  Katsina State Institute of Technology and Management
                </span>
                <h4 className="text-lg font-black uppercase text-gray-950 tracking-tight">
                  {activePassFair.title}
                </h4>
                <p className="text-xs font-semibold text-gray-600">
                  Official Student Accreditation & Entry Pass
                </p>
              </div>

              {/* Student Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-gray-500 block">Candidate Name</span>
                  <span className="font-bold text-gray-900 text-sm">{student.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-gray-500 block">Registration No</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">{student.regNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-gray-500 block">Department</span>
                  <span className="font-semibold text-gray-800">{student.department || "Technology Scholar"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-gray-500 block">Academic Level</span>
                  <span className="font-semibold text-gray-800">{student.level || "ND Track"}</span>
                </div>
              </div>

              {/* Venue & Date Details */}
              <div className="rounded-xl bg-gray-50 p-3 text-xs space-y-1.5 border border-gray-200">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Date & Time:</span>
                  <span className="font-bold text-gray-900">
                    {new Date(activePassFair.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Venue:</span>
                  <span className="font-bold text-gray-900">{activePassFair.venue}</span>
                </div>
              </div>

              {/* Barcode Simulator & Verification Hash */}
              <div className="text-center pt-2 space-y-1">
                <div className="h-10 w-full bg-repeat-x flex items-center justify-center text-gray-400 font-mono text-[10px] border border-gray-300 bg-gray-100 rounded">
                  ||||| | |||| || |||||| | ||||| | ||| ||||||| | |||||
                </div>
                <span className="font-mono text-[10px] text-gray-500 tracking-wider">
                  PASS-ID: KSITM-CF-{student.regNumber.replace(/[^A-Za-z0-9]/g, "")}-{activePassFair.id.slice(0, 6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-[#090915] transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <i className="fas fa-print" />
                <span>Print / Save Pass</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePassFair(null)}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all cursor-pointer"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: PARTICIPATING EMPLOYER BOOTHS DIRECTORY        */}
      {/* ======================================================== */}
      {selectedFairDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0c0c1e] p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  Participating Employers Directory
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedFairDetails.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFairDetails(null)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-gray-400 mr-1 text-[11px]">Industry:</span>
                <button
                  type="button"
                  onClick={() => setIndustryFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    industryFilter === "ALL"
                      ? "bg-rose-500 text-[#090915] font-bold"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  All ({selectedFairDetails.booths.length})
                </button>
                {uniqueIndustries.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => setIndustryFilter(ind)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      industryFilter.toLowerCase() === ind.toLowerCase()
                        ? "bg-rose-500 text-[#090915] font-bold"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>

              <div className="text-xs text-gray-400">
                <span>{filteredBooths.length} booths listed</span>
              </div>
            </div>

            {/* Booths Grid */}
            {filteredBooths.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#101023] p-8 text-center text-xs text-gray-400">
                No booths currently registered under this industry category.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBooths.map((booth) => (
                  <div
                    key={booth.id}
                    className="rounded-2xl border border-white/10 bg-[#101023] p-5 space-y-3 hover:border-rose-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-gray-400 mb-1">
                          {booth.boothNumber || "Booth"}
                        </span>
                        <h4 className="text-base font-bold text-white">{booth.companyName}</h4>
                      </div>
                      <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                        {booth.industry || "General"}
                      </span>
                    </div>

                    {booth.targetRoles && (
                      <div className="text-xs text-gray-300">
                        <span className="text-gray-400">Recruiting: </span>
                        <span className="font-semibold text-white">{booth.targetRoles}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                      <span className="font-mono text-[11px]">
                        {booth.openPositionsCount || 1} Open Positions
                      </span>

                      <div className="flex items-center gap-2">
                        {booth.virtualMeetingUrl && (
                          <a
                            href={booth.virtualMeetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all"
                          >
                            <i className="fas fa-video text-[10px]" />
                            <span>Virtual Booth</span>
                          </a>
                        )}

                        {booth.websiteUrl && (
                          <a
                            href={booth.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <i className="fas fa-external-link-alt text-[9px]" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Close */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedFairDetails(null)}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2 text-xs font-semibold text-gray-200 transition-all cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
