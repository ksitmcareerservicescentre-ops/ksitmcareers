/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import {
  createLandingContentAction,
  updateLandingContentAction,
  deleteLandingContentAction,
  toggleLandingContentPublishAction,
} from "@/actions/admin";

export interface LeadershipRecord {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  imageAlt: string;
  summary: string;
  biography: unknown;
  displayOrder?: number;
  isPublished: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";
const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

function parseBiography(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).filter((p) => p.trim().length > 0);
  }
  if (typeof raw === "string") {
    return raw.split("\n").map((p) => p.trim()).filter((p) => p.length > 0);
  }
  return [];
}

export function LeadershipWorkspace({
  initialLeadership = [],
}: {
  initialLeadership: LeadershipRecord[];
}) {
  const [leaders, setLeaders] = useState<LeadershipRecord[]>(initialLeadership);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [editingLeader, setEditingLeader] = useState<LeadershipRecord | null>(null);
  const [expandedBios, setExpandedBios] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    imageUrl: "",
    imageAlt: "",
    summary: "",
    biographyText: "",
    displayOrder: 0,
    isPublished: true,
  });

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const toggleBioExpand = (id: string) => {
    setExpandedBios((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      position: "",
      imageUrl: "",
      imageAlt: "",
      summary: "",
      biographyText: "",
      displayOrder: leaders.length + 1,
      isPublished: true,
    });
    setEditingLeader(null);
    setModalMode("ADD");
  };

  const openEditModal = (leader: LeadershipRecord) => {
    setEditingLeader(leader);
    const bios = parseBiography(leader.biography);
    setFormData({
      name: leader.name || "",
      position: leader.position || "",
      imageUrl: leader.imageUrl || "",
      imageAlt: leader.imageAlt || leader.name || "",
      summary: leader.summary || "",
      biographyText: bios.join("\n\n"),
      displayOrder: leader.displayOrder ?? 0,
      isPublished: Boolean(leader.isPublished),
    });
    setModalMode("EDIT");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingLeader(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.position.trim() || !formData.imageUrl.trim()) {
      showNotice("error", "Name, Position, and Image URL are required.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("kind", "leadership");
      fd.append("name", formData.name.trim());
      fd.append("position", formData.position.trim());
      fd.append("imageUrl", formData.imageUrl.trim());
      fd.append("imageAlt", formData.imageAlt.trim() || formData.name.trim());
      fd.append("summary", formData.summary.trim());
      fd.append("biography", formData.biographyText.trim());
      fd.append("displayOrder", String(formData.displayOrder));
      if (formData.isPublished) fd.append("isPublished", "on");

      if (modalMode === "EDIT" && editingLeader) {
        fd.append("id", editingLeader.id);
        const res = await updateLandingContentAction(fd);
        if (res.success) {
          const updatedBios = formData.biographyText
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

          setLeaders((prev) =>
            prev.map((it) =>
              it.id === editingLeader.id
                ? {
                    ...it,
                    name: formData.name.trim(),
                    position: formData.position.trim(),
                    imageUrl: formData.imageUrl.trim(),
                    imageAlt: formData.imageAlt.trim() || formData.name.trim(),
                    summary: formData.summary.trim(),
                    biography: updatedBios,
                    displayOrder: formData.displayOrder,
                    isPublished: formData.isPublished,
                    updatedAt: new Date(),
                  }
                : it,
            ),
          );
          showNotice("success", "Leadership profile updated successfully.");
          closeModal();
        } else {
          showNotice("error", res.error || "Failed to update leadership profile.");
        }
      } else {
        const res = await createLandingContentAction(fd);
        if (res.success) {
          const newBios = formData.biographyText
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

          const newLeader: LeadershipRecord = {
            id: crypto.randomUUID(),
            name: formData.name.trim(),
            position: formData.position.trim(),
            imageUrl: formData.imageUrl.trim(),
            imageAlt: formData.imageAlt.trim() || formData.name.trim(),
            summary: formData.summary.trim(),
            biography: newBios,
            displayOrder: formData.displayOrder,
            isPublished: formData.isPublished,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setLeaders((prev) => [...prev, newLeader]);
          showNotice("success", "New leadership profile added successfully.");
          closeModal();
        } else {
          showNotice("error", res.error || "Failed to create leadership profile.");
        }
      }
    });
  };

  const handleTogglePublish = (leader: LeadershipRecord) => {
    const nextState = !leader.isPublished;
    startTransition(async () => {
      const res = await toggleLandingContentPublishAction("leadership", leader.id, nextState);
      if (res.success) {
        setLeaders((prev) =>
          prev.map((it) => (it.id === leader.id ? { ...it, isPublished: nextState } : it)),
        );
        showNotice("success", `Profile is now ${nextState ? "Live on website" : "Draft mode"}.`);
      } else {
        showNotice("error", res.error || "Failed to update publish state.");
      }
    });
  };

  const handleDelete = (leader: LeadershipRecord) => {
    if (!window.confirm(`Are you sure you want to delete profile for "${leader.name}"?`)) return;

    startTransition(async () => {
      const res = await deleteLandingContentAction("leadership", leader.id);
      if (res.success) {
        setLeaders((prev) => prev.filter((it) => it.id !== leader.id));
        showNotice("success", "Leadership profile deleted successfully.");
      } else {
        showNotice("error", res.error || "Failed to delete leadership profile.");
      }
    });
  };

  const filtered = leaders.filter((leader) => {
    if (statusFilter === "PUBLISHED" && !leader.isPublished) return false;
    if (statusFilter === "DRAFT" && leader.isPublished) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = leader.name?.toLowerCase().includes(q);
      const matchPos = leader.position?.toLowerCase().includes(q);
      const matchSum = leader.summary?.toLowerCase().includes(q);
      if (!matchName && !matchPos && !matchSum) return false;
    }
    return true;
  });

  const totalCount = leaders.length;
  const publishedCount = leaders.filter((l) => l.isPublished).length;
  const draftCount = totalCount - publishedCount;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-users" />
            <span>Landing Page CMS</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Executive Leadership
          </h1>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">
            Manage Institute leadership profiles, rectorate details, coordinators, bios, and designations.
          </p>
        </div>

        <button type="button" onClick={openAddModal} className={orangeButton}>
          <i className="fas fa-plus" />
          <span>Add Leader Profile</span>
        </button>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-semibold sm:text-sm ${
            notice.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`fas ${notice.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`} />
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-gray-400 hover:text-white"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Leaders
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <i className="fas fa-user-tie text-sm" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{totalCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">Official institutional leadership records</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Published on Website
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <i className="fas fa-circle-check text-sm" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{publishedCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">Live on KSITM Careers landing page</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Draft Profiles
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-500/10 text-gray-400">
              <i className="fas fa-eye-slash text-sm" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-gray-300">{draftCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">Hidden from public landing page</p>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101023] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <i className="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leader by name, position, or biography..."
            className={`${inputStyle} pl-9`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              <i className="fas fa-xmark" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setStatusFilter(mode)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === mode
                  ? "bg-orange-500 text-[#090915] shadow-md shadow-orange-500/20"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {mode === "ALL" && `All (${totalCount})`}
              {mode === "PUBLISHED" && `Published (${publishedCount})`}
              {mode === "DRAFT" && `Drafts (${draftCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Leadership Profiles Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#101023]/60 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-orange-400">
            <i className="fas fa-users text-2xl" />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">No leadership profiles found</h3>
          <p className="mt-1 max-w-sm text-xs text-gray-400">
            {search
              ? "No leaders match your current search query. Try another keyword."
              : "No leadership profiles on record yet. Add the Rector or coordinators to begin."}
          </p>
          <button type="button" onClick={openAddModal} className={`${orangeButton} mt-5`}>
            <i className="fas fa-plus" />
            <span>Add First Leader</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filtered.map((leader) => {
            const bios = parseBiography(leader.biography);
            const isBioExpanded = Boolean(expandedBios[leader.id]);

            return (
              <article
                key={leader.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#101023] p-5 sm:p-6 transition hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5"
              >
                <div>
                  {/* Top Header: Photo + Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/40">
                      <img
                        src={leader.imageUrl}
                        alt={leader.imageAlt || leader.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      {leader.displayOrder !== undefined && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-orange-400 border border-white/15">
                          #{leader.displayOrder}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            leader.isPublished
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-black/60 text-gray-400 border border-white/15"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              leader.isPublished ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
                            }`}
                          />
                          {leader.isPublished ? "Live" : "Draft"}
                        </span>
                      </div>

                      <h3 className="mt-1 text-base sm:text-lg font-black text-white group-hover:text-orange-400 transition">
                        {leader.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-orange-400/90">
                        {leader.position}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  {leader.summary && (
                    <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-gray-300">
                      <p className="line-clamp-3">{leader.summary}</p>
                    </div>
                  )}

                  {/* Biography Paragraphs */}
                  {bios.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Biography ({bios.length} paragraphs)
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleBioExpand(leader.id)}
                          className="text-[11px] font-semibold text-orange-400 hover:underline"
                        >
                          {isBioExpanded ? "Show Less" : "Read Full Bio"}
                        </button>
                      </div>

                      <div
                        className={`space-y-2 text-xs leading-relaxed text-gray-400 ${
                          !isBioExpanded ? "line-clamp-2" : ""
                        }`}
                      >
                        {bios.map((paragraph, idx) => (
                          <p key={idx} className="border-l-2 border-orange-500/30 pl-3">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(leader)}
                    disabled={isPending}
                    title={leader.isPublished ? "Set to draft" : "Publish to live landing page"}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition disabled:opacity-50"
                  >
                    <i className={`fas ${leader.isPublished ? "fa-eye-slash" : "fa-eye"}`} />
                    <span>{leader.isPublished ? "Move to Draft" : "Publish Live"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(leader)}
                      disabled={isPending}
                      className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-[#090915] transition"
                    >
                      <i className="fas fa-pen-to-square mr-1.5" />
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(leader)}
                      disabled={isPending}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition"
                    >
                      <i className="fas fa-trash-can" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(modalMode === "ADD" || modalMode === "EDIT") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-[#101023] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">
                  {modalMode === "ADD" ? "Add Leadership Profile" : "Edit Leadership Profile"}
                </h2>
                <p className="text-xs text-gray-400">
                  Update credentials, designations, and public biography for this leader.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-base"
              >
                <i className="fas fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Full Name & Titles <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Musa Ahmed Zayyad, MCPN, MNCS"
                    className={`${inputStyle} mt-1`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Official Position / Role <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Rector, KSITM"
                    className={`${inputStyle} mt-1`}
                  />
                </div>
              </div>

              {/* Photo Image URL & Live Preview */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Profile Photo URL <span className="text-orange-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://res.cloudinary.com/... or https://..."
                  className={`${inputStyle} mt-1`}
                />
                {formData.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-12 w-12 rounded-xl object-cover border border-white/20"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div>
                      <span className="text-xs font-bold text-white">Photo Preview</span>
                      <p className="text-[11px] text-gray-400 truncate max-w-sm">
                        {formData.imageUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Short Biography / Executive Summary <span className="text-orange-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="A concise 1-2 sentence executive summary of this leader's background..."
                  className={`${inputStyle} mt-1 resize-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Full Biography Paragraphs
                </label>
                <textarea
                  rows={6}
                  value={formData.biographyText}
                  onChange={(e) => setFormData({ ...formData, biographyText: e.target.value })}
                  placeholder="Write full biography. Enter paragraphs separated by blank lines..."
                  className={`${inputStyle} mt-1 text-xs resize-none`}
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Each paragraph separated by a blank line will be stored and rendered as an individual paragraph.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })
                    }
                    className={`${inputStyle} mt-1 font-mono`}
                  />
                  <p className="mt-1 text-[10px] text-gray-500">Lower numbers appear first (#1 Rector, etc.)</p>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 bg-[#090918] text-orange-500 accent-orange-500 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-gray-200">
                      Publish profile live on landing page
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={orangeButton}>
                  {isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check" />
                      <span>{modalMode === "ADD" ? "Create Leader" : "Save Changes"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
