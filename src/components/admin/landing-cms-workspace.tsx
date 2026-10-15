/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  listHeroSlidesAction,
  createHeroSlideAction,
  updateHeroSlideAction,
  deleteHeroSlideAction,
  listCareerServicesCmsAction,
  createCareerServiceAction,
  updateCareerServiceAction,
  deleteCareerServiceAction,
  listTestimonialsCmsAction,
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  getFooterCmsDataAction,
  createFooterLinkAction,
  updateFooterLinkAction,
  deleteFooterLinkAction,
  updateSiteContactInfoAction,
  saveSocialLinkAction,
  deleteSocialLinkAction,
  type FooterCmsData,
  type CreateHeroSlideInput,
  type CreateCareerServiceInput,
  type CreateTestimonialInput,
  type CreateFooterLinkInput,
  type UpdateSiteContactInput,
  type SaveSocialLinkInput,
} from "@/actions/landing-cms";
import type {
  HeroSlideRecord,
  CareerServiceRecord,
  TestimonialRecord,
  FooterLinkRecord,
  SocialLinkRecord,
} from "@/db/schema";

interface LandingCmsWorkspaceProps {
  initialActiveTab?: string | null;
  onTabChange?: (tab: string) => void;
}

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";
const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

const SOCIAL_PLATFORMS: Record<string, { label: string; icon: string }> = {
  LINKEDIN: { label: "LinkedIn", icon: "fab fa-linkedin-in" },
  YOUTUBE: { label: "YouTube", icon: "fab fa-youtube" },
  INSTAGRAM: { label: "Instagram", icon: "fab fa-instagram" },
  X_TWITTER: { label: "X (Twitter)", icon: "fab fa-x-twitter" },
  FACEBOOK: { label: "Facebook", icon: "fab fa-facebook-f" },
  TIKTOK: { label: "TikTok", icon: "fab fa-tiktok" },
  WHATSAPP: { label: "WhatsApp", icon: "fab fa-whatsapp" },
};

