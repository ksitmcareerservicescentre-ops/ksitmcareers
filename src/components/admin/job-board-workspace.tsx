"use client";

import { useEffect, useState, useTransition } from "react";
import {
  listJobPostingsAction,
  createJobPostingAction,
  updateJobPostingAction,
  deleteJobPostingAction,
  type JobPostingItem,
  type CreateJobInput,
} from "@/actions/jobs";
import {
  recommendJobToStudentAction,
} from "@/actions/employers";
import { listStudentsAction, type StudentTableRow } from "@/actions/students";

const DEPARTMENTS = [
  "ALL",
  "Computer Science",
  "Computer Software Engineering",
  "Networking & System Security",
  "Banking Operations & FinTech",
  "Mass Communication",
  "Business Administration",
];

const WORK_NATURES = [
  "ALL",
  "Full-Time",
  "Full-Time (Hybrid)",
  "Full-Time (On-Site)",
  "Full-Time (Remote)",
  "Part-Time",
  "Contract",
  "Internship / SIWES (On-Site)",
  "Internship / SIWES (Remote)",
];

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50 cursor-pointer";

const inputStyle =
  "w-full rounded-xl border border-white/15 bg-[#090918] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function JobBoardWorkspace() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [natureOfWork, setNatureOfWork] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [editingJob, setEditingJob] = useState<JobPostingItem | "NEW" | null>(null);
  const [viewingJob, setViewingJob] = useState<JobPostingItem | null>(null);
  const [recommendingJob, setRecommendingJob] = useState<JobPostingItem | null>(null);

  // Students for recommendation
  const [students, setStudents] = useState<StudentTableRow[]>([]);

  // Notice banner
  const [notice, setNotice] = useState<string | null>(null);

  const loadJobs = () => {
    setLoading(true);
    void listJobPostingsAction({
      search: search.trim() || undefined,
      department: department !== "ALL" ? department : undefined,
      natureOfWork: natureOfWork !== "ALL" ? natureOfWork : undefined,
    })
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load jobs:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    void listJobPostingsAction({
      search: search.trim() || undefined,
      department: department !== "ALL" ? department : undefined,
      natureOfWork: natureOfWork !== "ALL" ? natureOfWork : undefined,
    })
      .then((data) => {
        if (!active) return;
        setJobs(data);
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          console.error("Failed to load jobs:", err);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [search, department, natureOfWork]);

  useEffect(() => {
    listStudentsAction().then((res) => {
      setStudents(res);
    }).catch(console.error);
  }, []);

  const totalVacancies = jobs.reduce((sum, j) => sum + (j.vacanciesCount || 1), 0);
  const totalActivePlacements = jobs.reduce((sum, j) => sum + (j.activePlacementsCount || 0), 0);
  const totalRecommendations = jobs.reduce((sum, j) => sum + (j.recommendationsCount || 0), 0);

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the job vacancy "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteJobPostingAction(id);
      if (res.success) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        setNotice(`Job "${title}" deleted successfully.`);
        setTimeout(() => setNotice(null), 4000);
      } else {
        alert(res.error || "Failed to delete job.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-briefcase" />
            <span>Institutional Job Board</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            Job Board & Opportunities Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-2xl">
            Publish verified corporate job vacancies with full detailed job descriptions, vacancies needed, duration, and work nature. Recommend opportunities to qualified students and monitor active supervision.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingJob("NEW")}
          className={orangeButton}
        >
          <i className="fas fa-plus" />
          <span>Post New Job Vacancy</span>
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-300">
          <i className="fas fa-check-circle text-emerald-400 shrink-0" />
          <span className="flex-1 font-medium">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Published Openings
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {jobs.length}
          </div>
          <p className="mt-1 text-xs text-gray-500">Active positions</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Total Employees Needed
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-orange-400">
            {totalVacancies}
          </div>
          <p className="mt-1 text-xs text-gray-500">Cumulative vacancies</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Staff Recommendations
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-purple-400">
            {totalRecommendations}
          </div>
          <p className="mt-1 text-xs text-gray-500">Student endorsements</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101023] p-5 shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Supervised Placements
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {totalActivePlacements}
          </div>
          <p className="mt-1 text-xs text-gray-500">In-progress placements</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101023] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-3.5 top-3 text-xs text-gray-500" />
          <input
            type="text"
            placeholder="Search job title, employer, skills, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputStyle} pl-9`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#090918] px-3 py-2 text-xs text-white focus:border-orange-500 cursor-pointer"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "ALL" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          <select
            value={natureOfWork}
            onChange={(e) => setNatureOfWork(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#090918] px-3 py-2 text-xs text-white focus:border-orange-500 cursor-pointer"
          >
            {WORK_NATURES.map((nature) => (
              <option key={nature} value={nature}>
                {nature === "ALL" ? "All Work Natures" : nature}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Job Postings Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <i className="fas fa-spinner fa-spin text-2xl text-orange-400 mb-2" />
          <p>Loading job vacancies...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#101023] p-12 text-center">
          <i className="fas fa-briefcase text-4xl text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-white">No Job Vacancies Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
            No opportunities match your current filter criteria. Post a new opening or reset filters.
          </p>
          <button
            type="button"
            onClick={() => setEditingJob("NEW")}
            className={`${orangeButton} mt-5`}
          >
            <i className="fas fa-plus" />
            <span>Create First Job Posting</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#101023] shadow-xl transition-all hover:border-orange-500/40"
            >
              <div className="p-5 space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 truncate block">
                      {item.companyName}
                    </span>
                    <h3 className="text-base font-extrabold text-white leading-snug mt-0.5 line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-300 shrink-0">
                    {item.vacanciesCount} {item.vacanciesCount === 1 ? "Opening" : "Openings"}
                  </span>
                </div>

                {/* Specs badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                    <i className="fas fa-laptop-house text-cyan-400 mr-1" />
                    {item.natureOfWork}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                    <i className="fas fa-hourglass-half text-purple-400 mr-1" />
                    {item.duration}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">
                    <i className="fas fa-map-marker-alt text-rose-400 mr-1" />
                    {item.location}
                  </span>
                </div>

                {/* Salary & Department */}
                <div className="text-xs space-y-1">
                  {item.salaryRange && (
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <i className="fas fa-money-bill-wave text-[11px]" />
                      <span>{item.salaryRange}</span>
                    </div>
                  )}
                  <div className="text-gray-400 text-[11px] truncate">
                    <i className="fas fa-layer-group text-gray-500 mr-1" />
                    Target: {item.department}
                  </div>
                </div>

                {/* Summary snippet */}
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>

                {/* Recommendations and supervision metrics */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[11px] flex items-center justify-between">
                  <span className="text-gray-400">
                    <i className="fas fa-user-check text-orange-400 mr-1" />
                    {item.recommendationsCount} Recommended
                  </span>
                  <span className="text-gray-400">
                    <i className="fas fa-play text-emerald-400 mr-1" />
                    {item.activePlacementsCount} In-Progress
                  </span>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="border-t border-white/10 p-3.5 bg-white/[0.01] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewingJob(item)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                    title="View Full Detailed Job Description"
                  >
                    <i className="fas fa-eye" /> Full Details
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecommendingJob(item)}
                    className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    title="Recommend this job to a student"
                  >
                    <i className="fas fa-user-plus" /> Recommend
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingJob(item)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                    title="Edit Job Post"
                  >
                    <i className="fas fa-edit text-xs" />
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(item.id, item.title)}
                    className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer"
                    title="Delete Job Post"
                  >
                    <i className="fas fa-trash-alt text-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: VIEW FULL DETAILED JOB DESCRIPTION */}
      {viewingJob && (
        <JobDetailsModal
          job={viewingJob}
          onClose={() => setViewingJob(null)}
          onRecommend={() => {
            const target = viewingJob;
            setViewingJob(null);
            setRecommendingJob(target);
          }}
        />
      )}

      {/* MODAL 2: CREATE OR EDIT JOB VACANCY */}
      {editingJob && (
        <JobEditorModal
          initialData={editingJob === "NEW" ? null : editingJob}
          onClose={() => setEditingJob(null)}
          onSuccess={(saved) => {
            if (editingJob === "NEW") {
              setJobs((prev) => [saved, ...prev]);
              setNotice(`Job vacancy "${saved.title}" posted successfully!`);
            } else {
              setJobs((prev) => prev.map((j) => (j.id === saved.id ? saved : j)));
              setNotice(`Job vacancy "${saved.title}" updated successfully!`);
            }
            setEditingJob(null);
            setTimeout(() => setNotice(null), 4000);
          }}
        />
      )}

      {/* MODAL 3: RECOMMEND JOB TO STUDENT */}
      {recommendingJob && (
        <RecommendJobModal
          job={recommendingJob}
          students={students}
          onClose={() => setRecommendingJob(null)}
          onSuccess={() => {
            setNotice(`Student successfully recommended for "${recommendingJob.title}"! Engagement supervisor assigned.`);
            setRecommendingJob(null);
            loadJobs();
            setTimeout(() => setNotice(null), 5000);
          }}
        />
      )}
    </div>
  );
}

/**
 * Modal: Full Detailed Job Description
 */
function JobDetailsModal({
  job,
  onClose,
  onRecommend,
}: {
  job: JobPostingItem;
  onClose: () => void;
  onRecommend: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
              {job.companyName}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {job.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Specs Badges Strip */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 font-bold text-orange-300">
            <i className="fas fa-users mr-1.5" />
            {job.vacanciesCount} {job.vacanciesCount === 1 ? "Employee Needed" : "Employees Needed"}
          </span>
          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-gray-300">
            <i className="fas fa-briefcase text-cyan-400 mr-1.5" />
            {job.natureOfWork}
          </span>
          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-gray-300">
            <i className="fas fa-hourglass-half text-purple-400 mr-1.5" />
            Duration: {job.duration}
          </span>
          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-gray-300">
            <i className="fas fa-map-marker-alt text-rose-400 mr-1.5" />
            {job.location}
          </span>
          {job.salaryRange && (
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-300">
              <i className="fas fa-money-bill-wave mr-1.5" />
              {job.salaryRange}
            </span>
          )}
        </div>

        {/* Detailed Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Detailed Position Description
          </h4>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {/* Responsibilities list */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Key Responsibilities & Scope of Work
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              {job.responsibilities.map((resp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-orange-400 mt-0.5" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements list */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Candidate Requirements & Qualifications
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fas fa-graduation-cap text-cyan-400 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills Tag */}
        {job.skills && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Competencies & Technical Skills
            </h4>
            <div className="flex flex-wrap items-center gap-1.5">
              {job.skills.split(",").map((s, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300"
                >
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Application details */}
        {(job.contactEmail || job.applicationUrl) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2">
            <div className="font-bold text-gray-200">How to Apply / Forward Inquiries:</div>
            {job.contactEmail && (
              <div className="text-gray-300">
                Email: <span className="text-orange-400 font-mono">{job.contactEmail}</span>
              </div>
            )}
            {job.applicationUrl && (
              <div className="text-gray-300 truncate">
                Portal:{" "}
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  {job.applicationUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Modal footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Close
          </button>
          <button type="button" onClick={onRecommend} className={orangeButton}>
            <i className="fas fa-user-plus" />
            <span>Recommend Student for This Job</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal: Create or Edit Job Vacancy
 */
function JobEditorModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData: JobPostingItem | null;
  onClose: () => void;
  onSuccess: (saved: JobPostingItem) => void;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [companyName, setCompanyName] = useState(initialData?.companyName || "");
  const [department, setDepartment] = useState(initialData?.department || "Computer Software Engineering");
  const [natureOfWork, setNatureOfWork] = useState(initialData?.natureOfWork || "Full-Time");
  const [duration, setDuration] = useState(initialData?.duration || "Permanent");
  const [vacanciesCount, setVacanciesCount] = useState(initialData?.vacanciesCount || 1);
  const [salaryRange, setSalaryRange] = useState(initialData?.salaryRange || "");
  const [location, setLocation] = useState(initialData?.location || "Katsina, Nigeria");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [requirementsText, setRequirementsText] = useState(
    initialData?.requirements ? initialData.requirements.join("\n") : "",
  );
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    initialData?.responsibilities ? initialData.responsibilities.join("\n") : "",
  );
  const [skills, setSkills] = useState(initialData?.skills || "");
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || "");
  const [applicationUrl, setApplicationUrl] = useState(initialData?.applicationUrl || "");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !companyName.trim() || !summary.trim() || !description.trim()) {
      setError("Please fill in Title, Company Name, Summary, and Description.");
      return;
    }

    const requirements = requirementsText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const responsibilities = responsibilitiesText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const payload: CreateJobInput = {
      title: title.trim(),
      companyName: companyName.trim(),
      department,
      natureOfWork,
      duration,
      vacanciesCount: Number(vacanciesCount) || 1,
      salaryRange: salaryRange.trim() || undefined,
      location: location.trim(),
      summary: summary.trim(),
      description: description.trim(),
      requirements,
      responsibilities,
      skills: skills.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      applicationUrl: applicationUrl.trim() || undefined,
    };

    startTransition(async () => {
      try {
        if (initialData) {
          const res = await updateJobPostingAction(initialData.id, payload);
          if (!res.success) throw new Error(res.error);
          onSuccess({
            ...initialData,
            ...payload,
            salaryRange: payload.salaryRange || null,
            skills: payload.skills || null,
            contactEmail: payload.contactEmail || null,
            applicationUrl: payload.applicationUrl || null,
            requirements,
            responsibilities,
            updatedAt: new Date(),
          });
        } else {
          const res = await createJobPostingAction(payload);
          if (!res.success || !res.jobId) throw new Error(res.error);
          onSuccess({
            id: res.jobId,
            slug: `${companyName}-${title}`.toLowerCase().replace(/\s+/g, "-"),
            employerId: null,
            companyLogoUrl: null,
            applicationDeadline: null,
            isPublished: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            recommendationsCount: 0,
            activePlacementsCount: 0,
            ...payload,
            salaryRange: payload.salaryRange || null,
            skills: payload.skills || null,
            contactEmail: payload.contactEmail || null,
            applicationUrl: payload.applicationUrl || null,
            requirements,
            responsibilities,
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to save job posting.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white">
            {initialData ? "Edit Job Vacancy" : "Post New Job Opportunity"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Junior Cloud Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Company / Employer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. MTN Nigeria or Katsina Tech Hub"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Target Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputStyle}
              >
                {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="ALL">All Departments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Nature of Work *</label>
              <select
                value={natureOfWork}
                onChange={(e) => setNatureOfWork(e.target.value)}
                className={inputStyle}
              >
                {WORK_NATURES.filter((n) => n !== "ALL").map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Duration *</label>
              <input
                type="text"
                required
                placeholder="e.g. Permanent, 12 Months, 6 Months"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Employees Needed (Vacancies) *</label>
              <input
                type="number"
                min={1}
                required
                value={vacanciesCount}
                onChange={(e) => setVacanciesCount(Number(e.target.value))}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Salary / Stipend Range</label>
              <input
                type="text"
                placeholder="e.g. ₦200,000 - ₦280,000 / month"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Katsina, Nigeria or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Job Summary (Short Overview) *</label>
            <textarea
              rows={2}
              required
              placeholder="Brief 2-sentence summary of the vacancy..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Full Detailed Job Description *</label>
            <textarea
              rows={5}
              required
              placeholder="Provide the complete in-depth role description, background, organizational mission, and day-to-day workflow..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Key Responsibilities (One per line)
              </label>
              <textarea
                rows={4}
                placeholder="• Monitor server uptime&#10;• Deploy containerized web services&#10;• Document incident logs"
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Candidate Requirements (One per line)
              </label>
              <textarea
                rows={4}
                placeholder="• ND or HND in Computer Software Engineering&#10;• Linux command line familiarity&#10;• Good communication in English and Hausa"
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Key Skills (Comma-separated)</label>
              <input
                type="text"
                placeholder="Linux, Docker, Python, GCP"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Contact Email</label>
              <input
                type="email"
                placeholder="careers@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Application URL</label>
              <input
                type="url"
                placeholder="https://company.com/apply"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={orangeButton}>
              <i className="fas fa-save" />
              <span>{isPending ? "Saving..." : initialData ? "Update Job Post" : "Publish Job Vacancy"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal: Recommend Job to Student
 */
function RecommendJobModal({
  job,
  students,
  onClose,
  onSuccess,
}: {
  job: JobPostingItem;
  students: StudentTableRow[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [recommendationReason, setRecommendationReason] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.regNumber.toLowerCase().includes(q) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedStudentId) {
      setError("Please select a student to recommend.");
      return;
    }

    if (!recommendationReason.trim()) {
      setError("Please provide a recommendation justification explaining why you are recommending this student.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await recommendJobToStudentAction({
          jobId: job.id,
          studentId: selectedStudentId,
          recommendationReason: recommendationReason.trim(),
        });

        if (!res.success) throw new Error(res.error);
        onSuccess();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to recommend student.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d0d1e] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Staff Endorsement & Placement Supervision
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Recommend Student for: {job.title}
            </h3>
            <p className="text-xs text-gray-400">{job.companyName} · {job.natureOfWork}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Select Target Student *
            </label>
            <div className="relative mb-2">
              <i className="fas fa-search absolute left-3 top-2.5 text-xs text-gray-500" />
              <input
                type="text"
                placeholder="Filter students by name, reg number, department..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className={`${inputStyle} pl-8 py-1.5 text-xs`}
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#070714] divide-y divide-white/5">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  No students found.
                </div>
              ) : (
                filteredStudents.map((st) => {
                  const selected = selectedStudentId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`flex w-full items-center justify-between p-2.5 text-left text-xs transition-colors cursor-pointer ${
                        selected
                          ? "bg-purple-500/20 text-white font-bold"
                          : "text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs">
                          {st.fullName.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="truncate">{st.fullName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {st.regNumber} · {st.department || "General"}
                          </div>
                        </div>
                      </div>

                      {selected && (
                        <i className="fas fa-check-circle text-purple-400 mr-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Recommendation Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Why are you recommending this student? (Rationale & Endorsement) *
            </label>
            <textarea
              rows={4}
              required
              placeholder="State your advisory rationale: e.g. Demonstrated exceptional proficiency in cloud infrastructure during assessment benchmarks; achieved 95% on virtual internship simulation..."
              value={recommendationReason}
              onChange={(e) => setRecommendationReason(e.target.value)}
              className={inputStyle}
            />
            <p className="mt-1 text-[11px] text-gray-500">
              This recommendation and your name will be displayed in the Employer Engagement matrix, and you will be designated to supervise this student&apos;s placement status.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={orangeButton}>
              <i className="fas fa-paper-plane" />
              <span>{isPending ? "Submitting..." : "Confirm Recommendation & Assign Supervision"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
