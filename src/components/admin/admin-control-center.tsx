"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { ModulesWorkspace } from "@/components/admin/modules-workspace";
import { OfficerManagement } from "@/components/admin/officer-management";
import { AssessmentWorkspace } from "@/components/admin/assessment-workspace";
import { EmployabilityWorkspace } from "@/components/admin/employability-workspace";
import { StudentsWorkspace } from "@/components/admin/students-workspace";
import { AppointmentSchedulerWorkspace } from "@/components/admin/appointment-scheduler-workspace";
import { ProfileSettingsModal } from "@/components/profile/profile-settings-modal";
import { moduleCatalog } from "@/lib/modules";
import {
  bulkImportGalleryAction,
  createLandingContentAction,
  deleteLandingContentAction,
  deleteTrainingVideoAction,
  markAppointmentAttendanceAction,
  updateLandingContentAction,
  updateTrainingVideoAction,
} from "@/actions/admin";

type Appointment = {
  id: string;
  studentName: string;
  status: string;
  scheduledStart: Date;
  staffName: string | null;
};
type Gallery = {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  imageAlt: string;
  isPublished: boolean;
};
type Leader = {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  imageAlt: string;
  summary: string;
  biography: unknown;
  isPublished: boolean;
};
type Announcement = {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
};
type TrainingVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoId: string;
  videoProvider: string;
  thumbnailUrl: string | null;
  instructor: string | null;
  isPublished: boolean;
  categoryName: string;
};

type Officer = {
  id: string;
  userId: string;
  fullName: string;
  staffCode: string | null;
  designation: string | null;
  email: string;
  isActive: boolean;
  canManageAppointments: boolean;
  canManageServices: boolean;
  createdAt: Date;
};

type StudentOverview = {
  id: string;
  fullName: string;
  regNumber: string;
  department: string | null;
  level: string | null;
  email: string;
  isActive: boolean;
  createdAt: Date;
};

type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
};

type SubmenuItem = {
  id: string;
  slug?: string;
  label: string;
  category?: string;
  tag?: string;
  icon?: string;
};

type NavItem = {
  id: string;
  icon: string;
  label: string;
  badge?: string;
  submenus?: SubmenuItem[];
};

const orangeButton =
  "rounded-xl bg-[#FF7F24] px-4 py-2.5 text-xs font-extrabold text-[#0A0A1A] transition hover:bg-[#40297B] hover:text-white disabled:opacity-50";
const input =
  "w-full rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF7F24]";

function ContentForm({
  kind,
  title,
  fields,
}: {
  kind: string;
  title: string;
  fields: {
    name: string;
    label: string;
    textarea?: boolean;
    required?: boolean;
  }[];
}) {
  const [state, action, pending] = useActionState(
    async (_: { success?: boolean; error?: string } | null, data: FormData) =>
      createLandingContentAction(data),
    null,
  );
  return (
    <form
      action={action}
      className="rounded-2xl border border-white/10 bg-[#101023] p-5 space-y-3"
    >
      <input type="hidden" name="kind" value={kind} />
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">
          Changes are saved to the CMS and published content can be updated
          without a deployment.
        </p>
      </div>
      {fields.map((field) => (
        <label
          key={field.name}
          className="block text-xs font-semibold text-gray-300"
        >
          {field.label}
          {field.textarea ? (
            <textarea
              name={field.name}
              required={field.required}
              className={`${input} mt-1 min-h-20`}
            />
          ) : (
            <input
              name={field.name}
              required={field.required}
              className={`${input} mt-1`}
            />
          )}
        </label>
      ))}
      <label className="flex items-center gap-2 text-xs text-gray-300">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked
          className="accent-[#FF7F24]"
        />{" "}
        Publish immediately
      </label>
      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-emerald-300">Saved successfully.</p>
      )}
      <button className={orangeButton} disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

