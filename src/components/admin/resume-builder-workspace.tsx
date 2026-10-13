"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import {
  getStudentResumeAction,
  saveStudentResumeAction,
  listAllResumesAction,
  seedStandardResumesAction,
  type ResumeProfileData,
  type ResumeSummaryRow,
  type ResumeEducationItem,
  type ResumeExperienceItem,
  type ResumeSkillItem,
  type ResumeProjectItem,
  type ResumeCertificationItem,
  type ResumeTemplateId,
} from "@/actions/resume";
import { listStudentsAction, type StudentTableRow } from "@/actions/students";
import { analyzeResumeATS, type AtsAuditResult } from "@/lib/resume-ats";

const ACCENT_COLORS = [
  { label: "KSITM Emerald", value: "#059669" },
  { label: "Classic Navy", value: "#1e3a8a" },
  { label: "Vibrant Orange", value: "#f97316" },
  { label: "Slate Graphite", value: "#334155" },
  { label: "Royal Purple", value: "#7c3aed" },
  { label: "Onyx Black", value: "#18181b" },
];

const TEMPLATES: Array<{ id: ResumeTemplateId; label: string; icon: string; desc: string }> = [
  {
    id: "ats-clean",
    label: "Harvard ATS Clean",
    icon: "fa-file-lines",
    desc: "Single-column ivy league ATS standard. 100% parseable by Taleo, Workday, and Lever.",
  },
  {
    id: "modern-dual",
    label: "Executive Dual-Column",
    icon: "fa-table-columns",
    desc: "Modern corporate layout with left skills/contact sidebar and prominent experience flow.",
  },
  {
    id: "tech-minimal",
    label: "Engineering Minimal",
    icon: "fa-terminal",
    desc: "Developer-focused design with monospace metadata, repo tags, and skills matrix.",
  },
  {
    id: "executive-serif",
    label: "Academic Serif",
    icon: "fa-book-bookmark",
    desc: "Traditional academic format with refined typography suited for faculty and honors.",
  },
];

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";
const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function ResumeBuilderWorkspace() {
  const [activeTab, setActiveTab] = useState<"STUDIO" | "DIRECTORY">("STUDIO");
  const [editorSection, setEditorSection] = useState<
    "HEADER" | "SUMMARY" | "EXPERIENCE" | "EDUCATION" | "SKILLS" | "PROJECTS" | "CERTS"
  >("HEADER");

  // Mobile View Switcher: "EDIT" or "PREVIEW"
  const [mobileView, setMobileView] = useState<"EDIT" | "PREVIEW">("EDIT");

  // Student list for admin selector
  const [students, setStudents] = useState<StudentTableRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Resume State
  const [resume, setResume] = useState<ResumeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showAtsModal, setShowAtsModal] = useState(false);

  // Directory State
  const [directoryResumes, setDirectoryResumes] = useState<ResumeSummaryRow[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const printRef = useRef<HTMLDivElement>(null);

  // Load students for switcher
  useEffect(() => {
    let active = true;
    void listStudentsAction()
      .then((rows) => {
        if (active) {
          setStudents(rows);
          if (rows.length > 0) {
            setSelectedStudentId((prev) => prev || rows[0].id);
          }
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load students for resume switcher:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load resume when selectedStudentId changes
  useEffect(() => {
    if (!selectedStudentId) return;
    let active = true;
    void getStudentResumeAction(selectedStudentId)
      .then((data) => {
        if (active) {
          setResume(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load resume:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedStudentId]);

  // Load Directory
  const loadDirectory = async () => {
    setDirectoryLoading(true);
    try {
      const rows = await listAllResumesAction(directorySearch);
      setDirectoryResumes(rows);
    } catch (err: unknown) {
      console.error("Failed to load resume directory:", err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "DIRECTORY") return;
    let active = true;
    void listAllResumesAction(directorySearch)
      .then((rows) => {
        if (active) {
          setDirectoryResumes(rows);
          setDirectoryLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load resume directory:", err);
        if (active) setDirectoryLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Real-time ATS Calculation
  const atsResult: AtsAuditResult = resume
    ? analyzeResumeATS({
        fullName: resume.fullName,
        email: resume.email,
        phone: resume.phone,
        location: resume.location,
        websiteUrl: resume.websiteUrl,
        linkedInUrl: resume.linkedInUrl,
        githubUrl: resume.githubUrl,
        professionalSummary: resume.professionalSummary,
        experience: resume.experience,
        education: resume.education,
        skills: resume.skills,
        projects: resume.projects,
        certifications: resume.certifications,
      })
    : {
        score: 0,
        grade: "NEEDS_IMPROVEMENT",
        strengths: [],
        improvements: [],
        breakdown: {
          contact: { score: 0, max: 15, label: "Contact" },
          summary: { score: 0, max: 15, label: "Summary" },
          experience: { score: 0, max: 30, label: "Experience" },
          education: { score: 0, max: 15, label: "Education" },
          skills: { score: 0, max: 15, label: "Skills" },
          projectsAndCerts: { score: 0, max: 10, label: "Projects & Certs" },
        },
      };

  // Handlers
  const handleSave = async () => {
    if (!resume) return;
    setSaving(true);
    setSaveSuccess(false);
    const res = await saveStudentResumeAction(resume);
    setSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(res.error || "Failed to save resume.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSeedSamples = () => {
    if (confirm("Seed 3 industry-grade ATS standard sample resumes into the database?")) {
      startTransition(async () => {
        const res = await seedStandardResumesAction();
        if (res.success) {
          alert(`Successfully synchronized ${res.seededCount} industry-grade ATS student resumes.`);
          if (selectedStudentId) {
            const fresh = await getStudentResumeAction(selectedStudentId);
            setResume(fresh);
          }
          if (activeTab === "DIRECTORY") loadDirectory();
        } else {
          alert(res.error || "Failed to seed sample resumes.");
        }
      });
    }
  };

  const handleExportJSON = () => {
    if (!resume) return;
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.fullName.toLowerCase().replace(/\s+/g, "_")}_resume.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.fullName && parsed.email) {
          setResume((prev) =>
            prev ? { ...prev, ...parsed, studentId: prev.studentId } : parsed,
          );
          alert("Resume imported successfully.");
        } else {
          alert("Invalid resume JSON format.");
        }
      } catch {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Helper mutators for sub-items
  const addEducation = () => {
    if (!resume) return;
    const newItem: ResumeEducationItem = {
      institution: "Institution Name",
      qualification: "National Diploma (ND)",
      fieldOfStudy: "Field of Study",
      startDate: "2023",
      endDate: "2025",
      isCurrent: false,
      grade: "Distinction Track",
      displayOrder: resume.education.length + 1,
    };
    setResume({ ...resume, education: [...resume.education, newItem] });
  };

  const updateEducation = (idx: number, patch: Partial<ResumeEducationItem>) => {
    if (!resume) return;
    const updated = [...resume.education];
    updated[idx] = { ...updated[idx], ...patch };
    setResume({ ...resume, education: updated });
  };

  const removeEducation = (idx: number) => {
    if (!resume) return;
    setResume({
      ...resume,
      education: resume.education.filter((_, i) => i !== idx),
    });
  };

  const addExperience = () => {
    if (!resume) return;
    const newItem: ResumeExperienceItem = {
      organization: "Company or Organization",
      roleTitle: "Position Title",
      location: "Katsina, Nigeria",
      startDate: "Jan 2024",
      endDate: "Present",
      isCurrent: true,
      description:
        "• Accomplished [X] measured by [Y] by doing [Z] using industry-standard tools.\n• Collaborated with cross-functional peers to increase operational throughput by 25%.",
      displayOrder: resume.experience.length + 1,
    };
    setResume({ ...resume, experience: [...resume.experience, newItem] });
  };

  const updateExperience = (idx: number, patch: Partial<ResumeExperienceItem>) => {
    if (!resume) return;
    const updated = [...resume.experience];
    updated[idx] = { ...updated[idx], ...patch };
    setResume({ ...resume, experience: updated });
  };

  const removeExperience = (idx: number) => {
    if (!resume) return;
    setResume({
      ...resume,
      experience: resume.experience.filter((_, i) => i !== idx),
    });
  };

  const addSkill = (name: string, category: string) => {
    if (!resume || !name.trim()) return;
    const newItem: ResumeSkillItem = {
      name: name.trim(),
      category,
      proficiency: "ADVANCED",
      displayOrder: resume.skills.length + 1,
    };
    setResume({ ...resume, skills: [...resume.skills, newItem] });
  };

  const removeSkill = (idx: number) => {
    if (!resume) return;
    setResume({
      ...resume,
      skills: resume.skills.filter((_, i) => i !== idx),
    });
  };

  const addProject = () => {
    if (!resume) return;
    const newItem: ResumeProjectItem = {
      title: "Project Title",
      role: "Lead Developer",
      projectUrl: "https://github.com/...",
      description:
        "Engineered scalable web application utilizing Next.js and PostgreSQL, serving 500+ active users with 99.9% reliability.",
      displayOrder: resume.projects.length + 1,
    };
    setResume({ ...resume, projects: [...resume.projects, newItem] });
  };

  const updateProject = (idx: number, patch: Partial<ResumeProjectItem>) => {
    if (!resume) return;
    const updated = [...resume.projects];
    updated[idx] = { ...updated[idx], ...patch };
    setResume({ ...resume, projects: updated });
  };

  const removeProject = (idx: number) => {
    if (!resume) return;
    setResume({
      ...resume,
      projects: resume.projects.filter((_, i) => i !== idx),
    });
  };

  const addCertification = () => {
    if (!resume) return;
    const newItem: ResumeCertificationItem = {
      name: "Certification Name",
      issuingOrganization: "Issuing Body (e.g. Cisco / AWS / Google)",
      issueDate: "2024",
      expirationDate: null,
      credentialId: "CRED-12345",
      credentialUrl: "https://...",
      displayOrder: resume.certifications.length + 1,
    };
    setResume({ ...resume, certifications: [...resume.certifications, newItem] });
  };

  const updateCertification = (idx: number, patch: Partial<ResumeCertificationItem>) => {
    if (!resume) return;
    const updated = [...resume.certifications];
    updated[idx] = { ...updated[idx], ...patch };
    setResume({ ...resume, certifications: updated });
  };

  const removeCertification = (idx: number) => {
    if (!resume) return;
    setResume({
      ...resume,
      certifications: resume.certifications.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      {/* Print-specific style isolating the document sheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #resume-print-sheet,
          #resume-print-sheet * {
            visibility: visible !important;
          }
          #resume-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      {/* Primary Workspace Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-file-invoice text-xs" />
            <span>NACE & Harvard ATS Compliant · Resume Architecture Studio</span>
          </div>
          <h1 className="font-academic mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Professional Resume Builder
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Construct high-impact, ATS-optimized, recruitment-ready curriculum vitae with live
            Harvard formatting, Google XYZ impact metrics, and instant PDF rendering.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* ATS Score Indicator */}
          <button
            type="button"
            onClick={() => setShowAtsModal(true)}
            className={`group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              atsResult.score >= 85
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : atsResult.score >= 70
                ? "border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            <i className="fas fa-gauge-high text-xs group-hover:scale-110 transition-transform" />
            <span>ATS Score: {atsResult.score}%</span>
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-mono uppercase">
              {atsResult.grade}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className={secondaryButton}
            title="Print or Save as PDF"
          >
            <i className="fas fa-print" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !resume}
            className={orangeButton}
          >
            <i className={`fas ${saving ? "fa-spinner fa-spin" : saveSuccess ? "fa-check" : "fa-floppy-disk"}`} />
            <span>{saving ? "Saving…" : saveSuccess ? "Saved!" : "Save Resume"}</span>
          </button>
        </div>
      </div>

      {/* Main Mode Sub-Tab Switcher */}
      <div className="flex items-center justify-between border-b border-white/[0.08]">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("STUDIO")}
            className={`inline-flex items-center gap-2 border-b-2 pb-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "STUDIO"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <i className="fas fa-pen-nib" />
            <span>Interactive Resume Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DIRECTORY")}
            className={`inline-flex items-center gap-2 border-b-2 pb-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "DIRECTORY"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <i className="fas fa-folder-tree" />
            <span>Institutional Resumes Directory ({directoryResumes.length})</span>
          </button>
        </div>

        {/* Quick Tools & Seed Sample */}
        <div className="hidden sm:flex items-center gap-2 pb-3">
          <button
            type="button"
            onClick={handleSeedSamples}
            disabled={isPending}
            className="text-[11px] font-semibold text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1 cursor-pointer"
            title="Populate 3 industry-grade ATS resumes"
          >
            <i className="fas fa-database text-xs" />
            <span>Seed Samples</span>
          </button>
          <span className="text-gray-600">·</span>
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={!resume}
            className="text-[11px] font-semibold text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <i className="fas fa-download text-xs" />
            <span>JSON</span>
          </button>
          <span className="text-gray-600">·</span>
          <label className="text-[11px] font-semibold text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer">
            <i className="fas fa-upload text-xs" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {activeTab === "DIRECTORY" ? (
        /* ================= DIRECTORY TAB ================= */
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3.5 top-3.5 text-xs text-gray-500" />
              <input
                type="text"
                placeholder="Search resumes by student name, registration number, or email…"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDirectory()}
                className="w-full rounded-xl border border-white/10 bg-[#090918] pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <button type="button" onClick={loadDirectory} className={secondaryButton}>
              <i className="fas fa-filter text-xs" />
              <span>Search</span>
            </button>
          </div>

          {directoryLoading ? (
            <div className="py-20 text-center text-xs text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl text-orange-400 mb-2 block" />
              <span>Loading institutional resumes…</span>
            </div>
          ) : directoryResumes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c1e] p-12 text-center space-y-3">
              <i className="fas fa-file-circle-question text-3xl text-gray-500" />
              <h3 className="text-sm font-bold text-white">No resumes created yet</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No students have constructed resumes in the system yet. You can seed sample
                resumes or select a student from the studio to build their profile.
              </p>
              <button type="button" onClick={handleSeedSamples} className={orangeButton}>
                <i className="fas fa-plus" />
                <span>Seed Sample Resumes</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0c0c1e]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-gray-400">
                    <th className="px-4 py-3 font-semibold">Student / Scholar</th>
                    <th className="px-4 py-3 font-semibold">Reg Number</th>
                    <th className="px-4 py-3 font-semibold">Headline</th>
                    <th className="px-4 py-3 font-semibold">ATS Score</th>
                    <th className="px-4 py-3 font-semibold">Template</th>
                    <th className="px-4 py-3 font-semibold">Last Updated</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {directoryResumes.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-bold text-white">
                        {row.studentName}
                        {row.department && (
                          <div className="text-[11px] font-normal text-gray-400">{row.department}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-300">{row.regNumber}</td>
                      <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{row.headline}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            row.atsScore >= 85
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : row.atsScore >= 70
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          <i className="fas fa-gauge-high text-[9px]" />
                          {row.atsScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono uppercase text-[11px] text-gray-400">
                        {row.template}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(row.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(row.studentId);
                            setActiveTab("STUDIO");
                          }}
                          className="rounded-lg bg-white/5 px-2.5 py-1 font-semibold text-orange-400 hover:bg-orange-500/20 transition-all cursor-pointer"
                        >
                          Open in Studio
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ================= STUDIO TAB ================= */
        <div className="space-y-6">
          {/* Top Customizer Toolbar */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 lg:grid-cols-12 lg:items-center">
            {/* Student Switcher for Admin */}
            <div className="lg:col-span-4">
              <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-1">
                Target Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.regNumber}) — {st.department || "No Dept"}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selector */}
            <div className="lg:col-span-3">
              <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-1">
                Resume Template
              </label>
              <select
                value={resume?.template || "ats-clean"}
                onChange={(e) =>
                  setResume((prev) =>
                    prev ? { ...prev, template: e.target.value as ResumeTemplateId } : null,
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Accent Color Palette */}
            <div className="lg:col-span-3">
              <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-1">
                Accent Theme
              </label>
              <div className="flex items-center gap-2 pt-0.5">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      setResume((prev) => (prev ? { ...prev, accentColor: c.value } : null))
                    }
                    className={`h-6 w-6 rounded-full transition-transform cursor-pointer ${
                      resume?.accentColor === c.value
                        ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0c0c1e]"
                        : "hover:scale-110 opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Font Switcher */}
            <div className="lg:col-span-2">
              <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-1">
                Typography
              </label>
              <select
                value={resume?.fontFamily || "sans"}
                onChange={(e) =>
                  setResume((prev) =>
                    prev
                      ? {
                          ...prev,
                          fontFamily: e.target.value as "academic" | "sans" | "mono",
                        }
                      : null,
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#090918] px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="sans">Clean Modern Sans</option>
                <option value="academic">Academic Serif</option>
                <option value="mono">Technical Monospace</option>
              </select>
            </div>
          </div>

          {/* Mobile Edit / Preview Toggle */}
          <div className="flex sm:hidden rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMobileView("EDIT")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                mobileView === "EDIT" ? "bg-orange-500 text-[#090915]" : "text-gray-400"
              }`}
            >
              <i className="fas fa-edit mr-1.5" />
              Edit Form
            </button>
            <button
              type="button"
              onClick={() => setMobileView("PREVIEW")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                mobileView === "PREVIEW" ? "bg-orange-500 text-[#090915]" : "text-gray-400"
              }`}
            >
              <i className="fas fa-eye mr-1.5" />
              Live Preview
            </button>
          </div>

          {loading || !resume ? (
            <div className="py-24 text-center text-xs text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl text-orange-400 mb-2 block" />
              <span>Loading student resume studio…</span>
            </div>
          ) : (
            /* DUAL-PANE WORKSPACE: LEFT EDITOR, RIGHT LIVE ATS PREVIEW */
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* ============ LEFT EDITOR PANE (5 Cols) ============ */}
              <div
                className={`lg:col-span-5 space-y-4 ${
                  mobileView === "PREVIEW" ? "hidden sm:block" : "block"
                }`}
              >
                {/* Section Navigation Tabs */}
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.08] bg-[#0c0c1e] p-1.5">
                  {[
                    { id: "HEADER", label: "Header", icon: "fa-user" },
                    { id: "SUMMARY", label: "Summary", icon: "fa-align-left" },
                    { id: "EXPERIENCE", label: "Experience", icon: "fa-briefcase" },
                    { id: "EDUCATION", label: "Education", icon: "fa-graduation-cap" },
                    { id: "SKILLS", label: "Skills", icon: "fa-code" },
                    { id: "PROJECTS", label: "Projects", icon: "fa-laptop-code" },
                    { id: "CERTS", label: "Certifications", icon: "fa-certificate" },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setEditorSection(sec.id as typeof editorSection)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        editorSection === sec.id
                          ? "bg-orange-500 text-[#090915] font-bold shadow-md shadow-orange-500/20"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <i className={`fas ${sec.icon} text-[11px]`} />
                      <span>{sec.label}</span>
                    </button>
                  ))}
                </div>

                {/* Section Editor Forms */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-5 space-y-4">
                  {/* --- 1. HEADER & CONTACT --- */}
                  {editorSection === "HEADER" && (
                    <div className="space-y-3.5">
                      <div className="border-b border-white/[0.08] pb-3">
                        <h3 className="text-sm font-bold text-white">Header & Contact Credentials</h3>
                        <p className="text-xs text-gray-400">
                          Applicant name, target headline, verified contact, and professional links.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-300">Full Legal Name *</label>
                        <input
                          type="text"
                          value={resume.fullName}
                          onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                          className={inputStyle}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-300">
                          Professional Title / Target Headline *
                        </label>
                        <input
                          type="text"
                          value={resume.headline}
                          onChange={(e) => setResume({ ...resume, headline: e.target.value })}
                          placeholder="e.g. Software Engineer | Cloud & Distributed Systems"
                          className={inputStyle}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-300">Email Address *</label>
                          <input
                            type="email"
                            value={resume.email}
                            onChange={(e) => setResume({ ...resume, email: e.target.value })}
                            className={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-300">Phone Number *</label>
                          <input
                            type="tel"
                            value={resume.phone}
                            onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                            placeholder="e.g. 08012345678"
                            className={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-300">Location / City *</label>
                        <input
                          type="text"
                          value={resume.location}
                          onChange={(e) => setResume({ ...resume, location: e.target.value })}
                          placeholder="e.g. Katsina, Nigeria"
                          className={inputStyle}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-300">LinkedIn Profile URL</label>
                          <input
                            type="url"
                            value={resume.linkedInUrl || ""}
                            onChange={(e) => setResume({ ...resume, linkedInUrl: e.target.value })}
                            placeholder="https://linkedin.com/in/..."
                            className={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-300">GitHub / Code Profile</label>
                          <input
                            type="url"
                            value={resume.githubUrl || ""}
                            onChange={(e) => setResume({ ...resume, githubUrl: e.target.value })}
                            placeholder="https://github.com/..."
                            className={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-300">Portfolio / Personal Website</label>
                        <input
                          type="url"
                          value={resume.websiteUrl || ""}
                          onChange={(e) => setResume({ ...resume, websiteUrl: e.target.value })}
                          placeholder="https://yourdomain.com"
                          className={inputStyle}
                        />
                      </div>
                    </div>
                  )}

                  {/* --- 2. SUMMARY --- */}
                  {editorSection === "SUMMARY" && (
                    <div className="space-y-3.5">
                      <div className="border-b border-white/[0.08] pb-3">
                        <h3 className="text-sm font-bold text-white">Executive Professional Summary</h3>
                        <p className="text-xs text-gray-400">
                          A 35-50 word elevator pitch highlighting qualifications, core specialty, and
                          quantifiable accomplishments.
                        </p>
                      </div>

                      <div>
                        <textarea
                          rows={6}
                          value={resume.professionalSummary}
                          onChange={(e) =>
                            setResume({ ...resume, professionalSummary: e.target.value })
                          }
                          placeholder="High-achieving Software Engineering student at KSITM with demonstrated proficiency in TypeScript, Next.js, and PostgreSQL..."
                          className={inputStyle}
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                          <span>
                            Words:{" "}
                            {resume.professionalSummary.trim().split(/\s+/).filter(Boolean).length}
                          </span>
                          <span>Recommended: 35–60 words</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-gray-300 space-y-1.5">
                        <div className="font-bold text-orange-400 flex items-center gap-1.5">
                          <i className="fas fa-lightbulb" />
                          <span>ATS Best Practice Tip</span>
                        </div>
                        <p className="text-gray-400 text-[11px]">
                          Avoid vague statements like &ldquo;hard worker seeking opportunity&rdquo;.
                          State your exact discipline, tool stack, and the value you deliver to
                          prospective employers.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* --- 3. EXPERIENCE --- */}
                  {editorSection === "EXPERIENCE" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">Work & Practical Experience</h3>
                          <p className="text-xs text-gray-400">
                            Internships, SIWES, work-study, freelance, and industry roles.
                          </p>
                        </div>
                        <button type="button" onClick={addExperience} className={orangeButton}>
                          <i className="fas fa-plus" />
                          <span>Add Role</span>
                        </button>
                      </div>

                      {resume.experience.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          No experience logged yet. Click &ldquo;Add Role&rdquo; to input internships or
                          employment history.
                        </div>
                      ) : (
                        resume.experience.map((exp, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-[#090918] p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-orange-400">
                                Role #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeExperience(idx)}
                                className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                title="Remove Role"
                              >
                                <i className="fas fa-trash-alt text-xs" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[11px] font-semibold text-gray-300">
                                  Job / Position Title *
                                </label>
                                <input
                                  type="text"
                                  value={exp.roleTitle}
                                  onChange={(e) =>
                                    updateExperience(idx, { roleTitle: e.target.value })
                                  }
                                  className={inputStyle}
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-gray-300">
                                  Company / Organization *
                                </label>
                                <input
                                  type="text"
                                  value={exp.organization}
                                  onChange={(e) =>
                                    updateExperience(idx, { organization: e.target.value })
                                  }
                                  className={inputStyle}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5">
                              <div>
                                <label className="text-[11px] font-semibold text-gray-300">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  value={exp.location || ""}
                                  onChange={(e) =>
                                    updateExperience(idx, { location: e.target.value })
                                  }
                                  className={inputStyle}
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-gray-300">
                                  Start Date *
                                </label>
                                <input
                                  type="text"
                                  value={exp.startDate}
                                  onChange={(e) =>
                                    updateExperience(idx, { startDate: e.target.value })
                                  }
                                  placeholder="Jan 2024"
                                  className={inputStyle}
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-gray-300">
                                  End Date
                                </label>
                                <input
                                  type="text"
                                  disabled={exp.isCurrent}
                                  value={exp.isCurrent ? "Present" : exp.endDate || ""}
                                  onChange={(e) =>
                                    updateExperience(idx, { endDate: e.target.value })
                                  }
                                  placeholder="Dec 2024"
                                  className={inputStyle}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`cur-exp-${idx}`}
                                checked={exp.isCurrent}
                                onChange={(e) =>
                                  updateExperience(idx, {
                                    isCurrent: e.target.checked,
                                    endDate: e.target.checked ? "Present" : "",
                                  })
                                }
                                className="rounded text-orange-500 focus:ring-orange-500"
                              />
                              <label htmlFor={`cur-exp-${idx}`} className="text-xs text-gray-300">
                                Currently working in this position
                              </label>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-semibold text-gray-300">
                                  Accomplishments & Google XYZ Bullets *
                                </label>
                                <span className="text-[10px] text-orange-400 font-mono">
                                  Start with Action Verbs
                                </span>
                              </div>
                              <textarea
                                rows={4}
                                value={exp.description}
                                onChange={(e) =>
                                  updateExperience(idx, { description: e.target.value })
                                }
                                placeholder="• Engineered [X] measured by [Y] by doing [Z]..."
                                className={inputStyle}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* --- 4. EDUCATION --- */}
                  {editorSection === "EDUCATION" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">Education & Credentials</h3>
                          <p className="text-xs text-gray-400">
                            Tertiary degrees, National Diploma, Higher National Diploma, and honors.
                          </p>
                        </div>
                        <button type="button" onClick={addEducation} className={orangeButton}>
                          <i className="fas fa-plus" />
                          <span>Add School</span>
                        </button>
                      </div>

                      {resume.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/10 bg-[#090918] p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-orange-400">
                              Credential #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEducation(idx)}
                              className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <i className="fas fa-trash-alt text-xs" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Institution Name *
                              </label>
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) =>
                                  updateEducation(idx, { institution: e.target.value })
                                }
                                className={inputStyle}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Qualification Awarded *
                              </label>
                              <input
                                type="text"
                                value={edu.qualification}
                                onChange={(e) =>
                                  updateEducation(idx, { qualification: e.target.value })
                                }
                                placeholder="e.g. National Diploma (ND)"
                                className={inputStyle}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Field of Study / Major *
                              </label>
                              <input
                                type="text"
                                value={edu.fieldOfStudy}
                                onChange={(e) =>
                                  updateEducation(idx, { fieldOfStudy: e.target.value })
                                }
                                placeholder="Computer Science"
                                className={inputStyle}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Start Year *
                              </label>
                              <input
                                type="text"
                                value={edu.startDate}
                                onChange={(e) =>
                                  updateEducation(idx, { startDate: e.target.value })
                                }
                                placeholder="2023"
                                className={inputStyle}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Completion Year
                              </label>
                              <input
                                type="text"
                                value={edu.isCurrent ? "Present" : edu.endDate || ""}
                                onChange={(e) =>
                                  updateEducation(idx, { endDate: e.target.value })
                                }
                                placeholder="2025"
                                className={inputStyle}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-gray-300">
                              Honors / Grade / CGPA
                            </label>
                            <input
                              type="text"
                              value={edu.grade || ""}
                              onChange={(e) =>
                                updateEducation(idx, { grade: e.target.value })
                              }
                              placeholder="e.g. Distinction Track / CGPA: 3.85/4.00"
                              className={inputStyle}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* --- 5. SKILLS MATRIX --- */}
                  {editorSection === "SKILLS" && (
                    <div className="space-y-4">
                      <div className="border-b border-white/[0.08] pb-3">
                        <h3 className="text-sm font-bold text-white">Skills & Keywords Architecture</h3>
                        <p className="text-xs text-gray-400">
                          ATS scans match keywords verbatim. Categorize technical tools, frameworks, and
                          soft skills.
                        </p>
                      </div>

                      {/* Quick Add Skill Form */}
                      <div className="rounded-xl border border-white/10 bg-[#090918] p-3 space-y-2.5">
                        <span className="text-xs font-bold text-orange-400">Add New Skill</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="new-skill-input"
                            placeholder="e.g. Next.js, Docker, SQL, Leadership…"
                            className="flex-1 rounded-xl border border-white/10 bg-[#0c0c1e] px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const input = e.currentTarget;
                                const sel = document.getElementById(
                                  "new-skill-cat",
                                ) as HTMLSelectElement;
                                addSkill(input.value, sel.value);
                                input.value = "";
                              }
                            }}
                          />
                          <select
                            id="new-skill-cat"
                            className="rounded-xl border border-white/10 bg-[#0c0c1e] px-2 py-1.5 text-xs text-white"
                          >
                            <option value="TECHNICAL">Technical</option>
                            <option value="TOOLS">Tools & Platforms</option>
                            <option value="SOFT_SKILLS">Soft Skills</option>
                            <option value="LANGUAGES">Languages</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById(
                                "new-skill-input",
                              ) as HTMLInputElement;
                              const sel = document.getElementById(
                                "new-skill-cat",
                              ) as HTMLSelectElement;
                              addSkill(input.value, sel.value);
                              input.value = "";
                            }}
                            className={orangeButton}
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Skill Tags Display */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {resume.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-200"
                          >
                            <span className="font-medium">{skill.name}</span>
                            <span className="text-[10px] font-mono text-gray-500">
                              ({skill.category})
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSkill(idx)}
                              className="text-gray-400 hover:text-red-400 ml-1 transition-colors cursor-pointer"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* --- 6. PROJECTS --- */}
                  {editorSection === "PROJECTS" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">Projects & Proof-of-Work</h3>
                          <p className="text-xs text-gray-400">
                            Real-world software, infrastructure setups, and research capstones.
                          </p>
                        </div>
                        <button type="button" onClick={addProject} className={orangeButton}>
                          <i className="fas fa-plus" />
                          <span>Add Project</span>
                        </button>
                      </div>

                      {resume.projects.map((proj, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/10 bg-[#090918] p-4 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-orange-400">
                              Project #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeProject(idx)}
                              className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <i className="fas fa-trash-alt text-xs" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Project Title *
                              </label>
                              <input
                                type="text"
                                value={proj.title}
                                onChange={(e) => updateProject(idx, { title: e.target.value })}
                                className={inputStyle}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">Role</label>
                              <input
                                type="text"
                                value={proj.role || ""}
                                onChange={(e) => updateProject(idx, { role: e.target.value })}
                                placeholder="Lead Engineer / Creator"
                                className={inputStyle}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-gray-300">
                              Project URL / Repository
                            </label>
                            <input
                              type="url"
                              value={proj.projectUrl || ""}
                              onChange={(e) => updateProject(idx, { projectUrl: e.target.value })}
                              placeholder="https://github.com/..."
                              className={inputStyle}
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-gray-300">
                              Description & Impact *
                            </label>
                            <textarea
                              rows={3}
                              value={proj.description}
                              onChange={(e) =>
                                updateProject(idx, { description: e.target.value })
                              }
                              className={inputStyle}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* --- 7. CERTIFICATIONS --- */}
                  {editorSection === "CERTS" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">Certifications & Licenses</h3>
                          <p className="text-xs text-gray-400">
                            Formal industry credentials (Cisco, AWS, Meta, Microsoft, KSITM).
                          </p>
                        </div>
                        <button type="button" onClick={addCertification} className={orangeButton}>
                          <i className="fas fa-plus" />
                          <span>Add Credential</span>
                        </button>
                      </div>

                      {resume.certifications.map((cert, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/10 bg-[#090918] p-4 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-orange-400">
                              Certification #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCertification(idx)}
                              className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <i className="fas fa-trash-alt text-xs" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Credential Name *
                              </label>
                              <input
                                type="text"
                                value={cert.name}
                                onChange={(e) =>
                                  updateCertification(idx, { name: e.target.value })
                                }
                                className={inputStyle}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Issuing Authority *
                              </label>
                              <input
                                type="text"
                                value={cert.issuingOrganization}
                                onChange={(e) =>
                                  updateCertification(idx, {
                                    issuingOrganization: e.target.value,
                                  })
                                }
                                className={inputStyle}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Issue Year / Date
                              </label>
                              <input
                                type="text"
                                value={cert.issueDate || ""}
                                onChange={(e) =>
                                  updateCertification(idx, { issueDate: e.target.value })
                                }
                                placeholder="2024"
                                className={inputStyle}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300">
                                Verification Link
                              </label>
                              <input
                                type="url"
                                value={cert.credentialUrl || ""}
                                onChange={(e) =>
                                  updateCertification(idx, { credentialUrl: e.target.value })
                                }
                                placeholder="https://..."
                                className={inputStyle}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ============ RIGHT LIVE PREVIEW CANVAS (7 Cols) ============ */}
              <div
                className={`lg:col-span-7 sticky top-6 space-y-3 ${
                  mobileView === "EDIT" ? "hidden sm:block" : "block"
                }`}
              >
                {/* Preview Toolbar */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0c0c1e] px-4 py-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-gray-400">
                      Live ATS Preview
                    </span>
                    <span className="text-gray-600">·</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">
                      {TEMPLATES.find((t) => t.id === resume.template)?.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 text-gray-400">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(65, z - 10))}
                        className="hover:text-white px-1 cursor-pointer"
                        title="Zoom out"
                      >
                        <i className="fas fa-minus text-[10px]" />
                      </button>
                      <span className="font-mono text-[11px] text-gray-300">{zoomLevel}%</span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                        className="hover:text-white px-1 cursor-pointer"
                        title="Zoom in"
                      >
                        <i className="fas fa-plus text-[10px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(100)}
                        className="hover:text-white px-1 text-[10px] font-mono cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* THE RESUME DOCUMENT SHEET CANVAS */}
                <div className="overflow-auto rounded-2xl border border-white/10 bg-[#06060e] p-4 flex justify-center shadow-2xl">
                  <div
                    ref={printRef}
                    id="resume-print-sheet"
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: "top center",
                      width: "210mm",
                      minHeight: "297mm",
                    }}
                    className={`bg-white text-gray-900 shadow-xl transition-transform ${
                      resume.fontFamily === "academic"
                        ? "font-serif"
                        : resume.fontFamily === "mono"
                        ? "font-mono"
                        : "font-sans"
                    }`}
                  >
                    {/* TEMPLATE 1: HARVARD ATS CLEAN (Single-Column) */}
                    {resume.template === "ats-clean" && (
                      <div className="p-10 space-y-5 text-left text-[13px] leading-relaxed text-gray-900">
                        {/* Header */}
                        <div className="text-center border-b pb-4 space-y-1">
                          <h1
                            className="text-2xl font-black uppercase tracking-wide"
                            style={{ color: resume.accentColor }}
                          >
                            {resume.fullName}
                          </h1>
                          <p className="text-xs font-semibold text-gray-700 tracking-wide uppercase">
                            {resume.headline}
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-x-3 text-[11px] text-gray-600 pt-1">
                            {resume.location && <span>{resume.location}</span>}
                            {resume.phone && <span>· {resume.phone}</span>}
                            {resume.email && <span>· {resume.email}</span>}
                            {resume.linkedInUrl && (
                              <span>
                                ·{" "}
                                <a
                                  href={resume.linkedInUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-gray-800"
                                >
                                  LinkedIn
                                </a>
                              </span>
                            )}
                            {resume.githubUrl && (
                              <span>
                                ·{" "}
                                <a
                                  href={resume.githubUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-gray-800"
                                >
                                  GitHub
                                </a>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Summary */}
                        {resume.professionalSummary && (
                          <div className="space-y-1">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                              style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                            >
                              Professional Summary
                            </h2>
                            <p className="text-xs text-gray-800 pt-1 leading-normal">
                              {resume.professionalSummary}
                            </p>
                          </div>
                        )}

                        {/* Education */}
                        {resume.education.length > 0 && (
                          <div className="space-y-2">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                              style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                            >
                              Education & Academic Background
                            </h2>
                            <div className="space-y-2 pt-1">
                              {resume.education.map((edu, i) => (
                                <div key={i} className="text-xs">
                                  <div className="flex justify-between font-bold text-gray-900">
                                    <span>{edu.institution}</span>
                                    <span className="font-mono text-[11px] text-gray-600">
                                      {edu.startDate} – {edu.isCurrent ? "Present" : edu.endDate}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-gray-700 italic">
                                    <span>
                                      {edu.qualification} in {edu.fieldOfStudy}
                                    </span>
                                    {edu.grade && (
                                      <span className="text-[11px] font-semibold not-italic">
                                        {edu.grade}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Experience */}
                        {resume.experience.length > 0 && (
                          <div className="space-y-3">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                              style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                            >
                              Work & Practical Experience
                            </h2>
                            <div className="space-y-3 pt-1">
                              {resume.experience.map((exp, i) => (
                                <div key={i} className="text-xs space-y-1">
                                  <div className="flex justify-between font-bold text-gray-900">
                                    <span>
                                      {exp.roleTitle} —{" "}
                                      <span className="font-semibold text-gray-700">
                                        {exp.organization}
                                      </span>
                                    </span>
                                    <span className="font-mono text-[11px] text-gray-600">
                                      {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                                    </span>
                                  </div>
                                  {exp.location && (
                                    <div className="text-[11px] text-gray-500 italic">
                                      {exp.location}
                                    </div>
                                  )}
                                  <div className="text-gray-800 text-[11px] whitespace-pre-line leading-relaxed pl-2">
                                    {exp.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Projects */}
                        {resume.projects.length > 0 && (
                          <div className="space-y-2">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                              style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                            >
                              Selected Projects & Proof of Work
                            </h2>
                            <div className="space-y-2 pt-1">
                              {resume.projects.map((proj, i) => (
                                <div key={i} className="text-xs space-y-0.5">
                                  <div className="flex justify-between font-bold text-gray-900">
                                    <span>
                                      {proj.title}
                                      {proj.role && (
                                        <span className="font-normal text-gray-600">
                                          {" "}
                                          ({proj.role})
                                        </span>
                                      )}
                                    </span>
                                    {proj.projectUrl && (
                                      <a
                                        href={proj.projectUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] font-mono text-gray-500 underline"
                                      >
                                        Live Link
                                      </a>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-800">{proj.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {resume.skills.length > 0 && (
                          <div className="space-y-1.5">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                              style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                            >
                              Skills & Core Competencies
                            </h2>
                            <div className="text-xs text-gray-800 pt-1 space-y-1">
                              <div>
                                <span className="font-bold">Technical: </span>
                                {resume.skills
                                  .filter((s) => s.category === "TECHNICAL")
                                  .map((s) => s.name)
                                  .join(", ") || "None"}
                              </div>
                              <div>
                                <span className="font-bold">Tools & Platforms: </span>
                                {resume.skills
                                  .filter((s) => s.category === "TOOLS")
                                  .map((s) => s.name)
                                  .join(", ") || "None"}
                              </div>
                              <div>
                                <span className="font-bold">Interpersonal & Soft Skills: </span>
                                {resume.skills
                                  .filter((s) => s.category === "SOFT_SKILLS")
                                  .map((s) => s.name)
                                  .join(", ") || "None"}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Certifications */}
                        {resume.certifications.length > 0 && (
                          <div className="space-y-1.5">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                              style={{ borderColor: resume.accentColor, color: resume.accentColor }}
                            >
                              Certifications & Accreditations
                            </h2>
                            <div className="text-xs text-gray-800 pt-1 space-y-1">
                              {resume.certifications.map((c, i) => (
                                <div key={i} className="flex justify-between text-[11px]">
                                  <span>
                                    <span className="font-bold">{c.name}</span> —{" "}
                                    {c.issuingOrganization}
                                  </span>
                                  {c.issueDate && (
                                    <span className="font-mono text-gray-500">{c.issueDate}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TEMPLATE 2: MODERN DUAL-COLUMN */}
                    {resume.template === "modern-dual" && (
                      <div className="grid grid-cols-12 min-h-[297mm]">
                        {/* Left Sidebar (4 Cols) */}
                        <div
                          className="col-span-4 p-7 text-white space-y-6"
                          style={{ backgroundColor: resume.accentColor }}
                        >
                          <div>
                            <h1 className="text-xl font-black uppercase tracking-wide">
                              {resume.fullName}
                            </h1>
                            <p className="text-xs opacity-90 font-medium tracking-wide">
                              {resume.headline}
                            </p>
                          </div>

                          <div className="space-y-2 text-xs opacity-95">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b border-white/20 pb-1">
                              Contact
                            </h3>
                            <div className="space-y-1 text-[11px]">
                              {resume.location && <div>{resume.location}</div>}
                              {resume.phone && <div>{resume.phone}</div>}
                              {resume.email && <div className="break-all">{resume.email}</div>}
                              {resume.linkedInUrl && (
                                <div>
                                  <a href={resume.linkedInUrl} className="underline">
                                    LinkedIn
                                  </a>
                                </div>
                              )}
                              {resume.githubUrl && (
                                <div>
                                  <a href={resume.githubUrl} className="underline">
                                    GitHub
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {resume.skills.length > 0 && (
                            <div className="space-y-2 text-xs opacity-95">
                              <h3 className="text-[11px] font-bold uppercase tracking-wider border-b border-white/20 pb-1">
                                Skills
                              </h3>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {resume.skills.map((s, i) => (
                                  <span
                                    key={i}
                                    className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium"
                                  >
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {resume.certifications.length > 0 && (
                            <div className="space-y-2 text-xs opacity-95">
                              <h3 className="text-[11px] font-bold uppercase tracking-wider border-b border-white/20 pb-1">
                                Certifications
                              </h3>
                              <div className="space-y-2 pt-1 text-[11px]">
                                {resume.certifications.map((c, i) => (
                                  <div key={i}>
                                    <div className="font-bold">{c.name}</div>
                                    <div className="text-[10px] opacity-80">
                                      {c.issuingOrganization}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Main Column (8 Cols) */}
                        <div className="col-span-8 p-8 space-y-6 text-gray-900 text-left">
                          {resume.professionalSummary && (
                            <div className="space-y-1.5">
                              <h2
                                className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                                style={{ color: resume.accentColor }}
                              >
                                Professional Profile
                              </h2>
                              <p className="text-xs text-gray-800 leading-relaxed">
                                {resume.professionalSummary}
                              </p>
                            </div>
                          )}

                          {resume.experience.length > 0 && (
                            <div className="space-y-3">
                              <h2
                                className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                                style={{ color: resume.accentColor }}
                              >
                                Experience
                              </h2>
                              <div className="space-y-3 pt-1">
                                {resume.experience.map((exp, i) => (
                                  <div key={i} className="text-xs space-y-1">
                                    <div className="flex justify-between font-bold">
                                      <span>
                                        {exp.roleTitle} · {exp.organization}
                                      </span>
                                      <span className="font-mono text-[11px] text-gray-500">
                                        {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed">
                                      {exp.description}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {resume.education.length > 0 && (
                            <div className="space-y-2">
                              <h2
                                className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                                style={{ color: resume.accentColor }}
                              >
                                Education
                              </h2>
                              <div className="space-y-2 pt-1">
                                {resume.education.map((edu, i) => (
                                  <div key={i} className="text-xs">
                                    <div className="flex justify-between font-bold">
                                      <span>{edu.institution}</span>
                                      <span className="font-mono text-[11px] text-gray-500">
                                        {edu.startDate} – {edu.endDate}
                                      </span>
                                    </div>
                                    <div className="text-gray-700 text-[11px]">
                                      {edu.qualification} in {edu.fieldOfStudy}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {resume.projects.length > 0 && (
                            <div className="space-y-2">
                              <h2
                                className="text-xs font-bold uppercase tracking-wider border-b pb-1"
                                style={{ color: resume.accentColor }}
                              >
                                Featured Projects
                              </h2>
                              <div className="space-y-2 pt-1">
                                {resume.projects.map((p, i) => (
                                  <div key={i} className="text-xs">
                                    <div className="font-bold">{p.title}</div>
                                    <p className="text-[11px] text-gray-700">{p.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TEMPLATE 3 & 4 FALLBACK TO ATS CLEAN WITH ACCENT HIGHLIGHTS */}
                    {(resume.template === "tech-minimal" ||
                      resume.template === "executive-serif") && (
                      <div className="p-10 space-y-5 text-left text-[13px] leading-relaxed text-gray-900">
                        <div
                          className={`border-b-2 pb-4 ${
                            resume.template === "executive-serif" ? "text-center" : ""
                          }`}
                          style={{ borderColor: resume.accentColor }}
                        >
                          <h1
                            className="text-2xl font-black uppercase tracking-wide"
                            style={{ color: resume.accentColor }}
                          >
                            {resume.fullName}
                          </h1>
                          <p className="text-xs font-semibold text-gray-700 tracking-wide uppercase mt-0.5">
                            {resume.headline}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-gray-600 pt-2 font-mono">
                            {resume.location && <span>{resume.location}</span>}
                            {resume.phone && <span>· {resume.phone}</span>}
                            {resume.email && <span>· {resume.email}</span>}
                            {resume.linkedInUrl && (
                              <span>
                                ·{" "}
                                <a
                                  href={resume.linkedInUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-gray-800"
                                >
                                  LinkedIn
                                </a>
                              </span>
                            )}
                            {resume.githubUrl && (
                              <span>
                                ·{" "}
                                <a
                                  href={resume.githubUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-gray-800"
                                >
                                  GitHub
                                </a>
                              </span>
                            )}
                          </div>
                        </div>

                        {resume.professionalSummary && (
                          <div className="space-y-1">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{ color: resume.accentColor }}
                            >
                              {"// Summary"}
                            </h2>
                            <p className="text-xs text-gray-800">{resume.professionalSummary}</p>
                          </div>
                        )}

                        {resume.experience.length > 0 && (
                          <div className="space-y-3">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{ color: resume.accentColor }}
                            >
                              {"// Experience & Impact"}
                            </h2>
                            <div className="space-y-3">
                              {resume.experience.map((exp, i) => (
                                <div key={i} className="text-xs space-y-1">
                                  <div className="flex justify-between font-bold">
                                    <span>
                                      {exp.roleTitle} @ {exp.organization}
                                    </span>
                                    <span className="font-mono text-[11px] text-gray-500">
                                      {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed pl-2">
                                    {exp.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {resume.education.length > 0 && (
                          <div className="space-y-2">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{ color: resume.accentColor }}
                            >
                              {"// Education"}
                            </h2>
                            <div className="space-y-1.5">
                              {resume.education.map((edu, i) => (
                                <div key={i} className="text-xs flex justify-between">
                                  <span>
                                    <span className="font-bold">{edu.institution}</span> ·{" "}
                                    {edu.qualification} in {edu.fieldOfStudy}
                                  </span>
                                  <span className="font-mono text-gray-500">
                                    {edu.startDate} – {edu.endDate}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {resume.skills.length > 0 && (
                          <div className="space-y-2">
                            <h2
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{ color: resume.accentColor }}
                            >
                              {"// Skills Matrix"}
                            </h2>
                            <div className="flex flex-wrap gap-1.5">
                              {resume.skills.map((s, i) => (
                                <span
                                  key={i}
                                  className="rounded border border-gray-300 px-2 py-0.5 text-[11px] font-mono text-gray-800"
                                >
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= ATS AUDIT MODAL ================= */}
      {showAtsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-[#0c0c1e] p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <i className="fas fa-gauge-high text-orange-400" />
                <h3 className="text-base font-bold">ATS Audit & Recruiter Diagnostic</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAtsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Overall Score */}
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Overall Readiness</div>
                <div className="text-3xl font-black text-orange-400 mt-0.5">
                  {atsResult.score} / 100
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
                  {atsResult.grade}
                </span>
                <p className="text-[11px] text-gray-400 mt-1">
                  Compliant with Harvard ATS benchmark
                </p>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div className="space-y-2 text-xs">
              <span className="font-mono text-[11px] text-gray-400 uppercase">
                Category Breakdown
              </span>
              {Object.values(atsResult.breakdown).map((b, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-gray-300">
                    <span>{b.label}</span>
                    <span className="font-mono">
                      {b.score} / {b.max}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${(b.score / b.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actionable Recommendations */}
            {atsResult.improvements.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-mono text-[11px] text-amber-400 uppercase font-bold">
                  Recommended Enhancements
                </span>
                <ul className="space-y-1 text-gray-300 pl-4 list-disc text-[11px]">
                  {atsResult.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAtsModal(false)}
                className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-[#090915] hover:bg-orange-400 transition-colors cursor-pointer"
              >
                Close & Continue Optimizing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
