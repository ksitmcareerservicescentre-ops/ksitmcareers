/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useTransition } from "react";
import {
  listEmployabilityResourcesAction,
  createEmployabilityResourceAction,
  updateEmployabilityResourceAction,
  deleteEmployabilityResourceAction,
  seedStandardEmployabilityResourcesAction,
  incrementResourceViewAction,
  type EmployabilityResourceItem,
} from "@/actions/training";

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const cardStyle =
  "rounded-2xl border border-white/[0.08] bg-[#0c0c1e]/80 p-5 backdrop-blur-sm transition-all hover:border-white/20";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

const CATEGORIES = [
  "All Categories",
  "Resume & ATS",
  "Technical Skills",
  "Interview Mastery",
  "Workplace Ethics",
  "Job Search Strategy",
  "Capstone & Portfolios",
];

export function EmployabilityWorkspace() {
  const [resources, setResources] = useState<EmployabilityResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EmployabilityResourceItem | null>(null);
  const [pending, startTransition] = useTransition();

  const loadResources = async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listEmployabilityResourcesAction();
      setResources(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load employability resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    listEmployabilityResourcesAction()
      .then((items) => {
        if (active) setResources(items);
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load employability resources.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = resources.filter((r) => {
    const matchCat = categoryFilter === "All Categories" || r.category === categoryFilter;
    const matchSearch =
      !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.whyShared.toLowerCase().includes(search.toLowerCase()) ||
      r.uploaderName.toLowerCase().includes(search.toLowerCase()) ||
      r.howToUse.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSeed = () => {
    if (confirm("Seed or restore the 4 Standard Academic Career Resources?")) {
      startTransition(async () => {
        const res = await seedStandardEmployabilityResourcesAction();
        if (res.success) {
          setSuccessMsg("Standard career materials seeded successfully!");
          await loadResources();
          setTimeout(() => setSuccessMsg(""), 3000);
        } else {
          setError(res.error || "Failed to seed resources.");
        }
      });
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      startTransition(async () => {
        const res = await deleteEmployabilityResourceAction(id);
        if (res.success) {
          await loadResources();
        } else {
          setError(res.error || "Failed to delete resource.");
        }
      });
    }
  };

  const handleOpenLink = (id: string, url: string) => {
    incrementResourceViewAction(id);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-graduation-cap text-xs" />
            <span>Curriculum Module · Employability Skills Training</span>
          </div>
          <h1 className="font-academic mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Employability Skills Training
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Upload document shares, guides, and career roadmaps with verified author profiles and actionable student directives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={handleSeed}
            className={secondaryButton}
            title="Seed standard curriculum resources"
          >
            <i className="fas fa-magic text-orange-400" />
            <span>Seed 4 Standards</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setEditorOpen(true);
            }}
            className={orangeButton}
          >
            <i className="fas fa-cloud-upload-alt" />
            <span>Upload Resource</span>
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
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Total Materials
            </span>
            <i className="fas fa-book-open text-orange-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {resources.length}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Verified educational uploads</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Curriculum Tracks
            </span>
            <i className="fas fa-tags text-cyan-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {new Set(resources.map((r) => r.category)).size}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Distinct skill disciplines</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Student Engagements
            </span>
            <i className="fas fa-eye text-emerald-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {resources.reduce((acc, curr) => acc + curr.viewCount, 0)}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Access & download counts</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Faculty Masters
            </span>
            <i className="fas fa-chalkboard-teacher text-purple-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {new Set(resources.map((r) => r.uploaderName)).size}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Contributing career masters</p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3.5 top-3.5 text-xs text-gray-500" />
            <input
              type="text"
              placeholder="Search resources by title, uploader, or rationale…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#090918] pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === "grid" ? "bg-orange-500 text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              <i className="fas fa-th-large mr-1" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === "list" ? "bg-orange-500 text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              <i className="fas fa-list mr-1" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <i className="fas fa-spinner fa-spin text-2xl text-orange-400 mb-2 block" />
          <span>Loading curriculum materials…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-[#0e0e22]/50 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-2xl">
            <i className="fas fa-folder-open" />
          </div>
          <h3 className="font-academic text-xl font-bold text-white">No Educational Materials Found</h3>
          <p className="mx-auto max-w-md text-xs text-gray-400 leading-relaxed">
            Upload document links, curriculum guides, and cheat sheets for KSITM students or seed the 4 standard templates.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button type="button" onClick={handleSeed} className={orangeButton}>
              <i className="fas fa-magic" />
              <span>Seed 4 Standard Career Resources</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ResourceCard
              key={item.id}
              resource={item}
              onOpen={handleOpenLink}
              onEdit={(r) => {
                setEditingItem(r);
                setEditorOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c1e] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">Resource & Category</th>
                  <th className="py-3 px-3">Uploader Profile</th>
                  <th className="py-3 px-3 text-center">Type</th>
                  <th className="py-3 px-3 text-center">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 max-w-xs sm:max-w-md">
                      <div className="font-academic text-sm font-bold text-white truncate">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="rounded-md border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate max-w-xs">
                          {item.whyShared}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        {item.uploaderAvatarUrl ? (
                          <img
                            src={item.uploaderAvatarUrl}
                            alt={item.uploaderName}
                            className="h-7 w-7 rounded-full object-cover border border-white/20"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30">
                            {item.uploaderName[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white text-xs leading-none">
                            {item.uploaderName}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{item.uploaderRole}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center">
                      <span className="inline-block rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                        {item.resourceType}
                      </span>
                    </td>

                    <td className="py-4 px-3 text-center font-mono font-bold text-white">
                      {item.viewCount}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenLink(item.id, item.resourceAddress)}
                          className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-400 hover:bg-orange-500 hover:text-black transition-all"
                        >
                          Access
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setEditorOpen(true);
                          }}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 hover:text-white"
                        >
                          <i className="fas fa-pen" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/20"
                        >
                          <i className="fas fa-trash" />
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

      {/* Resource Editor Modal */}
      {editorOpen && (
        <ResourceEditorModal
          resource={editingItem}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            loadResources();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// RESOURCE CARD COMPONENT
// ============================================================
function ResourceCard({
  resource,
  onOpen,
  onEdit,
  onDelete,
}: {
  resource: EmployabilityResourceItem;
  onOpen: (id: string, url: string) => void;
  onEdit: (r: EmployabilityResourceItem) => void;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-5 sm:p-6 transition-all hover:border-orange-500/40 hover:shadow-xl space-y-5">
      <div className="space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-lg border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
            {resource.category}
          </span>
          <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
            {resource.resourceType}
          </span>
        </div>

        {/* Title & Address */}
        <div>
          <h3 className="font-academic text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug">
            {resource.title}
          </h3>
          <p className="text-[11px] text-gray-500 truncate mt-1">
            <i className="fas fa-link mr-1 text-gray-600" />
            {resource.resourceAddress}
          </p>
        </div>

        {/* Why Shared Section */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-orange-300 flex items-center gap-1.5">
            <i className="fas fa-lightbulb text-[9px]" />
            <span>Why This Resource Was Shared</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
            {resource.whyShared}
          </p>
        </div>

        {/* How to Use Section */}
        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <i className="fas fa-tasks text-[9px]" />
            <span>How to Use / Student Directive</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
            {resource.howToUse}
          </p>
        </div>

        {/* Uploader Profile Badge */}
        <div className="rounded-xl border border-white/[0.08] bg-[#090918] p-3.5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {resource.uploaderAvatarUrl ? (
              <img
                src={resource.uploaderAvatarUrl}
                alt={resource.uploaderName}
                className="h-10 w-10 rounded-full object-cover border border-orange-500/30 shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 text-orange-400 font-bold text-sm border border-orange-500/30">
                {resource.uploaderName[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{resource.uploaderName}</div>
              <div className="text-[10px] text-gray-400 truncate">{resource.uploaderRole}</div>
              {resource.uploaderBio && (
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{resource.uploaderBio}</p>
              )}
            </div>
          </div>

          {resource.uploaderLinkedIn && (
            <a
              href={resource.uploaderLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 text-[10px] font-bold text-blue-400 transition-colors shrink-0"
              title="Author Web / Profile Link"
            >
              <i className={resource.uploaderLinkedIn.includes("linkedin.com") ? "fab fa-linkedin" : resource.uploaderLinkedIn.includes("github.com") ? "fab fa-github" : "fas fa-external-link-alt"} />
              <span>{resource.uploaderLinkedIn.includes("linkedin.com") ? "LinkedIn" : resource.uploaderLinkedIn.includes("github.com") ? "GitHub" : "Link"}</span>
            </a>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 gap-2">
        <button
          type="button"
          onClick={() => onOpen(resource.id, resource.resourceAddress)}
          className={orangeButton}
        >
          <i className="fas fa-external-link-alt text-xs" />
          <span>Access / Open Resource</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(resource)}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white flex items-center justify-center text-xs"
            title="Edit Resource"
          >
            <i className="fas fa-pen" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(resource.id, resource.title)}
            className="w-8 h-8 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center text-xs"
            title="Delete Resource"
          >
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RESOURCE EDITOR MODAL
// ============================================================
function ResourceEditorModal({
  resource,
  onClose,
  onSaved,
}: {
  resource: EmployabilityResourceItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(resource?.title || "");
  const [category, setCategory] = useState(resource?.category || "Technical Skills");
  const [resourceType, setResourceType] = useState(resource?.resourceType || "DOCUMENT");
  const [resourceAddress, setResourceAddress] = useState(resource?.resourceAddress || "");
  const [whyShared, setWhyShared] = useState(resource?.whyShared || "");
  const [howToUse, setHowToUse] = useState(resource?.howToUse || "");
  const [targetAudience, setTargetAudience] = useState(resource?.targetAudience || "All Students");
  const [isPublished, setIsPublished] = useState(resource?.isPublished ?? true);

  // Uploader Details
  const [uploaderName, setUploaderName] = useState(resource?.uploaderName || "");
  const [uploaderRole, setUploaderRole] = useState(resource?.uploaderRole || "Career Staff Officer");
  const [uploaderAvatarUrl, setUploaderAvatarUrl] = useState(resource?.uploaderAvatarUrl || "");
  const [uploaderBio, setUploaderBio] = useState(resource?.uploaderBio || "");
  const [uploaderLinkedIn, setUploaderLinkedIn] = useState(resource?.uploaderLinkedIn || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Resource title is required.");
      return;
    }
    if (!resourceAddress.trim()) {
      setError("Please provide a valid file share URL, document link, or web address.");
      return;
    }
    if (!whyShared.trim()) {
      setError("Please provide the context/rationale explaining why you shared this resource.");
      return;
    }
    if (!howToUse.trim()) {
      setError("Please provide actionable instructions on how students should use this material.");
      return;
    }
    if (uploaderLinkedIn.trim()) {
      try {
        const u = new URL(uploaderLinkedIn.trim());
        if (!["http:", "https:"].includes(u.protocol)) {
          setError("Profile / web link must start with http:// or https://");
          return;
        }
      } catch {
        setError("Please enter a valid web link / URL format (e.g. https://...)");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      if (resource) {
        const res = await updateEmployabilityResourceAction(resource.id, {
          title,
          category,
          resourceType,
          resourceAddress,
          whyShared,
          howToUse,
          targetAudience,
          isPublished,
          uploaderName,
          uploaderRole,
          uploaderAvatarUrl,
          uploaderBio,
          uploaderLinkedIn,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createEmployabilityResourceAction({
          title,
          category,
          resourceType,
          resourceAddress,
          whyShared,
          howToUse,
          targetAudience,
          isPublished,
          customUploaderName: uploaderName,
          customUploaderRole: uploaderRole,
          customUploaderAvatar: uploaderAvatarUrl,
          customUploaderBio: uploaderBio,
          customUploaderLinkedIn: uploaderLinkedIn,
        });
        if (!res.success) throw new Error(res.error);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save resource.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Sticky Top Header with Proportionate Space and Prominent Close Button */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4 shadow-md">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block truncate">
              Employability Skills Training Repository
            </span>
            <h2 className="font-academic text-lg sm:text-2xl font-black text-white truncate">
              {resource ? "Edit Educational Resource" : "Upload Educational Resource"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-all shadow-sm cursor-pointer shrink-0"
            title="Close form"
          >
            <i className="fas fa-times text-sm text-orange-400" />
            <span>Close</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Resource Title Card */}
          <div className="rounded-2xl border-2 border-orange-500/40 bg-orange-500/[0.05] p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <i className="fas fa-book text-orange-400 text-sm" />
                <span>Resource Title <span className="text-red-400">*</span></span>
              </label>
              <span className="text-[10px] sm:text-xs font-mono text-orange-400 uppercase tracking-wider font-semibold">
                Required Field
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. KSITM Official ATS-Optimized Technical CV Template (2026 Edition)"
              className="w-full rounded-xl border border-white/20 bg-[#0c0c1e] px-4 py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 focus:outline-none font-bold transition-all shadow-xs"
              autoFocus
            />
          </div>

          {/* Classification & URL Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Category / Discipline:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputStyle}
              >
                <option value="Resume & ATS">Resume & ATS</option>
                <option value="Technical Skills">Technical Skills</option>
                <option value="Interview Mastery">Interview Mastery</option>
                <option value="Workplace Ethics">Workplace Ethics</option>
                <option value="Job Search Strategy">Job Search Strategy</option>
                <option value="Capstone & Portfolios">Capstone & Portfolios</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Resource Format:</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className={inputStyle}
              >
                <option value="DOCUMENT">Document / DOCX / PDF</option>
                <option value="SLIDES">Slides Presentation</option>
                <option value="SPREADSHEET">Spreadsheet / Matrix</option>
                <option value="EXTERNAL_GUIDE">Interactive Guide / Article</option>
                <option value="REPOSITORY">Code Repository / GitHub</option>
                <option value="VIDEO_LESSON">Recorded Video Masterclass</option>
                <option value="OTHER">Other Material</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Target Cohort:</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. All Students, Final Year ND II"
                className={inputStyle}
              />
            </div>
          </div>

          {/* File or Document Share URL or Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>File Share URL, Document Link, or Address <span className="text-red-400">*</span></span>
              <span className="text-[11px] text-gray-500 font-normal">Google Drive, OneDrive, PDF, Dropbox, GitHub</span>
            </label>
            <input
              type="url"
              value={resourceAddress}
              onChange={(e) => setResourceAddress(e.target.value)}
              placeholder="https://docs.google.com/document/d/... or https://github.com/..."
              className={inputStyle}
            />
          </div>

          {/* Pedagogical Rationale & Directives */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                <i className="fas fa-lightbulb text-xs" />
                <span>Why Did You Share This Resource? <span className="text-red-400">*</span></span>
              </label>
              <textarea
                rows={4}
                value={whyShared}
                onChange={(e) => setWhyShared(e.target.value)}
                placeholder="Explain the academic rationale or industry context. E.g., 'Over 68% of fresh polytechnic graduates get filtered by automated ATS because...'"
                className={`${inputStyle} resize-none`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <i className="fas fa-tasks text-xs" />
                <span>How to Use / What to Do With It? <span className="text-red-400">*</span></span>
              </label>
              <textarea
                rows={4}
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="Provide clear, actionable student steps. E.g., '1. Make a copy. 2. Fill in your ND projects using the STAR method. 3. Export as PDF.'"
                className={`${inputStyle} resize-none`}
              />
            </div>
          </div>

          {/* Uploader Profile Badge Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0d21] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <i className="fas fa-id-card" />
                <span>Faculty Uploader Profile Information</span>
              </h4>
              <span className="text-[11px] text-gray-500">Visible on resource cards</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400">Uploader Full Name:</label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="e.g. Engr. Mallam Kabir Sani"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400">Academic / Advisory Role:</label>
                <input
                  type="text"
                  value={uploaderRole}
                  onChange={(e) => setUploaderRole(e.target.value)}
                  placeholder="e.g. Director of Career Advisory & Tech Mentorship"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400">Avatar / Photo URL:</label>
                <input
                  type="url"
                  value={uploaderAvatarUrl}
                  onChange={(e) => setUploaderAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or image link"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-[11px] text-blue-400 font-semibold flex items-center justify-between">
                  <span>Author Profile / Web Link:</span>
                  <span className="text-[10px] text-gray-500 font-normal">Supports all links &amp; URLs</span>
                </label>
                <input
                  type="url"
                  value={uploaderLinkedIn}
                  onChange={(e) => setUploaderLinkedIn(e.target.value)}
                  placeholder="https://... (e.g. LinkedIn, Portfolio, Website, Drive, GitHub)"
                  className={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-400">About / Short Bio:</label>
              <input
                type="text"
                value={uploaderBio}
                onChange={(e) => setUploaderBio(e.target.value)}
                placeholder="e.g. 15+ years in technical recruitment and polytechnic career steering."
                className={inputStyle}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/[0.08] pt-4">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-white/20 text-orange-500 focus:ring-0"
              />
              <span>Published & immediately accessible to students</span>
            </label>

            <div className="flex items-center gap-3 justify-end">
              <button type="button" onClick={onClose} className={secondaryButton}>
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className={orangeButton}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check" />
                    <span>Save Educational Resource</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
