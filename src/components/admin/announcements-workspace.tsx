/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import {
  createLandingContentAction,
  updateLandingContentAction,
  deleteLandingContentAction,
  toggleLandingContentPublishAction,
} from "@/actions/admin";

export interface AnnouncementRecord {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
}

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";
const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function AnnouncementsWorkspace({
  initialAnnouncements = [],
}: {
  initialAnnouncements: AnnouncementRecord[];
}) {
  const [items, setItems] = useState<AnnouncementRecord[]>(initialAnnouncements);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [editingItem, setEditingItem] = useState<AnnouncementRecord | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    imageUrl: "",
    isPublished: true,
  });

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const openAddModal = () => {
    setFormData({
      title: "",
      summary: "",
      content: "",
      imageUrl: "",
      isPublished: true,
    });
    setEditingItem(null);
    setModalMode("ADD");
  };

  const openEditModal = (item: AnnouncementRecord) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      imageUrl: item.imageUrl || "",
      isPublished: Boolean(item.isPublished),
    });
    setModalMode("EDIT");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingItem(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.summary.trim() || !formData.content.trim()) {
      showNotice("error", "Title, Summary, and Content are required.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("kind", "announcement");
      fd.append("title", formData.title.trim());
      fd.append("summary", formData.summary.trim());
      fd.append("content", formData.content.trim());
      if (formData.imageUrl.trim()) fd.append("imageUrl", formData.imageUrl.trim());
      if (formData.isPublished) fd.append("isPublished", "on");

      if (modalMode === "EDIT" && editingItem) {
        fd.append("id", editingItem.id);
        const res = await updateLandingContentAction(fd);
        if (res.success) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === editingItem.id
                ? {
                    ...it,
                    title: formData.title.trim(),
                    summary: formData.summary.trim(),
                    content: formData.content.trim(),
                    imageUrl: formData.imageUrl.trim() || null,
                    isPublished: formData.isPublished,
                  }
                : it,
            ),
          );
          showNotice("success", "Update saved successfully.");
          closeModal();
        } else {
          showNotice("error", res.error || "Failed to update announcement.");
        }
      } else {
        const res = await createLandingContentAction(fd);
        if (res.success) {
          const newItem: AnnouncementRecord = {
            id: crypto.randomUUID(),
            title: formData.title.trim(),
            summary: formData.summary.trim(),
            content: formData.content.trim(),
            imageUrl: formData.imageUrl.trim() || null,
            isPublished: formData.isPublished,
            publishedAt: formData.isPublished ? new Date() : null,
            createdAt: new Date(),
          };
          setItems((prev) => [newItem, ...prev]);
          showNotice("success", "New update published successfully.");
          closeModal();
        } else {
          showNotice("error", res.error || "Failed to create announcement.");
        }
      }
    });
  };

  const handleTogglePublish = (item: AnnouncementRecord) => {
    const nextState = !item.isPublished;
    startTransition(async () => {
      const res = await toggleLandingContentPublishAction("announcement", item.id, nextState);
      if (res.success) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, isPublished: nextState } : it)),
        );
        showNotice("success", `Announcement is now ${nextState ? "Live" : "Draft"}.`);
      } else {
        showNotice("error", res.error || "Failed to update status.");
      }
    });
  };

  const handleDelete = (item: AnnouncementRecord) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteLandingContentAction("announcement", item.id);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        showNotice("success", "Announcement removed successfully.");
      } else {
        showNotice("error", res.error || "Failed to delete announcement.");
      }
    });
  };

  const filtered = items.filter((item) => {
    if (statusFilter === "PUBLISHED" && !item.isPublished) return false;
    if (statusFilter === "DRAFT" && item.isPublished) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchSum = item.summary?.toLowerCase().includes(q);
      const matchCont = item.content?.toLowerCase().includes(q);
      if (!matchTitle && !matchSum && !matchCont) return false;
    }
    return true;
  });

  const totalCount = items.length;
  const publishedCount = items.filter((i) => i.isPublished).length;
  const draftCount = totalCount - publishedCount;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-bullhorn" />
            <span>Landing Page CMS</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Updates & Announcements
          </h1>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">
            Publish and manage institutional news bulletins, career advisories, and campus notices.
          </p>
        </div>

        <button type="button" onClick={openAddModal} className={orangeButton}>
          <i className="fas fa-plus" />
          <span>Create New Update</span>
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
              Total Announcements
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <i className="fas fa-bullhorn text-sm" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{totalCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">Live & draft announcements on record</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Published Live
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <i className="fas fa-circle-check text-sm" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{publishedCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">Active and visible to students</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Drafts / Archived
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-500/10 text-gray-400">
              <i className="fas fa-eye-slash text-sm" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-gray-300">{draftCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">Pending or unpublished notices</p>
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
            placeholder="Search announcements by title or content..."
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

      {/* Announcements List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#101023]/60 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-orange-400">
            <i className="fas fa-bullhorn text-2xl" />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">No announcements found</h3>
          <p className="mt-1 max-w-sm text-xs text-gray-400">
            {search
              ? "No notices match your current search query. Try another keyword."
              : "No announcements created yet. Post a new update for students and employers."}
          </p>
          <button type="button" onClick={openAddModal} className={`${orangeButton} mt-5`}>
            <i className="fas fa-plus" />
            <span>Create First Update</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#101023] p-5 sm:p-6 transition hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 sm:flex-row sm:items-start gap-5"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.isPublished
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-black/60 text-gray-400 border border-white/15"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        item.isPublished ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    {item.isPublished ? "Live" : "Draft"}
                  </span>

                  {item.createdAt && (
                    <span className="text-[11px] text-gray-500">
                      Posted {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-black text-white group-hover:text-orange-400 transition">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm font-semibold text-gray-300">
                  {item.summary}
                </p>

                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                  {item.content}
                </p>

                {item.imageUrl && (
                  <div className="pt-2">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-24 w-auto rounded-xl object-cover border border-white/10"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(item)}
                  disabled={isPending}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
                >
                  <i className={`fas mr-1.5 ${item.isPublished ? "fa-eye-slash" : "fa-eye"}`} />
                  {item.isPublished ? "Unpublish" : "Publish"}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    disabled={isPending}
                    className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-[#090915] transition"
                  >
                    <i className="fas fa-pen-to-square mr-1.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={isPending}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition"
                  >
                    <i className="fas fa-trash-can" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(modalMode === "ADD" || modalMode === "EDIT") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#101023] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">
                  {modalMode === "ADD" ? "Create New Update" : "Edit Update"}
                </h2>
                <p className="text-xs text-gray-400">
                  Compose announcement text, teaser summary, and optional banner image.
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Update Title <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. KSITM Annual Career & Tech Fair 2026 Registration Open"
                  className={`${inputStyle} mt-1`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Summary / Teaser <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Short one-line headline summary"
                  className={`${inputStyle} mt-1`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Full Content Body <span className="text-orange-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full text of the announcement..."
                  className={`${inputStyle} mt-1 text-xs resize-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Optional Banner Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className={`${inputStyle} mt-1`}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-[#090918] text-orange-500 accent-orange-500 focus:ring-0"
                />
                <span className="text-xs font-semibold text-gray-200">
                  Publish immediately (live on landing page)
                </span>
              </label>

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
                      <span>{modalMode === "ADD" ? "Publish Update" : "Save Changes"}</span>
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
