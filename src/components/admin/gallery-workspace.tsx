/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition, useActionState, useRef } from "react";
import Image from "next/image";
import {
  createLandingContentAction,
  updateLandingContentAction,
  deleteLandingContentAction,
  toggleLandingContentPublishAction,
  bulkImportGalleryAction,
} from "@/actions/admin";

export interface GalleryItemRecord {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  imageAlt: string;
  displayOrder?: number;
  isPublished: boolean;
  createdAt?: Date | string;
}

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";
const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function GalleryWorkspace({
  initialGallery = [],
}: {
  initialGallery: GalleryItemRecord[];
}) {
  const [items, setItems] = useState<GalleryItemRecord[]>(initialGallery);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | "BULK" | null>(null);
  const [editingItem, setEditingItem] = useState<GalleryItemRecord | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    imageUrl: "",
    imageAlt: "",
    displayOrder: 0,
    isPublished: true,
  });

  const [bulkPayload, setBulkPayload] = useState("");

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const openAddModal = () => {
    setFormData({
      title: "",
      caption: "",
      imageUrl: "",
      imageAlt: "",
      displayOrder: items.length,
      isPublished: true,
    });
    setEditingItem(null);
    setModalMode("ADD");
  };

  const openEditModal = (item: GalleryItemRecord) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      caption: item.caption || "",
      imageUrl: item.imageUrl || "",
      imageAlt: item.imageAlt || item.title || "",
      displayOrder: item.displayOrder ?? 0,
      isPublished: Boolean(item.isPublished),
    });
    setModalMode("EDIT");
  };

  const openBulkModal = () => {
    setBulkPayload("");
    setModalMode("BULK");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingItem(null);
  };

  // Handle Save (Add or Edit)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.imageUrl.trim() || !formData.caption.trim()) {
      showNotice("error", "Title, Image URL, and Caption are required.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("kind", "gallery");
      fd.append("title", formData.title.trim());
      fd.append("caption", formData.caption.trim());
      fd.append("imageUrl", formData.imageUrl.trim());
      fd.append("imageAlt", formData.imageAlt.trim() || formData.title.trim());
      fd.append("displayOrder", String(formData.displayOrder));
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
                    caption: formData.caption.trim(),
                    imageUrl: formData.imageUrl.trim(),
                    imageAlt: formData.imageAlt.trim() || formData.title.trim(),
                    displayOrder: formData.displayOrder,
                    isPublished: formData.isPublished,
                  }
                : it,
            ),
          );
          showNotice("success", "Gallery image updated successfully.");
          closeModal();
        } else {
          showNotice("error", res.error || "Failed to update gallery image.");
        }
      } else {
        const res = await createLandingContentAction(fd);
        if (res.success) {
          const newItem: GalleryItemRecord = {
            id: crypto.randomUUID(),
            title: formData.title.trim(),
            caption: formData.caption.trim(),
            imageUrl: formData.imageUrl.trim(),
            imageAlt: formData.imageAlt.trim() || formData.title.trim(),
            displayOrder: formData.displayOrder,
            isPublished: formData.isPublished,
            createdAt: new Date(),
          };
          setItems((prev) => [newItem, ...prev]);
          showNotice("success", "New gallery image published successfully.");
          closeModal();
        } else {
          showNotice("error", res.error || "Failed to create gallery image.");
        }
      }
    });
  };

  // Toggle Publish
  const handleTogglePublish = (item: GalleryItemRecord) => {
    const nextState = !item.isPublished;
    startTransition(async () => {
      const res = await toggleLandingContentPublishAction("gallery", item.id, nextState);
      if (res.success) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, isPublished: nextState } : it)),
        );
        showNotice("success", `Gallery image is now ${nextState ? "Live" : "Draft"}.`);
      } else {
        showNotice("error", res.error || "Failed to update publish state.");
      }
    });
  };

  // Delete
  const handleDelete = (item: GalleryItemRecord) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteLandingContentAction("gallery", item.id);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        showNotice("success", "Gallery image removed successfully.");
      } else {
        showNotice("error", res.error || "Failed to delete gallery image.");
      }
    });
  };

  // Handle Bulk Import
  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPayload.trim()) {
      showNotice("error", "Please paste or select a JSON file containing Cloudinary image URLs.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("payload", bulkPayload.trim());
      const res = await bulkImportGalleryAction(null, fd);
      if (res.success) {
        showNotice("success", res.message || "Bulk gallery import completed.");
        closeModal();
        window.location.reload();
      } else {
        showNotice("error", res.error || "Failed to bulk import gallery images.");
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkPayload(String(event.target?.result || ""));
    };
    reader.readAsText(file);
  };

  // Filter items
  const filtered = items.filter((item) => {
    if (statusFilter === "PUBLISHED" && !item.isPublished) return false;
    if (statusFilter === "DRAFT" && item.isPublished) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchCaption = item.caption?.toLowerCase().includes(q);
      const matchAlt = item.imageAlt?.toLowerCase().includes(q);
      if (!matchTitle && !matchCaption && !matchAlt) return false;
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
            <i className="fas fa-images" />
            <span>Landing Page CMS</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Gallery Management
          </h1>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">
            Institutional gallery showcase and campus media asset management for the KSITM Careers portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={openBulkModal} className={secondaryButton}>
            <i className="fas fa-cloud-arrow-up text-orange-400" />
            <span>Bulk JSON Import</span>
          </button>
          <button type="button" onClick={openAddModal} className={orangeButton}>
            <i className="fas fa-plus" />
            <span>Add New Image</span>
          </button>
        </div>
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
              Total Gallery Assets
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <i className="fas fa-photo-film text-sm" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{totalCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">Live & draft photographs on record</p>
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
          <p className="mt-1 text-[11px] text-gray-500">Visible on public landing page</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Drafts / Hidden
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-500/10 text-gray-400">
              <i className="fas fa-eye-slash text-sm" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-gray-300">{draftCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">Internal drafts pending publication</p>
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
            placeholder="Search gallery by title, caption, or alt..."
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

      {/* Gallery Items Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#101023]/60 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-orange-400">
            <i className="fas fa-images text-2xl" />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">No gallery items found</h3>
          <p className="mt-1 max-w-sm text-xs text-gray-400">
            {search
              ? "No photos match your current search criteria. Try a different query."
              : "No gallery photographs on record yet. Add a new image to showcase campus life."}
          </p>
          <button type="button" onClick={openAddModal} className={`${orangeButton} mt-5`}>
            <i className="fas fa-plus" />
            <span>Add First Image</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101023] transition hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
                <img
                  src={item.imageUrl}
                  alt={item.imageAlt || item.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101023] via-transparent to-black/40" />

                {/* Published Status Pill */}
                <span
                  className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
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

                {item.displayOrder !== undefined && (
                  <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-400 border border-white/15">
                    #{item.displayOrder}
                  </span>
                )}
              </div>

              {/* Content Body */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="line-clamp-1 font-bold text-white group-hover:text-orange-400">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
                    {item.caption}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(item)}
                    disabled={isPending}
                    title={item.isPublished ? "Unpublish to draft" : "Publish to live landing page"}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-white transition disabled:opacity-50"
                  >
                    <i className={`fas ${item.isPublished ? "fa-eye-slash" : "fa-eye"}`} />
                    <span>{item.isPublished ? "Draft" : "Publish"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      disabled={isPending}
                      className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-[#090915] transition"
                    >
                      <i className="fas fa-pen-to-square mr-1" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={isPending}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition"
                    >
                      <i className="fas fa-trash-can" />
                    </button>
                  </div>
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
                  {modalMode === "ADD" ? "Add Gallery Image" : "Edit Gallery Image"}
                </h2>
                <p className="text-xs text-gray-400">
                  Fill in the image details to display in the KSITM Careers photo gallery.
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
              {/* Image Preview Box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Image URL <span className="text-orange-400">*</span>
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
                  <div className="mt-2 relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono text-gray-300">
                      Live Preview
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Image Title <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. KSITM ICT Innovation Hub"
                  className={`${inputStyle} mt-1`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Caption / Description <span className="text-orange-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Provide a brief context or description for this photo..."
                  className={`${inputStyle} mt-1 resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={formData.imageAlt}
                    onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                    placeholder="Short image alt description"
                    className={`${inputStyle} mt-1`}
                  />
                </div>
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
                </div>
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
                      <span>{modalMode === "ADD" ? "Create Image" : "Save Changes"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {modalMode === "BULK" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#101023] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">Bulk Cloudinary JSON Import</h2>
                <p className="text-xs text-gray-400">
                  Import multiple gallery photographs from a Cloudinary assets JSON manifest.
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

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Paste Cloudinary JSON Payload
                  </label>
                  <label className="cursor-pointer text-xs font-bold text-orange-400 hover:underline">
                    <span>Or upload .json file</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  required
                  rows={8}
                  value={bulkPayload}
                  onChange={(e) => setBulkPayload(e.target.value)}
                  placeholder='[ { "url": "https://res.cloudinary.com/..." }, ... ]'
                  className={`${inputStyle} mt-1 font-mono text-xs resize-none`}
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Duplicates and non-Cloudinary URLs are automatically skipped.
                </p>
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
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-arrow-up" />
                      <span>Start Bulk Import</span>
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
