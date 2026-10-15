/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  listVideoCenterVideosAction,
  listVideoCenterCategoriesAction,
  createVideoCenterVideoAction,
  updateVideoCenterVideoAction,
  deleteVideoCenterVideoAction,
  toggleVideoCenterPublishAction,
  type VideoCenterRecord,
  type CreateVideoInput,
  type UpdateVideoInput,
} from "@/actions/video-center";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function VideoCenterWorkspace({
  initialVideos = [],
}: {
  initialVideos?: any[];
}) {
  const [videos, setVideos] = useState<VideoCenterRecord[]>(() => {
    return initialVideos.map((v) => ({
      id: v.id,
      categoryId: v.categoryId || "",
      categoryName: v.categoryName || "Employability Skills",
      title: v.title,
      slug: v.slug || "",
      description: v.description || "",
      videoProvider: v.videoProvider || "youtube",
      videoUrl: v.videoUrl,
      videoId: v.videoId || "",
      thumbnailUrl: v.thumbnailUrl || null,
      instructor: v.instructor || null,
      durationMinutes: v.durationMinutes || null,
      displayOrder: v.displayOrder ?? 0,
      isPublished: Boolean(v.isPublished),
      createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
      updatedAt: v.updatedAt ? new Date(v.updatedAt) : new Date(),
    }));
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoCenterRecord | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    categoryName: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    instructor: string;
    displayOrder: number;
    isPublished: boolean;
  }>({
    title: "",
    categoryName: "Employability Skills",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    instructor: "",
    displayOrder: 0,
    isPublished: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [videoRows, catRows] = await Promise.all([
        listVideoCenterVideosAction(),
        listVideoCenterCategoriesAction(),
      ]);
      setVideos(videoRows);
      setCategories(catRows);
    } catch (err) {
      console.error("Failed to load video center data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingVideo(null);
    setFormData({
      title: "",
      categoryName: categories[0] || "Employability Skills",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      instructor: "",
      displayOrder: videos.length + 1,
      isPublished: true,
    });
    setModalMode("ADD");
  };

  const openEditModal = (video: VideoCenterRecord) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      categoryName: video.categoryName,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || "",
      instructor: video.instructor || "",
      displayOrder: video.displayOrder,
      isPublished: video.isPublished,
    });
    setModalMode("EDIT");
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert("Please enter a video title.");
      return;
    }
    if (!formData.videoUrl.trim()) {
      alert("Please enter a valid video URL.");
      return;
    }
    if (!formData.description.trim()) {
      alert("Please enter a description.");
      return;
    }

    startTransition(async () => {
      if (modalMode === "ADD") {
        const payload: CreateVideoInput = {
          title: formData.title,
          categoryName: formData.categoryName,
          description: formData.description,
          videoUrl: formData.videoUrl,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          instructor: formData.instructor || undefined,
          displayOrder: Number(formData.displayOrder) || 0,
          isPublished: formData.isPublished,
        };
        const res = await createVideoCenterVideoAction(payload);
        if (res.success && res.item) {
          setVideos((prev) => [...prev, res.item!]);
          setModalMode(null);
          setNotice("Video added to catalog successfully.");
          setTimeout(() => setNotice(null), 3500);
          loadData();
        } else {
          alert(res.error || "Failed to add video.");
        }
      } else if (modalMode === "EDIT" && editingVideo) {
        const payload: UpdateVideoInput = {
          id: editingVideo.id,
          title: formData.title,
          categoryName: formData.categoryName,
          description: formData.description,
          videoUrl: formData.videoUrl,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          instructor: formData.instructor || undefined,
          displayOrder: Number(formData.displayOrder) || 0,
          isPublished: formData.isPublished,
        };
        const res = await updateVideoCenterVideoAction(payload);
        if (res.success && res.item) {
          setVideos((prev) =>
            prev.map((v) => (v.id === editingVideo.id ? res.item! : v)),
          );
          setModalMode(null);
          setNotice("Video updated successfully.");
          setTimeout(() => setNotice(null), 3500);
          loadData();
        } else {
          alert(res.error || "Failed to update video.");
        }
      }
    });
  };

  const handleDelete = (video: VideoCenterRecord) => {
    if (confirm(`Delete video "${video.title}" from the institutional database?`)) {
      startTransition(async () => {
        const res = await deleteVideoCenterVideoAction(video.id);
        if (res.success) {
          setVideos((prev) => prev.filter((v) => v.id !== video.id));
          setNotice("Video deleted from catalog.");
          setTimeout(() => setNotice(null), 3500);
        } else {
          alert(res.error || "Failed to delete video.");
        }
      });
    }
  };

  const handleTogglePublish = (video: VideoCenterRecord) => {
    const nextState = !video.isPublished;
    startTransition(async () => {
      const res = await toggleVideoCenterPublishAction(video.id, nextState);
      if (res.success) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, isPublished: nextState } : v,
          ),
        );
      } else {
        alert(res.error || "Failed to update status.");
      }
    });
  };

  const filteredVideos = videos.filter((v) => {
    const matchCategory =
      categoryFilter === "ALL" || v.categoryName === categoryFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && v.isPublished) ||
      (statusFilter === "DRAFT" && !v.isPublished);
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      v.title.toLowerCase().includes(q) ||
      (v.instructor && v.instructor.toLowerCase().includes(q)) ||
      v.description.toLowerCase().includes(q);

    return matchCategory && matchStatus && matchSearch;
  });

  const publishedCount = videos.filter((v) => v.isPublished).length;
  const draftCount = videos.length - publishedCount;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
            <i className="fas fa-video text-xs" /> Modules Curriculum
          </div>
          <h2 className="font-academic mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Video Center & Skills Training
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-400">
            Publish educational video masterclasses, YouTube links, and HTTPS-hosted MP4 modules stored in the database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/training/preview"
            className={secondaryButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fas fa-external-link-alt text-orange-400 text-xs" />
            <span>Open Student Video Center</span>
          </Link>
          <button onClick={openAddModal} className={orangeButton}>
            <i className="fas fa-plus text-xs" />
            <span>Add Video</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-300">
          <i className="fas fa-check-circle" />
          <span>{notice}</span>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Total Videos
          </div>
          <div className="mt-1 text-2xl font-extrabold text-white">
            {videos.length}
          </div>
          <div className="text-[11px] text-gray-500">In institutional DB</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Published
          </div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-400">
            {publishedCount}
          </div>
          <div className="text-[11px] text-gray-500">Visible to students</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Drafts
          </div>
          <div className="mt-1 text-2xl font-extrabold text-amber-400">
            {draftCount}
          </div>
          <div className="text-[11px] text-gray-500">Hidden from students</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
            Categories
          </div>
          <div className="mt-1 text-2xl font-extrabold text-purple-400">
            {categories.length || 1}
          </div>
          <div className="text-[11px] text-gray-500">Learning tracks</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101023] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-3.5 top-3 text-xs text-gray-500" />
          <input
            type="text"
            placeholder="Search videos by title, instructor, or keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#090915] pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#090915] px-3 py-2 text-xs sm:text-sm text-gray-300 focus:border-orange-500 focus:outline-none"
          >
            <option value="ALL">All Categories ({videos.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#090915] px-3 py-2 text-xs sm:text-sm text-gray-300 focus:border-orange-500 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published only</option>
            <option value="DRAFT">Drafts only</option>
          </select>

          <button
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white"
            title="Refresh from DB"
          >
            <i className={`fas fa-sync-alt text-xs ${loading ? "fa-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Videos Catalog Grid */}
      {filteredVideos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#101023]/60 p-12 text-center">
          <i className="fas fa-film text-3xl text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-white">No learning videos found</h3>
          <p className="mt-1 text-xs text-gray-400">
            {search || categoryFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try adjusting your search filters above."
              : "Click 'Add Video' above to upload or link your first educational video."}
          </p>
          <button onClick={openAddModal} className={`${orangeButton} mt-4`}>
            <i className="fas fa-plus text-xs" /> Add First Video
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredVideos.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#101023] transition-all hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5"
            >
              <div>
                {/* Thumbnail / Provider Header */}
                <div className="relative aspect-video w-full bg-[#080812] overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : item.videoProvider === "youtube" ? (
                    <img
                      src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-950/40 to-slate-900">
                      <i className="fas fa-play-circle text-4xl text-orange-400/80" />
                    </div>
                  )}

                  {/* Provider tag */}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/10">
                    <i
                      className={
                        item.videoProvider === "youtube"
                          ? "fab fa-youtube text-red-400"
                          : "fas fa-video text-orange-400"
                      }
                    />
                    <span className="uppercase">{item.videoProvider}</span>
                  </div>

                  {/* Status Tag */}
                  <button
                    onClick={() => handleTogglePublish(item)}
                    disabled={isPending}
                    title="Click to toggle publish status"
                    className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
                      item.isPublished
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-white/10 text-gray-400 border border-white/15 hover:bg-white/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        item.isPublished ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    <span>{item.isPublished ? "Published" : "Draft"}</span>
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-orange-400">
                    <span className="rounded bg-orange-500/10 px-2 py-0.5 border border-orange-500/20">
                      {item.categoryName}
                    </span>
                    {item.instructor && (
                      <span className="text-gray-400 truncate">
                        • {item.instructor}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-orange-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="border-t border-white/5 bg-white/[0.02] p-3 flex items-center justify-between gap-2">
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-play text-[10px] text-orange-400" />
                  <span>Preview</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500/20 transition-all cursor-pointer"
                  >
                    <i className="fas fa-edit mr-1 text-[10px]" /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isPending}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    <i className="fas fa-trash-alt mr-1 text-[10px]" /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / Edit Video Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-[#0D0D20] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalMode === "ADD" ? "Add Learning Video" : "Edit Learning Video"}
                </h3>
                <p className="text-xs text-gray-400">
                  Data will be saved directly to the institutional PostgreSQL database.
                </p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mastering Technical & Behavioral Interviews"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={inputStyle}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">
                    Learning Category *
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="e.g. Employability Skills"
                    value={formData.categoryName}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryName: e.target.value })
                    }
                    className={inputStyle}
                  />
                  <datalist id="category-suggestions">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                    <option value="Resume & ATS Optimization" />
                    <option value="Interview Mastery" />
                    <option value="Technical Competencies" />
                    <option value="Workplace Readiness" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">
                    Instructor / Presenter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nura Sadiq (Career Directorate)"
                    value={formData.instructor}
                    onChange={(e) =>
                      setFormData({ ...formData, instructor: e.target.value })
                    }
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Video URL (YouTube or HTTPS MP4/WebM) *
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://..."
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  className={inputStyle}
                  required
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Supports YouTube standard URLs, youtu.be shortlinks, or direct HTTPS MP4/WebM media streams.
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Custom Thumbnail URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/... or leave blank for auto-detected YouTube thumbnail"
                  value={formData.thumbnailUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnailUrl: e.target.value })
                  }
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Video Description & Key Learning Points *
                </label>
                <textarea
                  rows={4}
                  placeholder="Summarize the core takeaways, student prerequisites, and competencies covered..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={inputStyle}
                  required
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <label className="flex items-center gap-2 font-semibold text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublished: e.target.checked })
                    }
                    className="accent-orange-500 h-4 w-4 rounded"
                  />
                  <span>Publish immediately to student video catalog</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className={secondaryButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSave}
                    className={orangeButton}
                  >
                    {isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save" /> Save Video
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