export function LandingCmsWorkspace({
  initialActiveTab,
  onTabChange,
}: LandingCmsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<
    "HERO" | "SERVICES" | "TESTIMONIALS" | "FOOTER"
  >(() => {
    if (initialActiveTab === "services") return "SERVICES";
    if (initialActiveTab === "testimonials") return "TESTIMONIALS";
    if (initialActiveTab === "footer") return "FOOTER";
    return "HERO";
  });

  // Synchronize when parent changes submenu
  useEffect(() => {
    if (initialActiveTab === "hero") setActiveTab("HERO");
    else if (initialActiveTab === "services") setActiveTab("SERVICES");
    else if (initialActiveTab === "testimonials") setActiveTab("TESTIMONIALS");
    else if (initialActiveTab === "footer") setActiveTab("FOOTER");
  }, [initialActiveTab]);

  const switchTab = (tab: "HERO" | "SERVICES" | "TESTIMONIALS" | "FOOTER") => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab.toLowerCase());
    }
  };

  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  // 1. Hero Slides
  const [heroSlidesList, setHeroSlidesList] = useState<HeroSlideRecord[]>([]);
  const [heroLoading, setHeroLoading] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState<HeroSlideRecord | "NEW" | null>(null);

  // 2. Career Services
  const [servicesList, setServicesList] = useState<CareerServiceRecord[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingService, setEditingService] = useState<CareerServiceRecord | "NEW" | null>(null);

  // 3. Testimonials
  const [testimonialsList, setTestimonialsList] = useState<TestimonialRecord[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialRecord | "NEW" | null>(null);

  // 4. Footer Data
  const [footerData, setFooterData] = useState<FooterCmsData>({
    serviceLinks: [],
    resourceLinks: [],
    contactInfo: null,
    socialLinks: [],
  });
  const [footerLoading, setFooterLoading] = useState(false);
  const [editingFooterLink, setEditingFooterLink] = useState<{
    link: FooterLinkRecord | null;
    category: "SERVICES" | "RESOURCES";
  } | null>(null);
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLinkRecord | "NEW" | null>(null);
  const [contactForm, setContactForm] = useState<UpdateSiteContactInput>({});

  // Data Loaders
  const loadHeroSlides = async () => {
    setHeroLoading(true);
    const rows = await listHeroSlidesAction();
    setHeroSlidesList(rows);
    setHeroLoading(false);
  };

  const loadCareerServices = async () => {
    setServicesLoading(true);
    const rows = await listCareerServicesCmsAction();
    setServicesList(rows);
    setServicesLoading(false);
  };

  const loadTestimonials = async () => {
    setTestimonialsLoading(true);
    const rows = await listTestimonialsCmsAction();
    setTestimonialsList(rows);
    setTestimonialsLoading(false);
  };

  const loadFooterData = async () => {
    setFooterLoading(true);
    const data = await getFooterCmsDataAction();
    setFooterData(data);
    if (data.contactInfo) {
      setContactForm({
        institutionName: data.contactInfo.institutionName || "",
        centreName: data.contactInfo.centreName || "",
        address: data.contactInfo.address || "",
        email: data.contactInfo.email || "",
        phone: data.contactInfo.phone || "",
        phoneContact: data.contactInfo.phoneContact || "",
        websiteUrl: data.contactInfo.websiteUrl || "",
        copyrightText: data.contactInfo.copyrightText || "",
      });
    }
    setFooterLoading(false);
  };

  // Initial Loaders
  useEffect(() => {
    loadHeroSlides();
    loadCareerServices();
    loadTestimonials();
    loadFooterData();
  }, []);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-500/90 backdrop-blur-md px-5 py-3 text-xs font-bold text-[#090915] shadow-2xl animate-fade-in flex items-center gap-2">
          <i className="fas fa-check-circle" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <i className="fas fa-window-maximize text-orange-400" />
            <span>Landing Page CMS Additions</span>
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            Real-time database-driven management for Hero Slideshow, Career Services, What Students Say, and Footer.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-none">
        <button
          type="button"
          onClick={() => switchTab("HERO")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "HERO"
              ? "bg-orange-500 text-[#090915] shadow-lg shadow-orange-500/20"
              : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
          }`}
        >
          <i className="fas fa-photo-film text-xs" />
          <span>Hero Slideshow ({heroSlidesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("SERVICES")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "SERVICES"
              ? "bg-orange-500 text-[#090915] shadow-lg shadow-orange-500/20"
              : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
          }`}
        >
          <i className="fas fa-briefcase text-xs" />
          <span>Career Services ({servicesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("TESTIMONIALS")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "TESTIMONIALS"
              ? "bg-orange-500 text-[#090915] shadow-lg shadow-orange-500/20"
              : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
          }`}
        >
          <i className="fas fa-quote-left text-xs" />
          <span>What Students Say ({testimonialsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("FOOTER")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "FOOTER"
              ? "bg-orange-500 text-[#090915] shadow-lg shadow-orange-500/20"
              : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
          }`}
        >
          <i className="fas fa-shoe-prints text-xs" />
          <span>Footer & Contacts</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. HERO SLIDESHOW TAB (STRICTLY IMAGES ONLY)              */}
      {/* ========================================================= */}
      {activeTab === "HERO" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Hero Slideshow Management</h2>
              <p className="text-xs text-gray-400">
                Manage background slide images that cycle on the public homepage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingHeroSlide("NEW")}
              className={orangeButton}
            >
              <i className="fas fa-plus text-xs" />
              <span>Add Slide</span>
            </button>
          </div>

          {heroLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#101023] p-12 text-center text-xs text-gray-400">
              Loading hero slides…
            </div>
          ) : heroSlidesList.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#101023] p-12 text-center text-xs text-gray-400">
              No hero slides configured. Click &ldquo;Add Slide&rdquo; to create your first background slideshow slide.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {heroSlidesList.map((slide) => (
                <div
                  key={slide.id}
                  className="rounded-2xl border border-white/10 bg-[#101023] overflow-hidden flex flex-col justify-between hover:border-orange-500/30 transition-all"
                >
                  <div className="relative aspect-video w-full bg-black/40">
                    <img
                      src={slide.imageUrl}
                      alt={slide.imageAlt || "Hero background slide"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-gray-200">
                        Order: {slide.displayOrder}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          slide.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {slide.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        startTransition(async () => {
                          await updateHeroSlideAction(slide.id, { isActive: !slide.isActive });
                          await loadHeroSlides();
                          showNotification("Hero slide status updated.");
                        });
                      }}
                      className="text-[11px] font-semibold text-gray-400 hover:text-white cursor-pointer"
                    >
                      {slide.isActive ? "Pause Slide" : "Activate"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingHeroSlide(slide)}
                        className="rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-orange-400 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this hero slide image?")) {
                            startTransition(async () => {
                              await deleteHeroSlideAction(slide.id);
                              await loadHeroSlides();
                              showNotification("Hero slide deleted.");
                            });
                          }
                        }}
                        className="rounded-lg bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 text-[11px] font-semibold text-red-400 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CAREER SERVICES CRUD TAB                                */}
      {/* ========================================================= */}
      {activeTab === "SERVICES" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Career Services Directory (Public & Student)</h2>
              <p className="text-xs text-gray-400">
                Configure core institutional career development offerings published on the homepage and student portal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingService("NEW")}
              className={orangeButton}
            >
              <i className="fas fa-plus text-xs" />
              <span>Add Career Service</span>
            </button>
          </div>

          {servicesLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#101023] p-12 text-center text-xs text-gray-400">
              Loading career services…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#101023]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-white/[0.02] text-gray-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Service Name</th>
                    <th className="px-4 py-3">Slug / Route</th>
                    <th className="px-4 py-3">Icon</th>
                    <th className="px-4 py-3">Summary</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {servicesList.map((service) => (
                    <tr key={service.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">
                        {service.title}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-orange-400 text-[11px]">
                        /services/{service.slug}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 text-xs">
                          <i className={`fas ${service.icon || "fa-briefcase"}`} />
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-300 max-w-xs truncate">
                        {service.summary}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-gray-400">
                        {service.displayOrder}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            service.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {service.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              startTransition(async () => {
                                await updateCareerServiceAction(service.id, { isActive: !service.isActive });
                                await loadCareerServices();
                                showNotification("Career service updated.");
                              });
                            }}
                            className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:text-white cursor-pointer"
                          >
                            {service.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingService(service)}
                            className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 text-[11px] font-bold text-orange-400 hover:bg-orange-500/20 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete career service "${service.title}"?`)) {
                                startTransition(async () => {
                                  await deleteCareerServiceAction(service.id);
                                  await loadCareerServices();
                                  showNotification("Career service deleted.");
                                });
                              }
                            }}
                            className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                            title="Delete Service"
                          >
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. WHAT STUDENTS SAY (TESTIMONIALS) TAB                   */}
      {/* ========================================================= */}
      {activeTab === "TESTIMONIALS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">What Students Say (Testimonials)</h2>
              <p className="text-xs text-gray-400">
                Curate verified scholar endorsements, student quotes, and career success stories shown on the homepage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingTestimonial("NEW")}
              className={orangeButton}
            >
              <i className="fas fa-plus text-xs" />
              <span>Add Student Testimonial</span>
            </button>
          </div>

          {testimonialsLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#101023] p-12 text-center text-xs text-gray-400">
              Loading testimonials…
            </div>
          ) : testimonialsList.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#101023] p-12 text-center text-xs text-gray-400">
              No student testimonials recorded yet. Click &ldquo;Add Student Testimonial&rdquo; to publish student feedback.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonialsList.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-white/10 bg-[#101023] p-5 flex flex-col justify-between hover:border-orange-500/30 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-star ${
                              i < (t.rating || 5) ? "text-amber-400" : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          t.isPublished
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {t.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 italic leading-relaxed line-clamp-4">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs">
                        {t.avatarInitials || t.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{t.name}</h4>
                        <p className="text-[10px] text-gray-400">{t.role || "KSITM Scholar"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingTestimonial(t)}
                        className="rounded-lg bg-white/5 hover:bg-white/10 p-1.5 text-orange-400 text-xs cursor-pointer"
                        title="Edit testimonial"
                      >
                        <i className="fas fa-edit" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete testimonial from ${t.name}?`)) {
                            startTransition(async () => {
                              await deleteTestimonialAction(t.id);
                              await loadTestimonials();
                              showNotification("Testimonial deleted.");
                            });
                          }
                        }}
                        className="rounded-lg bg-red-500/10 hover:bg-red-500/20 p-1.5 text-red-400 text-xs cursor-pointer"
                        title="Delete testimonial"
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. FOOTER & CONTACT CRUD TAB                               */}
      {/* ========================================================= */}
      {activeTab === "FOOTER" && (
        <div className="space-y-8">
          {/* Section A: Contact Details */}
          <section className="rounded-3xl border border-white/10 bg-[#101023] p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-orange-400" />
                  <span>Site Contact Details & Operating Information</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Global campus contact information rendered in the public footer.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await updateSiteContactInfoAction(contactForm);
                  await loadFooterData();
                  showNotification("Contact info updated successfully.");
                });
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs"
            >
              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Institution Name</label>
                <input
                  type="text"
                  value={contactForm.institutionName || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, institutionName: e.target.value }))
                  }
                  placeholder="Katsina State Institute of Technology and Management"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Centre / Directorate Name</label>
                <input
                  type="text"
                  value={contactForm.centreName || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, centreName: e.target.value }))
                  }
                  placeholder="Directorate of Career Services & Linkages"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Contact Person</label>
                <input
                  type="text"
                  value={contactForm.phoneContact || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, phoneContact: e.target.value }))
                  }
                  placeholder="Nura Sadiq"
                  className={inputStyle}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-gray-300 block mb-1 font-semibold">Campus Physical Address</label>
                <input
                  type="text"
                  value={contactForm.address || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Room 1, Ground Floor, Block A, KSITM Campus, Katsina State"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={contactForm.phone || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="09062125845"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Official Contact Email</label>
                <input
                  type="email"
                  value={contactForm.email || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="contact@ksitmcareers.edu.ng"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Website URL</label>
                <input
                  type="text"
                  value={contactForm.websiteUrl || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, websiteUrl: e.target.value }))
                  }
                  placeholder="https://www.ksitmcareers.edu.ng"
                  className={inputStyle}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-300 block mb-1 font-semibold">Footer Copyright Text</label>
                <input
                  type="text"
                  value={contactForm.copyrightText || ""}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, copyrightText: e.target.value }))
                  }
                  placeholder="© 2026 KSITM Careers. All rights reserved."
                  className={inputStyle}
                />
              </div>

              <div className="flex items-end">
                <button type="submit" disabled={isPending} className={orangeButton}>
                  <i className="fas fa-save text-xs" />
                  <span>Save Contact Details</span>
                </button>
              </div>
            </form>
          </section>

          {/* Section B: Footer Links Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Services Links */}
            <div className="rounded-3xl border border-white/10 bg-[#101023] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Services Footer Column</h4>
                  <p className="text-[11px] text-gray-400">Navigation links under the &ldquo;Services&rdquo; footer heading.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingFooterLink({ link: null, category: "SERVICES" })}
                  className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500/20 cursor-pointer"
                >
                  <i className="fas fa-plus text-[10px]" /> Add Service Link
                </button>
              </div>

              <div className="space-y-2">
                {footerData.serviceLinks.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No service footer links configured.</p>
                ) : (
                  footerData.serviceLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 p-3 hover:border-white/10 transition-colors text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{link.label}</span>
                        <span className="ml-2 font-mono text-[11px] text-gray-400">{link.url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingFooterLink({ link, category: "SERVICES" })}
                          className="text-gray-400 hover:text-orange-400 p-1 cursor-pointer"
                        >
                          <i className="fas fa-edit" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete footer link "${link.label}"?`)) {
                              startTransition(async () => {
                                await deleteFooterLinkAction(link.id);
                                await loadFooterData();
                                showNotification("Footer link removed.");
                              });
                            }
                          }}
                          className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Resources Links */}
            <div className="rounded-3xl border border-white/10 bg-[#101023] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Resources Footer Column</h4>
                  <p className="text-[11px] text-gray-400">Navigation links under the &ldquo;Resources&rdquo; footer heading.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingFooterLink({ link: null, category: "RESOURCES" })}
                  className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500/20 cursor-pointer"
                >
                  <i className="fas fa-plus text-[10px]" /> Add Resource Link
                </button>
              </div>

              <div className="space-y-2">
                {footerData.resourceLinks.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No resource footer links configured.</p>
                ) : (
                  footerData.resourceLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 p-3 hover:border-white/10 transition-colors text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{link.label}</span>
                        <span className="ml-2 font-mono text-[11px] text-gray-400">{link.url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingFooterLink({ link, category: "RESOURCES" })}
                          className="text-gray-400 hover:text-orange-400 p-1 cursor-pointer"
                        >
                          <i className="fas fa-edit" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete footer link "${link.label}"?`)) {
                              startTransition(async () => {
                                await deleteFooterLinkAction(link.id);
                                await loadFooterData();
                                showNotification("Footer link removed.");
                              });
                            }
                          }}
                          className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section C: Social Media Networks */}
          <section className="rounded-3xl border border-white/10 bg-[#101023] p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <i className="fas fa-share-alt text-orange-400" />
                  <span>Institutional Social Media Channels</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Links and icons displayed in the footer and contact sections.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSocialLink("NEW")}
                className={orangeButton}
              >
                <i className="fas fa-plus text-xs" />
                <span>Add Social Network</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {footerData.socialLinks.map((social) => {
                const platformMeta = SOCIAL_PLATFORMS[social.platform] || {
                  label: social.platform,
                  icon: "fab fa-globe",
                };
                return (
                  <div
                    key={social.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between hover:border-orange-500/30 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-sm">
                        <i className={platformMeta.icon} />
                      </span>
                      <div>
                        <h4 className="font-bold text-white">{platformMeta.label}</h4>
                        <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{social.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingSocialLink(social)}
                        className="text-gray-400 hover:text-orange-400 p-1 cursor-pointer"
                      >
                        <i className="fas fa-edit" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${platformMeta.label}?`)) {
                            startTransition(async () => {
                              await deleteSocialLinkAction(social.id);
                              await loadFooterData();
                              showNotification("Social network removed.");
                            });
                          }
                        }}
                        className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* Modal 1: Hero Slide Add/Edit (STRICTLY PURE IMAGE) */}
      {editingHeroSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c0c1e] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingHeroSlide === "NEW" ? "Add Hero Background Slide" : "Edit Hero Slide"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data: CreateHeroSlideInput = {
                  imageUrl: (form.elements.namedItem("imageUrl") as HTMLInputElement).value,
                  displayOrder: Number((form.elements.namedItem("displayOrder") as HTMLInputElement).value),
                  isActive: (form.elements.namedItem("isActive") as HTMLInputElement).checked,
                };
                startTransition(async () => {
                  if (editingHeroSlide === "NEW") {
                    await createHeroSlideAction(data);
                  } else {
                    await updateHeroSlideAction(editingHeroSlide.id, data);
                  }
                  await loadHeroSlides();
                  setEditingHeroSlide(null);
                  showNotification("Hero slide saved.");
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Image URL (Cloudinary or Direct HTTPS) *</label>
                <input
                  type="url"
                  name="imageUrl"
                  required
                  defaultValue={editingHeroSlide !== "NEW" ? editingHeroSlide.imageUrl : ""}
                  placeholder="https://res.cloudinary.com/..."
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    defaultValue={editingHeroSlide !== "NEW" ? editingHeroSlide.displayOrder : 0}
                    className={inputStyle}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    defaultChecked={editingHeroSlide !== "NEW" ? editingHeroSlide.isActive : true}
                    className="rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-gray-200 font-semibold cursor-pointer">
                    Active Slide
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingHeroSlide(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={orangeButton}>
                  {editingHeroSlide === "NEW" ? "Create Slide" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Career Service Add/Edit */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c0c1e] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingService === "NEW" ? "Add Career Service" : "Edit Career Service"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data: CreateCareerServiceInput = {
                  title: (form.elements.namedItem("title") as HTMLInputElement).value,
                  slug: (form.elements.namedItem("slug") as HTMLInputElement).value,
                  summary: (form.elements.namedItem("summary") as HTMLTextAreaElement).value,
                  description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
                  icon: (form.elements.namedItem("icon") as HTMLInputElement).value,
                  displayOrder: Number((form.elements.namedItem("displayOrder") as HTMLInputElement).value),
                  isActive: (form.elements.namedItem("isActive") as HTMLInputElement).checked,
                };
                startTransition(async () => {
                  if (editingService === "NEW") {
                    await createCareerServiceAction(data);
                  } else {
                    await updateCareerServiceAction(editingService.id, data);
                  }
                  await loadCareerServices();
                  setEditingService(null);
                  showNotification("Career service saved.");
                });
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">Service Name *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingService !== "NEW" ? editingService.title : ""}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">URL Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    required
                    defaultValue={editingService !== "NEW" ? editingService.slug : ""}
                    placeholder="e.g. resume, internship"
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Icon Class (Font Awesome)</label>
                <input
                  type="text"
                  name="icon"
                  defaultValue={editingService !== "NEW" ? editingService.icon : "fa-briefcase"}
                  placeholder="fa-file-alt, fa-laptop-code"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Summary *</label>
                <textarea
                  name="summary"
                  rows={2}
                  required
                  defaultValue={editingService !== "NEW" ? editingService.summary : ""}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Detailed Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingService !== "NEW" ? editingService.description : ""}
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-2">
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    defaultValue={editingService !== "NEW" ? editingService.displayOrder : 0}
                    className={inputStyle}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="serviceActive"
                    name="isActive"
                    defaultChecked={editingService !== "NEW" ? editingService.isActive : true}
                    className="rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="serviceActive" className="text-gray-200 font-semibold cursor-pointer">
                    Active Offering
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={orangeButton}>
                  {editingService === "NEW" ? "Create Service" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Testimonial Add/Edit */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c0c1e] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingTestimonial === "NEW" ? "Add Student Testimonial" : "Edit Student Testimonial"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data: CreateTestimonialInput = {
                  name: (form.elements.namedItem("name") as HTMLInputElement).value,
                  role: (form.elements.namedItem("role") as HTMLInputElement).value,
                  quote: (form.elements.namedItem("quote") as HTMLTextAreaElement).value,
                  rating: Number((form.elements.namedItem("rating") as HTMLSelectElement).value),
                  avatarInitials: (form.elements.namedItem("avatarInitials") as HTMLInputElement).value,
                  displayOrder: Number((form.elements.namedItem("displayOrder") as HTMLInputElement).value),
                  isPublished: (form.elements.namedItem("isPublished") as HTMLInputElement).checked,
                };
                startTransition(async () => {
                  if (editingTestimonial === "NEW") {
                    await createTestimonialAction(data);
                  } else {
                    await updateTestimonialAction(editingTestimonial.id, data);
                  }
                  await loadTestimonials();
                  setEditingTestimonial(null);
                  showNotification("Testimonial saved.");
                });
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">Student Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingTestimonial !== "NEW" ? editingTestimonial.name : ""}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">Program / Role *</label>
                  <input
                    type="text"
                    name="role"
                    required
                    defaultValue={editingTestimonial !== "NEW" ? editingTestimonial.role : "Software Engineering Graduate"}
                    placeholder="e.g. Software Engineering Graduate"
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Initials (for avatar)</label>
                <input
                  type="text"
                  name="avatarInitials"
                  defaultValue={editingTestimonial !== "NEW" ? editingTestimonial.avatarInitials : ""}
                  placeholder="e.g. AB"
                  maxLength={4}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Testimonial Quote *</label>
                <textarea
                  name="quote"
                  rows={3}
                  required
                  defaultValue={editingTestimonial !== "NEW" ? editingTestimonial.quote : ""}
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 items-center pt-2">
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">Star Rating</label>
                  <select
                    name="rating"
                    defaultValue={editingTestimonial !== "NEW" ? editingTestimonial.rating : 5}
                    className={inputStyle}
                  >
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-semibold">Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    defaultValue={editingTestimonial !== "NEW" ? editingTestimonial.displayOrder : 0}
                    className={inputStyle}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="tPublished"
                    name="isPublished"
                    defaultChecked={editingTestimonial !== "NEW" ? editingTestimonial.isPublished : true}
                    className="rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="tPublished" className="text-gray-200 font-semibold cursor-pointer">
                    Published
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={orangeButton}>
                  {editingTestimonial === "NEW" ? "Publish Testimonial" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Footer Link Add/Edit */}
      {editingFooterLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0c1e] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingFooterLink.link ? "Edit Footer Link" : `Add ${editingFooterLink.category} Link`}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data: CreateFooterLinkInput = {
                  category: editingFooterLink.category,
                  label: (form.elements.namedItem("label") as HTMLInputElement).value,
                  url: (form.elements.namedItem("url") as HTMLInputElement).value,
                  displayOrder: Number((form.elements.namedItem("displayOrder") as HTMLInputElement).value),
                  isActive: true,
                };
                startTransition(async () => {
                  if (editingFooterLink.link) {
                    await updateFooterLinkAction(editingFooterLink.link.id, data);
                  } else {
                    await createFooterLinkAction(data);
                  }
                  await loadFooterData();
                  setEditingFooterLink(null);
                  showNotification("Footer link updated.");
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Link Label *</label>
                <input
                  type="text"
                  name="label"
                  required
                  defaultValue={editingFooterLink.link ? editingFooterLink.link.label : ""}
                  placeholder="e.g. Virtual Internships"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Target URL / Path *</label>
                <input
                  type="text"
                  name="url"
                  required
                  defaultValue={editingFooterLink.link ? editingFooterLink.link.url : ""}
                  placeholder="/dashboard/internships"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  defaultValue={editingFooterLink.link ? editingFooterLink.link.displayOrder : 0}
                  className={inputStyle}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingFooterLink(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={orangeButton}>
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Social Link Add/Edit */}
      {editingSocialLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0c1e] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingSocialLink === "NEW" ? "Add Social Media Network" : "Edit Social Network"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const platformVal = (form.elements.namedItem("platform") as HTMLSelectElement).value;

                const data: SaveSocialLinkInput = {
                  id: editingSocialLink !== "NEW" ? editingSocialLink.id : undefined,
                  platform: platformVal,
                  url: (form.elements.namedItem("url") as HTMLInputElement).value,
                  displayOrder: Number((form.elements.namedItem("displayOrder") as HTMLInputElement).value),
                  isActive: true,
                };
                startTransition(async () => {
                  await saveSocialLinkAction(data);
                  await loadFooterData();
                  setEditingSocialLink(null);
                  showNotification("Social network saved.");
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Platform</label>
                <select
                  name="platform"
                  defaultValue={editingSocialLink !== "NEW" ? editingSocialLink.platform : "LINKEDIN"}
                  className={inputStyle}
                >
                  {Object.entries(SOCIAL_PLATFORMS).map(([key, p]) => (
                    <option key={key} value={key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Profile / Page URL *</label>
                <input
                  type="url"
                  name="url"
                  required
                  defaultValue={editingSocialLink !== "NEW" ? editingSocialLink.url : ""}
                  placeholder="https://..."
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  defaultValue={editingSocialLink !== "NEW" ? editingSocialLink.displayOrder : 0}
                  className={inputStyle}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSocialLink(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={orangeButton}>
                  Save Social Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