export function AdminControlCenter({
  appointments,
  gallery,
  leadership,
  announcements,
  training,
  officers = [],
  students = [],
  logs = [],
  defaultTab = "modules",
}: {
  appointments: Appointment[];
  gallery: Gallery[];
  leadership: Leader[];
  announcements: Announcement[];
  training: TrainingVideo[];
  officers?: Officer[];
  students?: StudentOverview[];
  logs?: AuditLogRow[];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(() => {
    if (defaultTab === "assessments" || defaultTab === "readiness") return "modules";
    return defaultTab || "modules";
  });
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(() => {
    if (defaultTab === "assessments" || defaultTab === "readiness") return "readiness";
    return "readiness";
  });
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [pinnedMenu, setPinnedMenu] = useState<string | null>("modules");
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>(
    { modules: defaultTab === "modules" },
  );
  const [createSection, setCreateSection] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [submenuFilter, setSubmenuFilter] = useState("");
  const [canScrollSubmenu, setCanScrollSubmenu] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const submenuScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const trigger = menuButton.current;
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
      if (event.key === "Tab") {
        const items = document.querySelectorAll<HTMLElement>(
          "#workspace-navigation button, #workspace-navigation a",
        );
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
      trigger?.focus();
    };
  }, [mobileNavOpen]);

  const [pending, startTransition] = useTransition();

  const MODULE_ICONS: Record<string, string> = {
    readiness: "fa-clipboard-check",
    training: "fa-graduation-cap",
    resume: "fa-file-alt",
    internship: "fa-laptop-code",
    employers: "fa-handshake",
    jobs: "fa-briefcase",
    "career-fair": "fa-calendar-check",
    appointments: "fa-clock",
  };

  const moduleSubmenus: SubmenuItem[] = moduleCatalog.map((item) => ({
    id: item.slug,
    slug: item.slug,
    label: item.title,
    icon: MODULE_ICONS[item.slug] || "fa-layer-group",
  }));

  const websiteSubmenus: SubmenuItem[] = [
    {
      id: "gallery",
      label: "Campus Gallery",
      icon: "fa-images",
    },
    {
      id: "leadership",
      label: "Executive Leadership",
      icon: "fa-users",
    },
    {
      id: "announcements",
      label: "Updates & Announcements",
      icon: "fa-bullhorn",
    },
  ];

  const staffSubmenus: SubmenuItem[] = [
    {
      id: "officers",
      label: "Officers Directory",
      icon: "fa-address-book",
    },
  ];

  const nav: NavItem[] = [
    {
      id: "modules",
      icon: "fa-layer-group",
      label: "Modules",
      badge: "8",
      submenus: moduleSubmenus,
    },
    {
      id: "students",
      icon: "fa-user-graduate",
      label: "Students",
      badge: String(students.length),
    },
    { id: "overview", icon: "fa-chart-line", label: "Overview" },
    {
      id: "staff",
      icon: "fa-user-tie",
      label: "Career staff",
      submenus: staffSubmenus,
    },
    {
      id: "appointments",
      icon: "fa-calendar-check",
      label: "Appointment Scheduler",
    },
    {
      id: "website",
      icon: "fa-window-maximize",
      label: "Landing page",
      submenus: websiteSubmenus,
    },
    { id: "services", icon: "fa-briefcase", label: "Career services" },
    {
      id: "opportunities",
      icon: "fa-laptop-house",
      label: "Internships & jobs",
    },
    { id: "employers", icon: "fa-building", label: "Employer engagement" },
  ];

  const handleMenuEnter = (id: string, hasSubmenus: boolean) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (hasSubmenus) {
      setHoveredMenu(id);
    } else {
      setHoveredMenu(null);
    }
  };

  const handleMenuLeave = () => {
    hoverTimer.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 280);
  };

  const handleSubmenuEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };

  const handleSubmenuLeave = () => {
    hoverTimer.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 280);
  };

  const handleMenuClick = (id: string, hasSubmenus: boolean) => {
    setActive(id);
    if (hasSubmenus) {
      setPinnedMenu(id);
      setHoveredMenu(id);
      if (id === "modules") {
        setActiveSubmenu(null);
      }
    } else {
      setPinnedMenu(null);
      setHoveredMenu(null);
    }
    setMobileNavOpen(false);
  };

  const handleSubmenuClick = (parentId: string, subId: string) => {
    setActive(parentId);
    setActiveSubmenu(subId);
    setPinnedMenu(null);
    setHoveredMenu(null);
    setMobileNavOpen(false);
  };

  const toggleMobileAccordion = (id: string) => {
    setMobileExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const extendedMenuId =
    hoveredMenu || (pinnedMenu === active ? pinnedMenu : null);
  const extendedNav = nav.find((n) => n.id === extendedMenuId);

  const submenus = extendedNav?.submenus || [];
  const filteredSubmenus = !submenuFilter.trim()
    ? submenus
    : submenus.filter((s) => {
        const q = submenuFilter.toLowerCase();
        return (
          s.label.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.tag?.toLowerCase().includes(q)
        );
      });

  const checkSubmenuScroll = () => {
    const el = submenuScrollRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 8;
    setCanScrollSubmenu(hasMore);
  };

  useEffect(() => {
    checkSubmenuScroll();
  }, [filteredSubmenus, extendedMenuId]);

  const approve = (id: string, attended: boolean) =>
    startTransition(async () => {
      await markAppointmentAttendanceAction(id, attended);
    });

  return (
    <div className="relative">
      {/* Mobile Floating Trigger Button */}
      <button
        ref={menuButton}
        type="button"
        aria-expanded={mobileNavOpen}
        aria-controls="workspace-navigation"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="lg:hidden fixed left-4 top-20 z-40 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2.5 text-xs font-extrabold text-[#0A0A1A] shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
      >
        <i className="fas fa-bars mr-1.5" /> Workspace menu
      </button>

      {mobileNavOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close workspace menu"
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Primary Desktop Sidebar Rail (Tier 1) */}
      <aside className="hidden lg:flex fixed left-0 top-14 bottom-0 z-30 w-64 flex-col border-r border-white/[0.08] bg-[#080814]/98 backdrop-blur-2xl">
        <div className="h-16 px-4 border-b border-white/[0.08] flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
            K
          </span>
          <div className="leading-tight truncate">
            <span className="font-academic text-sm font-semibold tracking-wide text-white block truncate">
              KSITM Careers
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block truncate">
              Super Admin Rail
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {nav.map((item) => {
            const isCurrent = active === item.id;
            const isHovered = hoveredMenu === item.id;
            const hasSub = Boolean(item.submenus?.length);
            return (
              <div
                key={item.id}
                onMouseEnter={() => handleMenuEnter(item.id, hasSub)}
                onMouseLeave={handleMenuLeave}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => handleMenuClick(item.id, hasSub)}
                  className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all duration-150 ${
                    isCurrent
                      ? "bg-white/[0.08] text-white font-medium border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
                      : isHovered
                        ? "bg-white/[0.04] text-white border border-transparent"
                        : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200 border border-transparent"
                  }`}
                >
                  {/* Matching Left Amber Active Accent */}
                  {isCurrent && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                  )}

                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <i
                      aria-hidden="true"
                      className={`fas ${item.icon} w-4 text-center text-xs transition-colors shrink-0 ${
                        isCurrent
                          ? "text-orange-400"
                          : "text-gray-500 group-hover:text-gray-200"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                          isCurrent
                            ? "bg-orange-500/15 text-orange-300 font-semibold"
                            : "bg-white/[0.06] text-gray-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {hasSub && (
                      <svg
                        className={`h-3 w-3 transition-transform duration-200 ${
                          isCurrent || isHovered
                            ? "text-orange-400 translate-x-0.5"
                            : "text-gray-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.08]">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs font-medium text-gray-400 hover:border-orange-500/30 hover:text-white transition-all"
          >
            <i className="fas fa-external-link-alt text-orange-400 text-[10px]" />
            <span>View Public Portal</span>
          </Link>
        </div>
      </aside>

      {/* Extended Submenu Sidebar Flyout Panel (Tier 2 Desktop) */}
      <aside
        className={`hidden lg:flex fixed left-64 top-14 bottom-0 z-20 w-72 flex-col border-r border-white/[0.08] bg-[#080814]/90 backdrop-blur-2xl transition-all duration-300 ease-out ${
          extendedMenuId && extendedNav?.submenus?.length
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "-translate-x-3 opacity-0 pointer-events-none"
        }`}
        onMouseEnter={handleSubmenuEnter}
        onMouseLeave={handleSubmenuLeave}
      >
        {extendedNav && extendedNav.submenus && (
          <>
            <div className="h-16 px-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
              <div className="leading-tight truncate">
                <span className="text-[10px] font-mono tracking-widest uppercase text-orange-400/90 block truncate">
                  {extendedNav.label} Submenus
                </span>
                <span className="font-academic text-sm font-semibold tracking-wide text-white block truncate">
                  {extendedNav.id === "modules"
                    ? "Curriculum Modules"
                    : extendedNav.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinnedMenu(null);
                  setHoveredMenu(null);
                }}
                className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center text-xs shrink-0"
                title="Dismiss submenus"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Quick Filter Input */}
            {submenus.length > 6 && (
              <div className="p-2.5 border-b border-white/[0.04] shrink-0">
                <div className="relative">
                  <i className="fas fa-search absolute left-2.5 top-2.5 text-[10px] text-gray-500" />
                  <input
                    type="text"
                    placeholder="Filter tracks…"
                    value={submenuFilter}
                    onChange={(e) => setSubmenuFilter(e.target.value)}
                    className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] pl-7 pr-3 py-1 text-[11px] text-gray-200 placeholder-gray-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                  />
                </div>
              </div>
            )}

            <div
              ref={submenuScrollRef}
              onScroll={checkSubmenuScroll}
              className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar [scrollbar-width:thin]"
            >
              {filteredSubmenus.map((sub) => {
                const isSubActive =
                  active === extendedNav.id && activeSubmenu === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSubmenuClick(extendedNav.id, sub.id)}
                    className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all duration-150 ${
                      isSubActive
                        ? "bg-white/[0.08] text-white font-medium border border-white/15 shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                        : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200 border border-transparent"
                    }`}
                  >
                    {/* Matching Left Amber Active Accent */}
                    {isSubActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                    )}

                    <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                      <i
                        aria-hidden="true"
                        className={`fas ${sub.icon || "fa-cube"} w-4 text-center text-xs shrink-0 transition-colors ${
                          isSubActive
                            ? "text-orange-400"
                            : "text-gray-500 group-hover:text-gray-300"
                        }`}
                      />
                      <span
                        className={`truncate text-xs font-medium ${
                          isSubActive
                            ? "text-white"
                            : "text-gray-300 group-hover:text-white"
                        }`}
                      >
                        {sub.label}
                      </span>
                    </div>

                    <span
                      className={`ml-2 w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                        isSubActive
                          ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                          : "bg-emerald-500/40 group-hover:bg-emerald-400/70"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Subtle Bouncing Scroll Indicator when scrollable */}
            {canScrollSubmenu && (
              <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center z-20">
                <div className="animate-bounce flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 text-[10px] text-orange-300 backdrop-blur-md shadow-lg shadow-black/40">
                  <span className="text-[9px] font-mono tracking-wider">Scroll</span>
                  <i className="fas fa-chevron-down text-[8px]" />
                </div>
              </div>
            )}
          </>
        )}
      </aside>

      {/* Mobile Off-Canvas Drawer (< lg) */}
      <aside
        id="workspace-navigation"
        role="dialog"
        aria-modal={mobileNavOpen || undefined}
        aria-label="Workspace navigation"
        inert={!mobileNavOpen}
        className={`${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        } fixed bottom-0 left-0 top-0 z-[60] w-[min(22rem,90vw)] overflow-y-auto border-r border-white/[0.08] bg-[#080814]/98 backdrop-blur-2xl p-4 shadow-2xl transition-transform duration-300 lg:hidden`}
      >
        <div className="flex items-center justify-between mb-4 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
              K
            </span>
            <div className="leading-tight">
              <span className="font-academic text-sm font-semibold tracking-wide text-white block">
                KSITM Careers
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 block">
                Super Admin Mobile
              </span>
            </div>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 hover:text-white flex items-center justify-center text-xs"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <nav className="space-y-1">
          {nav.map((item) => {
            const isCurrent = active === item.id;
            const hasSub = Boolean(item.submenus?.length);
            const isExpanded = mobileExpanded[item.id];
            return (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMenuClick(item.id, hasSub)}
                    className={`group relative flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all duration-150 ${
                      isCurrent
                        ? "bg-white/[0.08] text-white font-medium border border-white/15 shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                        : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200 border border-transparent"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                    )}
                    <div className="flex items-center gap-2.5 truncate">
                      <i
                        aria-hidden="true"
                        className={`fas ${item.icon} w-4 text-center text-xs shrink-0 ${
                          isCurrent ? "text-orange-400" : "text-gray-500 group-hover:text-gray-200"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                          isCurrent
                            ? "bg-orange-500/15 text-orange-300 font-semibold"
                            : "bg-white/[0.06] text-gray-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {hasSub && (
                    <button
                      type="button"
                      onClick={() => toggleMobileAccordion(item.id)}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 text-gray-400 hover:text-white"
                      aria-label={`Toggle ${item.label} submenus`}
                    >
                      <svg
                        className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90 text-orange-400" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Submenus Accordion on Mobile */}
                {hasSub && isExpanded && item.submenus && (
                  <div className="pl-3 space-y-1 border-l border-white/[0.08] ml-3 py-1">
                    {item.submenus.map((sub) => {
                      const isSubActive =
                        active === item.id && activeSubmenu === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSubmenuClick(item.id, sub.id)}
                          className={`group relative flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-all ${
                            isSubActive
                              ? "bg-white/[0.08] text-white font-medium border border-white/15"
                              : "text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                          }`}
                        >
                          {isSubActive && (
                            <span className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-r bg-orange-400" />
                          )}
                          <div className="flex items-center gap-2.5 truncate min-w-0">
                            <i
                              aria-hidden="true"
                              className={`fas ${sub.icon || "fa-cube"} text-xs w-3.5 text-center shrink-0 ${
                                isSubActive ? "text-orange-400" : "text-gray-500"
                              }`}
                            />
                            <span className="truncate">{sub.label}</span>
                          </div>
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ml-1.5 ${
                              isSubActive ? "bg-emerald-400" : "bg-emerald-500/40"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-white/[0.08] pt-4 space-y-2">
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors cursor-pointer"
          >
            <i className="fas fa-user-circle text-orange-400 text-sm" />
            <span>Profile & Security</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 text-xs text-gray-400 hover:text-orange-400"
          >
            <i className="fas fa-external-link-alt" /> View public site
          </Link>
        </div>
      </aside>

      {/* Main Workspace Environment */}
      <section className="min-w-0 flex-1 space-y-6 lg:ml-64 lg:pl-6">
        {active === "modules" && (
          activeSubmenu === "readiness" ? (
            <AssessmentWorkspace />
          ) : activeSubmenu === "training" ? (
            <EmployabilityWorkspace />
          ) : (
            <ModulesWorkspace
              activeModuleSlug={activeSubmenu}
              onSelectModule={(slug) => setActiveSubmenu(slug || null)}
            />
          )
        )}
        {active === "students" && <StudentsWorkspace />}
        {active === "staff" && <OfficerManagement initialOfficers={officers} />}
        {active === "overview" && (
          <div className="space-y-8">
            {/* Executive Metrics Strip */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                  Enrolled Students
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {students.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Active student accounts
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                  Career Officers
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#FF7F24] mt-1">
                  {officers.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Staff advisors & officers
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                  Services Catalog
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">
                  7
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Institutional offerings
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                  System Health
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                  100%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Neon DB operational
                </p>
              </div>
            </section>

            {/* Quick workspace navigation */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                [
                  "Website CMS",
                  "Edit landing page sections, gallery, leadership and updates",
                  "website",
                ],
                [
                  "Appointments",
                  `${appointments.length} requests and scheduled sessions`,
                  "appointments",
                ],
                [
                  "Student services",
                  "Approve attendance and activate career tools",
                  "services",
                ],
                ["Training videos", "Manage learning videos", "training"],
                [
                  "Job Readiness Assessment",
                  "Build readiness questions and objective examinations",
                  "readiness",
                ],
                [
                  "Opportunities",
                  "Publish internships, jobs and career fairs",
                  "opportunities",
                ],
              ].map(([title, description, id]) => (
                <button
                  key={id}
                  onClick={() => {
                    if (id === "readiness") {
                      setActive("modules");
                      setActiveSubmenu("readiness");
                    } else {
                      setActive(id);
                    }
                  }}
                  className="rounded-2xl border border-white/10 bg-[#101023] p-5 text-left transition hover:-translate-y-1 hover:border-[#FF7F24]/60"
                >
                  <i className="fas fa-arrow-right float-right text-[#FF7F24]" />
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    {description}
                  </p>
                </button>
              ))}
            </div>

            {/* Registered Students Overview */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    Recently Enrolled Students
                  </h2>
                  <p className="text-gray-400 text-xs">
                    Students registered via KSITM matriculation credentials.
                  </p>
                </div>
              </div>

              <div className="bg-[#101023] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">Reg Number</th>
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">Department & Level</th>
                        <th className="px-6 py-4">Email Address</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {students.map((st) => (
                        <tr key={st.id} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-mono font-bold text-[#FF7F24] text-xs">
                            {st.regNumber}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {st.fullName}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <div>{st.department || "General"}</div>
                            <div className="text-gray-500">
                              {st.level || "ND"}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {st.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Module Governance & Audit Trail (Strictly module related content, NO USER_LOGIN) */}
            <section className="space-y-4">
              <h2 className="text-xl font-extrabold text-white">
                Module Governance & Audit Trail
              </h2>
              <p className="text-gray-400 text-xs">
                Audit log of curriculum initialization, publishing, and
                assignment activity.
              </p>
              <div className="bg-[#101023] border border-white/10 rounded-2xl p-5 divide-y divide-white/5 space-y-3">
                {logs.length === 0 ? (
                  <p className="text-xs text-gray-500 py-3">
                    No module audit records yet.
                  </p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="pt-3 first:pt-0 flex items-start justify-between gap-4 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-orange-400 uppercase">
                          {log.action}
                        </span>{" "}
                        <span className="text-gray-400">
                          on {log.entityType}
                        </span>
                      </div>
                      <div className="text-gray-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
        {active === "website" && (
          <div className="space-y-8">
            <div className="grid gap-5 xl:grid-cols-3">
              <CreateCard
                title="Gallery"
                count={gallery.length}
                onClick={() =>
                  setCreateSection(
                    createSection === "gallery" ? null : "gallery",
                  )
                }
              />{" "}
              <CreateCard
                title="Leadership"
                count={leadership.length}
                onClick={() =>
                  setCreateSection(
                    createSection === "leadership" ? null : "leadership",
                  )
                }
              />{" "}
              <CreateCard
                title="Updates"
                count={announcements.length}
                onClick={() =>
                  setCreateSection(
                    createSection === "announcement" ? null : "announcement",
                  )
                }
              />
            </div>
            {createSection === "gallery" && (
              <>
                <ContentForm
                  kind="gallery"
                  title="Create gallery item"
                  fields={[
                    { name: "title", label: "Title", required: true },
                    { name: "imageUrl", label: "Image URL", required: true },
                    { name: "imageAlt", label: "Alt text" },
                    {
                      name: "caption",
                      label: "Caption",
                      textarea: true,
                      required: true,
                    },
                  ]}
                />
                <BulkGalleryImport />
              </>
            )}
            {createSection === "leadership" && (
              <ContentForm
                kind="leadership"
                title="Create leadership profile"
                fields={[
                  { name: "name", label: "Name", required: true },
                  { name: "position", label: "Position", required: true },
                  {
                    name: "imageUrl",
                    label: "Profile image URL",
                    required: true,
                  },
                  {
                    name: "summary",
                    label: "Short biography",
                    textarea: true,
                    required: true,
                  },
                  {
                    name: "biography",
                    label: "Full biography (one paragraph per line)",
                    textarea: true,
                    required: true,
                  },
                ]}
              />
            )}
            {createSection === "announcement" && (
              <ContentForm
                kind="announcement"
                title="Create update"
                fields={[
                  { name: "title", label: "Title", required: true },
                  { name: "summary", label: "Summary", required: true },
                  {
                    name: "content",
                    label: "Content",
                    textarea: true,
                    required: true,
                  },
                  { name: "imageUrl", label: "Optional image URL" },
                ]}
              />
            )}
            <LandingContentCrud
              gallery={gallery}
              leadership={leadership}
              announcements={announcements}
            />
          </div>
        )}
        {active === "services" && (
          <div className="grid gap-5 xl:grid-cols-2">
            <ContentForm
              kind="service"
              title="Add career service"
              fields={[
                { name: "title", label: "Service name", required: true },
                { name: "slug", label: "Slug", required: true },
                { name: "summary", label: "Summary", required: true },
                { name: "description", label: "Description", textarea: true },
                { name: "icon", label: "Font Awesome icon (e.g. fa-file-alt)" },
              ]}
            />
            <div className="rounded-2xl border border-white/10 bg-[#101023] p-5">
              <h3 className="font-bold text-white">Service access rule</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Career staff assess each student. Super Admin can review the
                resulting entitlements from the staff workspace. Approved
                attendance can activate the student’s remaining career services.
              </p>
              <button
                onClick={() => setActive("appointments")}
                className={`${orangeButton} mt-4`}
              >
                Review attendance
              </button>
            </div>
          </div>
        )}
        {active === "training" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-400">
                Add YouTube videos or HTTPS-hosted MP4/WebM files. Students
                receive the same learning library after access is activated.
              </p>
              <Link href="/training/preview" className={orangeButton}>
                Open video center
              </Link>
            </div>
            <ContentForm
              kind="training"
              title="Add learning video"
              fields={[
                { name: "title", label: "Video title", required: true },
                { name: "category", label: "Category", required: true },
                {
                  name: "videoUrl",
                  label: "YouTube or direct video URL",
                  required: true,
                },
                { name: "thumbnailUrl", label: "Optional thumbnail URL" },
                { name: "instructor", label: "Instructor" },
                {
                  name: "description",
                  label: "Description",
                  textarea: true,
                  required: true,
                },
              ]}
            />
            <TrainingCrud items={training} />
          </div>
        )}
        {active === "appointments" && (
          <AppointmentSchedulerWorkspace officers={officers} />
        )}
        {active === "assessments" && <AssessmentWorkspace />}
        {active === "opportunities" && (
          <Placeholder
            title="Virtual internships, job board and Career Fair Management"
            body="Publish opportunities with employer, deadline, location, application method and event details."
          />
        )}
        {active === "employers" && (
          <Placeholder
            title="Employer engagement"
            body="Manage partner organizations, announcements, career events and employer opportunities."
          />
        )}
      </section>

      {profileModalOpen && (
        <ProfileSettingsModal onClose={() => setProfileModalOpen(false)} />
      )}
    </div>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101023] p-6">
      <h2 className="text-xl font-extrabold text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">{body}</p>
      <span className="mt-5 inline-flex rounded-full border border-[#FF7F24]/30 bg-[#FF7F24]/10 px-3 py-1.5 text-xs font-bold text-[#FF7F24]">
        Module ready for content
      </span>
    </div>
  );
}

function CreateCard({
  title,
  count,
  onClick,
}: {
  title: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-[#101023] p-5 text-left transition hover:border-[#FF7F24]/60 hover:bg-[#40297B]"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-extrabold text-white">{title}</span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-[#FF7F24]">
          {count} records
        </span>
      </div>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#FF7F24]">
        Create new <i className="fas fa-plus" />
      </span>
    </button>
  );
}

function BulkGalleryImport() {
  const [payload, setPayload] = useState("");
  const [state, action, pending] = useActionState(
    bulkImportGalleryAction,
    null,
  );
  return (
    <form
      action={action}
      className="rounded-2xl border border-[#FF7F24]/30 bg-[#101023] p-5 space-y-3"
    >
      <div>
        <h3 className="font-bold text-white">Bulk import Cloudinary gallery</h3>
        <p className="mt-1 text-xs text-gray-400">
          Upload the cloudinary-assets.json file generated by the resolver.
          Existing image URLs are skipped automatically.
        </p>
      </div>
      <input type="hidden" name="payload" value={payload} />
      <input
        type="file"
        accept=".json,application/json"
        className="block w-full text-xs text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#FF7F24] file:px-3 file:py-2 file:font-bold file:text-[#0A0A1A]"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) setPayload(await file.text());
        }}
      />
      {payload && (
        <p className="text-xs text-emerald-300">
          Asset file loaded and ready to import.
        </p>
      )}
      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-emerald-300">{state.message}</p>
      )}
      <button disabled={pending || !payload} className={orangeButton}>
        {pending ? "Importing..." : "Import gallery assets"}
      </button>
    </form>
  );
}

function TrainingCrud({ items }: { items: TrainingVideo[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101023] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">
            Learning videos ({items.length})
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Edit, publish or remove student training records.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-gray-500">
            No learning videos have been added.
          </p>
        ) : (
          items.map((item) =>
            editing === item.id ? (
              <form
                key={item.id}
                action={async (data) => {
                  const result = await updateTrainingVideoAction(data);
                  if (result.success) setEditing(null);
                }}
                className="space-y-3 rounded-xl border border-[#FF7F24]/40 bg-[#0A0A1A] p-4"
              >
                <input type="hidden" name="id" value={item.id} />
                <Field name="title" label="Title" value={item.title} />
                <Field
                  name="videoUrl"
                  label="YouTube or direct video URL"
                  value={item.videoUrl}
                />
                <Field
                  name="thumbnailUrl"
                  label="Thumbnail URL"
                  value={item.thumbnailUrl || ""}
                />
                <Field
                  name="instructor"
                  label="Instructor"
                  value={item.instructor || ""}
                />
                <Field
                  name="description"
                  label="Description"
                  value={item.description}
                  textarea
                />
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    name="isPublished"
                    defaultChecked={item.isPublished}
                    className="accent-[#FF7F24]"
                  />{" "}
                  Published
                </label>
                <div className="flex gap-2">
                  <button className={orangeButton}>Save changes</button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[.03]"
              >
                {item.thumbnailUrl || item.videoProvider === "youtube" ? (
                  <Image
                    src={
                      item.thumbnailUrl ||
                      `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`
                    }
                    alt=""
                    width={640}
                    height={360}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-black text-gray-400">
                    Video
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="mt-1 text-xs text-gray-400">
                        {item.categoryName}
                        {item.instructor ? ` · ${item.instructor}` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isPublished ? "bg-emerald-500/10 text-emerald-300" : "bg-white/10 text-gray-400"}`}
                    >
                      {item.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs text-gray-400">
                    {item.description}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(item.id)}
                      className="rounded-lg border border-[#FF7F24]/40 px-3 py-1.5 text-xs font-bold text-[#FF7F24]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => {
                        if (window.confirm("Delete this training video?"))
                          startDelete(() => {
                            void deleteTrainingVideoAction(item.id);
                          });
                      }}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ),
          )
        )}
      </div>
    </section>
  );
}

function LandingContentCrud({
  gallery,
  leadership,
  announcements,
}: {
  gallery: Gallery[];
  leadership: Leader[];
  announcements: Announcement[];
}) {
  return (
    <div className="space-y-6">
      <CrudGroup
        title={`Gallery (${gallery.length})`}
        kind="gallery"
        items={gallery}
      />
      <CrudGroup
        title={`Leadership (${leadership.length})`}
        kind="leadership"
        items={leadership}
      />
      <CrudGroup
        title={`Updates (${announcements.length})`}
        kind="announcement"
        items={announcements}
      />
    </div>
  );
}

function CrudGroup({
  title,
  kind,
  items,
}: {
  title: string;
  kind: string;
  items: (Gallery | Leader | Announcement)[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101023] p-5">
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-white/10 p-6 text-sm text-gray-500">
          No records yet. Use the creation form above.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <EditableContent key={item.id} kind={kind} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function EditableContent({
  kind,
  item,
}: {
  kind: string;
  item: Gallery | Leader | Announcement;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (_: { success?: boolean; error?: string } | null, data: FormData) => {
      const result = await updateLandingContentAction(data);
      if (result.success) setEditing(false);
      return result;
    },
    null,
  );
  const [deleting, startDelete] = useTransition();
  const leader = kind === "leadership" ? (item as Leader) : null;
  const gallery = kind === "gallery" ? (item as Gallery) : null;
  const announcement = kind === "announcement" ? (item as Announcement) : null;
  const biography = leader
    ? Array.isArray(leader.biography)
      ? leader.biography.join("\n")
      : String(leader.biography || "")
    : "";
  const remove = () => {
    if (window.confirm("Delete this public content?"))
      startDelete(async () => {
        await deleteLandingContentAction(kind, item.id);
      });
  };
  if (!editing)
    return (
      <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[.03]">
        <div className="flex items-start gap-4 p-4">
          {gallery && (
            <Image
              src={gallery.imageUrl}
              alt={gallery.imageAlt}
              width={96}
              height={80}
              className="h-20 w-24 shrink-0 rounded-lg border border-white/10 object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">
                  {gallery?.title || leader?.name || announcement?.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                  {gallery?.caption ||
                    leader?.position ||
                    announcement?.summary}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isPublished ? "bg-emerald-500/10 text-emerald-300" : "bg-white/10 text-gray-400"}`}
                >
                  {item.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-[#FF7F24]/40 px-3 py-1.5 text-xs font-bold text-[#FF7F24] hover:bg-[#40297B] hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={remove}
                  disabled={deleting}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  return (
    <form
      action={action}
      className="rounded-xl border border-[#FF7F24]/40 bg-[#0A0A1A] p-4 space-y-3"
    >
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="kind" value={kind} />
      {kind === "gallery" && (
        <>
          <Field name="title" label="Title" value={gallery?.title} />
          <Field name="imageUrl" label="Image URL" value={gallery?.imageUrl} />
          <Field name="imageAlt" label="Alt text" value={gallery?.imageAlt} />
          <Field
            name="caption"
            label="Caption"
            value={gallery?.caption}
            textarea
          />
        </>
      )}
      {kind === "leadership" && (
        <>
          <Field name="name" label="Name" value={leader?.name} />
          <Field name="position" label="Position" value={leader?.position} />
          <Field name="imageUrl" label="Image URL" value={leader?.imageUrl} />
          <Field name="imageAlt" label="Alt text" value={leader?.imageAlt} />
          <Field
            name="summary"
            label="Summary"
            value={leader?.summary}
            textarea
          />
          <Field
            name="biography"
            label="Biography"
            value={biography}
            textarea
          />
        </>
      )}
      {kind === "announcement" && (
        <>
          <Field name="title" label="Title" value={announcement?.title} />
          <Field name="summary" label="Summary" value={announcement?.summary} />
          <Field
            name="content"
            label="Content"
            value={announcement?.content}
            textarea
          />
          <Field
            name="imageUrl"
            label="Image URL"
            value={announcement?.imageUrl || ""}
          />
        </>
      )}
      <label className="flex items-center gap-2 text-xs text-gray-300">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={item.isPublished}
          className="accent-[#FF7F24]"
        />{" "}
        Published
      </label>
      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className={orangeButton}>
          {pending ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-gray-300 hover:bg-[#40297B] hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  value,
  textarea,
}: {
  name: string;
  label: string;
  value?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-gray-300">
      {label}
      {textarea ? (
        <textarea
          name={name}
          defaultValue={value}
          required
          className={`${input} mt-1 min-h-16`}
        />
      ) : (
        <input
          name={name}
          defaultValue={value}
          required
          className={`${input} mt-1`}
        />
      )}
    </label>
  );
}
