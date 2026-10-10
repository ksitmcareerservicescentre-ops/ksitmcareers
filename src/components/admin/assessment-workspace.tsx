"use client";

import { useState, useEffect, useTransition } from "react";
import {
  listAssessmentsAction,
  getAssessmentDetailAction,
  createAssessmentAction,
  updateAssessmentAction,
  deleteAssessmentAction,
  searchStudentsForAssessmentAction,
  assignAssessmentToStudentsAction,
  getAssessmentParticipantsAction,
  getStudentAttemptDetailAction,
  seedFiveSampleAssessmentsAction,
} from "@/actions/assessments";
import {
  AssessmentSummary,
  ObjectiveQuestionData,
  StudentParticipantRecord,
  parseObjectiveQuestionsFromText,
  exportObjectiveQuestionsToText,
  starterNaceQuestions,
} from "@/lib/assessments";
import { AssessmentCard } from "@/components/assessments/assessment-card";
import { QuestionBuilderItem } from "@/components/assessments/question-builder-item";
import { DurationSelector } from "@/components/assessments/duration-selector";

interface StudentSearchResult {
  id: string;
  fullName: string;
  regNumber: string;
  department: string | null;
  level: string | null;
  isAssigned: boolean;
}

interface AttemptInspectorData {
  attempt: {
    id: string;
    studentName: string;
    regNumber: string;
    department: string | null;
    assessmentTitle: string;
    score: number | null;
    passingScore: number;
    status: string;
    completedAt: Date | string | null;
  };
  questions: Array<{
    questionId: string;
    displayOrder: number;
    questionText: string;
    choices: Array<{ id: string; text: string }>;
    chosenOption: string | null;
    correctOption: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

const orangeButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2.5 text-xs font-extrabold text-[#090915] shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50";

const cardStyle =
  "rounded-2xl border border-white/[0.08] bg-[#0c0c1e]/90 p-5 backdrop-blur-xl shadow-xl transition-all";

export function AssessmentWorkspace() {
  const [tab, setTab] = useState<"catalog" | "participants">("catalog");
  const [assessmentsList, setAssessmentsList] = useState<AssessmentSummary[]>([]);
  const [participants, setParticipants] = useState<StudentParticipantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [assignModalAssessment, setAssignModalAssessment] = useState<AssessmentSummary | null>(null);
  const [previewModalAssessment, setPreviewModalAssessment] = useState<{
    assessment: AssessmentSummary;
    questions: ObjectiveQuestionData[];
  } | null>(null);
  const [inspectData, setInspectData] = useState<AttemptInspectorData | null>(null);

  // Load Assessments & Participants
  const loadData = async () => {
    try {
      const [list, parts] = await Promise.all([
        listAssessmentsAction(),
        getAssessmentParticipantsAction(),
      ]);
      setAssessmentsList(list);
      setParticipants(parts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load assessments data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([listAssessmentsAction(), getAssessmentParticipantsAction()])
      .then(([list, parts]) => {
        if (active) {
          setAssessmentsList(list);
          setParticipants(parts);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load assessments data.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Filtered Assessments
  const filteredAssessments = assessmentsList.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? item.isActive : !item.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Quick stats
  const totalAssessments = assessmentsList.length;
  const totalAssigned = participants.length;
  const totalCompleted = participants.filter((p) => p.status === "SUBMITTED" || p.status === "REVIEWED").length;
  const passedCount = participants.filter((p) => p.passed === true).length;
  const institutionalPassRate =
    totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;

  const handleSeedDefaults = () => {
    if (confirm("Would you like to seed/restore all 5 Standard Job Readiness Assessments (100 verified questions)?")) {
      startTransition(async () => {
        const res = await seedFiveSampleAssessmentsAction();
        if (res.success) {
          await loadData();
        } else {
          setError(res.error || "Failed to seed sample assessments.");
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-clipboard-check text-xs" />
            <span>Open Assessment Engine · 2026 Edition</span>
          </div>
          <h1 className="font-academic mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Job Readiness Assessments
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage objective examination templates (up to 300 items), preview student view, assign to cohorts, and track score ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setTab("catalog")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                tab === "catalog"
                  ? "bg-orange-500 text-[#090915] shadow-md shadow-orange-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <i className="fas fa-layer-group mr-1.5" />
              Assessments Catalog ({totalAssessments})
            </button>
            <button
              type="button"
              onClick={() => setTab("participants")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                tab === "participants"
                  ? "bg-orange-500 text-[#090915] shadow-md shadow-orange-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <i className="fas fa-user-graduate mr-1.5" />
              Participants & Scores ({totalAssigned})
            </button>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={handleSeedDefaults}
            className={secondaryButton}
            title="Seed or verify all 5 Standard Job Readiness Assessments"
          >
            <i className="fas fa-sync text-orange-400" />
            <span>Seed 5 Standards</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingAssessmentId(null);
              setEditorOpen(true);
            }}
            className={orangeButton}
          >
            <i className="fas fa-plus" />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <i className="fas fa-exclamation-circle text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Matrix Strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Active Assessments
            </span>
            <i className="fas fa-file-alt text-orange-400/80 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {totalAssessments}
          </div>
          <p className="mt-1 text-xs text-gray-500">Configured in curriculum</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Total Assigned
            </span>
            <i className="fas fa-users text-purple-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 sm:text-3xl">
            {totalAssigned}
          </div>
          <p className="mt-1 text-xs text-gray-500">Student cohort assignments</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Submitted Exams
            </span>
            <i className="fas fa-check-circle text-emerald-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
            {totalCompleted}
          </div>
          <p className="mt-1 text-xs text-gray-500">Completed & auto-graded</p>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Institutional Pass Rate
            </span>
            <i className="fas fa-chart-line text-amber-400 text-sm" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 sm:text-3xl">
            {institutionalPassRate}%
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {passedCount} of {totalCompleted} passed
          </p>
        </div>
      </section>

      {/* TAB 1: ASSESSMENTS CATALOG */}
      {tab === "catalog" && (
        <div className="space-y-6">
          {/* SEARCH, FILTER & VIEW MODE CONTROL BAR */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 sm:flex-row sm:items-center sm:justify-between shadow-lg">
            {/* Search Input */}
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments by title, curriculum category, or keywords..."
                className="w-full rounded-xl border border-white/10 bg-[#070714] pl-9 pr-9 py-2 text-xs text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#070714] px-3 py-2 text-xs text-gray-300 focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Diagnostic Core">Diagnostic Core</option>
                <option value="Technical Skills">Technical Skills</option>
                <option value="Resume & ATS">Resume & ATS</option>
                <option value="Interview Mastery">Interview Mastery</option>
                <option value="Workplace Ethics">Workplace Ethics</option>
                <option value="Capstone Assessment">Capstone Assessment</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#070714] px-3 py-2 text-xs text-gray-300 focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="DRAFT">Draft Only</option>
              </select>

              {/* View Mode Toggle: Grid vs List */}
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    viewMode === "grid"
                      ? "bg-orange-500 text-[#090915] shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <i className="fas fa-th-large mr-1" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List / Table View"
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    viewMode === "list"
                      ? "bg-orange-500 text-[#090915] shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <i className="fas fa-list mr-1" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16 text-sm text-gray-400">
              <i className="fas fa-spinner fa-spin mr-2 text-orange-400" /> Loading assessments catalog…
            </div>
          ) : assessmentsList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#0e0e22]/50 p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-2xl">
                <i className="fas fa-clipboard-list" />
              </div>
              <h3 className="font-academic text-xl font-bold text-white">
                No Assessments in Catalog
              </h3>
              <p className="mx-auto max-w-md text-xs text-gray-400 leading-relaxed">
                Click below to instantly initialize all 5 realistic standard job readiness assessments (100 questions total) or create a custom one from scratch.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleSeedDefaults}
                  className={orangeButton}
                >
                  <i className="fas fa-magic" />
                  <span>Seed 5 Standard Job Assessments</span>
                </button>
              </div>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c1e] p-10 text-center space-y-3">
              <i className="fas fa-search text-gray-500 text-2xl" />
              <h3 className="text-sm font-bold text-white">No Matching Assessments Found</h3>
              <p className="text-xs text-gray-400">
                No assessments matched your query &quot;{searchQuery}&quot; or chosen category filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className={secondaryButton}
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredAssessments.map((item) => (
                <AssessmentCard
                  key={item.id}
                  assessment={item}
                  onAssign={(a) => setAssignModalAssessment(a)}
                  onPreview={async (a) => {
                    const detail = await getAssessmentDetailAction(a.id);
                    if (detail) {
                      setPreviewModalAssessment({
                        assessment: a,
                        questions: detail.questions,
                      });
                    }
                  }}
                  onEdit={(id) => {
                    setEditingAssessmentId(id);
                    setEditorOpen(true);
                  }}
                  onDelete={async (id) => {
                    if (confirm("Are you sure you want to delete this assessment? All associated participant attempts will be removed.")) {
                      const res = await deleteAssessmentAction(id);
                      if (res.success) {
                        await loadData();
                      } else {
                        alert(res.error || "Failed to delete assessment.");
                      }
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            /* LIST VIEW (High-Density Academic Table) */
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c1e] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-gray-400">
                      <th className="py-3 px-4">Assessment Title & Category</th>
                      <th className="py-3 px-3 text-center">Duration</th>
                      <th className="py-3 px-3 text-center">Questions</th>
                      <th className="py-3 px-3 text-center">Benchmark</th>
                      <th className="py-3 px-3 text-center">Takers</th>
                      <th className="py-3 px-3 text-center">Pass Rate</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredAssessments.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 max-w-xs sm:max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-academic text-sm font-bold text-white hover:text-orange-400 transition-colors cursor-pointer" onClick={() => {
                              setEditingAssessmentId(item.id);
                              setEditorOpen(true);
                            }}>
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="rounded-md border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
                              {item.category}
                            </span>
                            <span className="text-[11px] text-gray-400 truncate">
                              {item.description}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-3 text-center font-mono font-bold text-white">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs">
                            <i className="fas fa-clock text-orange-400 text-[10px]" />
                            {item.timeLimitMinutes || 30}m
                          </span>
                        </td>

                        <td className="py-4 px-3 text-center font-mono font-bold text-white">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs">
                            <i className="fas fa-list-ol text-cyan-400 text-[10px]" />
                            {item.questionCount} Obj
                          </span>
                        </td>

                        <td className="py-4 px-3 text-center font-mono font-bold text-emerald-400">
                          {item.passingScore || 60}%
                        </td>

                        <td className="py-4 px-3 text-center font-mono">
                          <span className="text-gray-300">
                            {item.completedCount} / <strong className="text-white">{item.totalAssignments}</strong>
                          </span>
                        </td>

                        <td className="py-4 px-3 text-center font-mono">
                          {item.passRate !== null && item.passRate > 0 ? (
                            <span className="font-bold text-emerald-400">{item.passRate}%</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>

                        <td className="py-4 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-gray-500/10 text-gray-400 border border-white/10"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-emerald-400" : "bg-gray-400"}`} />
                            {item.isActive ? "Active" : "Draft"}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAssignModalAssessment(item)}
                              title="Assign to student cohort"
                              className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-400 hover:bg-orange-500 hover:text-black transition-all"
                            >
                              Assign
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const detail = await getAssessmentDetailAction(item.id);
                                if (detail) {
                                  setPreviewModalAssessment({
                                    assessment: item,
                                    questions: detail.questions,
                                  });
                                }
                              }}
                              title="Preview exam interface"
                              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                            >
                              Preview
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingAssessmentId(item.id);
                                setEditorOpen(true);
                              }}
                              title="Edit assessment & questions"
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-400 hover:text-white transition-all"
                            >
                              <i className="fas fa-pen" />
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Delete this assessment?")) {
                                  const res = await deleteAssessmentAction(item.id);
                                  if (res.success) loadData();
                                }
                              }}
                              title="Delete assessment"
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/20 transition-all"
                            >
                              <i className="fas fa-trash-alt" />
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
        </div>
      )}

      {/* TAB 2: PARTICIPANTS & SCORES LEDGER */}
      {tab === "participants" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-6 shadow-xl space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-academic text-lg font-bold text-white">
                  Student Assessment Ledger & Response Records
                </h2>
                <p className="text-xs text-gray-400">
                  Audit examination attempts, individual scores, pass/fail thresholds, and question-by-question responses.
                </p>
              </div>
            </div>

            {participants.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                No students have been assigned to assessments yet. Open the Assessments Catalog tab and click &quot;Assign&quot; on any assessment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[10px] font-mono uppercase tracking-wider text-gray-400">
                      <th className="py-3 px-3">Student / Reg Number</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Assessment Title</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Score</th>
                      <th className="py-3 px-3 text-center">Result</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {participants.map((p) => (
                      <tr key={p.attemptId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-white">{p.studentName}</div>
                          <div className="font-mono text-[10px] text-gray-400">{p.regNumber}</div>
                        </td>
                        <td className="py-3.5 px-3 text-gray-300">
                          <div>{p.department || "General"}</div>
                          <div className="text-[10px] text-gray-500">{p.level || "ND"}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-medium text-white">{p.assessmentTitle}</div>
                          <div className="text-[10px] text-gray-500">Benchmark: {p.passingScore}%</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.status === "SUBMITTED" || p.status === "REVIEWED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : p.status === "IN_PROGRESS"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono">
                          {p.score !== null ? (
                            <span className="font-bold text-white text-sm">{p.score}%</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {p.passed === true ? (
                            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              PASS
                            </span>
                          ) : p.passed === false ? (
                            <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                              FAIL
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">PENDING</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              const detail = await getStudentAttemptDetailAction(p.attemptId);
                              if (detail) {
                                setInspectData(detail as AttemptInspectorData);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:bg-white/10 hover:text-white"
                          >
                            <i className="fas fa-search text-[10px]" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ASSESSMENT EDITOR (Supports up to 300 questions) */}
      {editorOpen && (
        <AssessmentEditorModal
          assessmentId={editingAssessmentId}
          onClose={() => {
            setEditorOpen(false);
            setEditingAssessmentId(null);
          }}
          onSaved={() => {
            setEditorOpen(false);
            setEditingAssessmentId(null);
            loadData();
          }}
        />
      )}

      {/* MODAL 2: ASSIGN STUDENTS / COHORTS */}
      {assignModalAssessment && (
        <AssignModal
          assessment={assignModalAssessment}
          onClose={() => setAssignModalAssessment(null)}
          onAssigned={() => {
            setAssignModalAssessment(null);
            loadData();
          }}
        />
      )}

      {/* MODAL 3: INTERACTIVE PREVIEW */}
      {previewModalAssessment && (
        <PreviewModal
          assessment={previewModalAssessment.assessment}
          questions={previewModalAssessment.questions}
          onClose={() => setPreviewModalAssessment(null)}
        />
      )}

      {/* MODAL 4: STUDENT ATTEMPT INSPECTION */}
      {inspectData && (
        <StudentSubmissionInspectorModal
          data={inspectData}
          onClose={() => setInspectData(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: ASSESSMENT EDITOR MODAL
// ============================================================
function AssessmentEditorModal({
  assessmentId,
  onClose,
  onSaved,
}: {
  assessmentId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(Boolean(assessmentId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Diagnostic Core");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(70);
  const [isActive, setIsActive] = useState(true);

  // Configurable minimum options setting (Default 3, adjustable from 2 to 6)
  const [minOptions, setMinOptions] = useState(3);

  const createEmptyQuestion = (order = 1): ObjectiveQuestionData => ({
    questionText: "",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ],
      correctOption: "A",
      explanation: "",
      points: 1,
    },
    displayOrder: order,
  });

  // Questions state - new assessments initialize with exactly 1 empty question ready for input
  const [questions, setQuestions] = useState<ObjectiveQuestionData[]>(() =>
    assessmentId ? [] : [createEmptyQuestion(1)]
  );
  const [mode, setMode] = useState<"builder" | "bulk">("builder");
  const [bulkText, setBulkText] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    if (!assessmentId) return;
    let active = true;
    getAssessmentDetailAction(assessmentId)
      .then((data) => {
        if (active && data) {
          setTitle(data.title);
          setDescription(data.description);
          setCategory(data.category);
          setTimeLimitMinutes(data.timeLimitMinutes);
          setPassingScore(data.passingScore);
          setIsActive(data.isActive);
          setQuestions(data.questions);
          setBulkText(exportObjectiveQuestionsToText(data.questions));
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load assessment.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [assessmentId]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Assessment title is required.");
      return;
    }
    if (questions.length === 0) {
      setError("Please add at least one question.");
      return;
    }
    if (questions.length > 300) {
      setError("Maximum limit is 300 questions.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (assessmentId) {
        const res = await updateAssessmentAction(assessmentId, {
          title,
          description,
          category,
          timeLimitMinutes,
          passingScore,
          isActive,
          questions,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createAssessmentAction({
          title,
          description,
          category,
          timeLimitMinutes,
          passingScore,
          isActive,
          questions,
        });
        if (!res.success) throw new Error(res.error);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkParse = () => {
    const parsed = parseObjectiveQuestionsFromText(bulkText);
    if (!parsed.length) {
      setError("No valid questions could be parsed from text. Check format: 1. Question? A) ... B) ... Answer: B");
      return;
    }
    setQuestions(parsed);
    setMode("builder");
    setError("");
  };

  const addQuestion = () => {
    if (questions.length >= 300) {
      setError("Maximum limit of 300 questions reached.");
      return;
    }
    const nextOrder = questions.length + 1;
    // Build default choices based on current minOptions
    const defaultChoices = Array.from({ length: Math.max(3, minOptions) }, (_, i) => ({
      id: String.fromCharCode(65 + i),
      text: "",
    }));

    setQuestions((prev) => [
      ...prev,
      {
        questionText: "",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: defaultChoices,
          correctOption: "A",
          explanation: "",
          points: 1,
        },
        displayOrder: nextOrder,
      },
    ]);
    setPage(Math.floor(questions.length / PAGE_SIZE));
  };

  const updateQuestion = (index: number, updated: ObjectiveQuestionData) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((q, idx) => ({ ...q, displayOrder: idx + 1 }));
    });
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next.map((q, idx) => ({ ...q, displayOrder: idx + 1 }));
    });
  };

  const totalPages = Math.ceil(questions.length / PAGE_SIZE) || 1;
  const currentSlice = questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 md:p-8 flex justify-center items-start">
      <div className="relative my-4 sm:my-8 w-full max-w-5xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Sticky Top Header with Proportionate Space and Prominent Close Button */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 px-5 sm:px-8 py-4 sm:py-5 bg-[#090918]/95 backdrop-blur-md border-b border-white/10 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-4 shadow-md">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block truncate">
              Job Readiness Assessment Designer
            </span>
            <h2 className="font-academic text-lg sm:text-2xl font-black text-white truncate">
              {assessmentId ? "Edit Assessment" : "Create New Assessment"}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-all shadow-sm cursor-pointer"
              title="Close form"
            >
              <i className="fas fa-times text-sm text-orange-400" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            <i className="fas fa-spinner fa-spin text-lg text-orange-400 mb-2 block" />
            <span>Loading assessment details…</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Prominent Assessment Name / Title Card */}
            <div className="rounded-2xl border-2 border-orange-500/40 bg-orange-500/[0.05] p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                  <i className="fas fa-file-signature text-orange-400 text-sm" />
                  <span>Assessment Name / Title <span className="text-red-400">*</span></span>
                </label>
                <span className="text-[10px] sm:text-xs font-mono text-orange-400 uppercase tracking-wider font-semibold">
                  Required Field
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter Assessment Name (e.g. Job Readiness Diagnostic Assessment)"
                className="w-full rounded-xl border border-white/20 bg-[#0c0c1e] px-4 py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 focus:outline-none font-bold transition-all shadow-xs"
                autoFocus={!assessmentId}
              />
              <p className="text-[11px] text-gray-400">
                This title appears across the student testing engine, score ledgers, and certification records.
              </p>
            </div>

            {/* Basic Info Matrix: Category, Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold text-gray-300">Curriculum Category:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c1e] px-3.5 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="Diagnostic Core">Diagnostic Core</option>
                  <option value="Technical Skills">Technical Skills</option>
                  <option value="Resume & ATS">Resume & ATS</option>
                  <option value="Interview Mastery">Interview Mastery</option>
                  <option value="Workplace Ethics">Workplace Ethics</option>
                  <option value="Capstone Assessment">Capstone Assessment</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-300">Description / Student Instructions:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the assessment objectives and instructions for students…"
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c1e] p-3 text-xs text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Duration Selector Component */}
              <div className="rounded-xl border border-white/5 bg-[#0c0c1e] p-3 sm:col-span-2">
                <DurationSelector
                  value={timeLimitMinutes}
                  onChange={setTimeLimitMinutes}
                  disabled={saving}
                />
              </div>

              {/* Passing Score Benchmark */}
              <div className="rounded-xl border border-white/5 bg-[#0c0c1e] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <i className="fas fa-bullseye text-emerald-400 text-xs" />
                    <span>Passing Score:</span>
                  </label>
                  <span className="font-mono text-xs font-bold text-emerald-400">{passingScore}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[50, 60, 70, 75, 80].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setPassingScore(score)}
                      className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all ${
                        passingScore === score
                          ? "bg-emerald-500 text-black shadow-md"
                          : "border border-white/10 bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {score}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Options Configuration per Assessment */}
              <div className="rounded-xl border border-white/5 bg-[#0c0c1e] p-3 space-y-2 sm:col-span-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <i className="fas fa-sliders-h text-orange-400 text-xs" />
                      <span>Customizable Options: Minimum Options per Question</span>
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Configures the required minimum options for each question (default 3). Questions allow dynamic option creation up to 8 choices.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 4, 5].map((optNum) => (
                      <button
                        key={optNum}
                        type="button"
                        onClick={() => setMinOptions(optNum)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                          minOptions === optNum
                            ? "bg-orange-500 text-[#090915] shadow-md ring-1 ring-orange-400"
                            : "border border-white/10 bg-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {optNum} {optNum === 3 ? "(Default)" : "Min"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Management Tabs */}
            <div className="space-y-4 border-t border-white/[0.08] pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("builder")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      mode === "builder" ? "bg-orange-500 text-[#090915]" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Interactive Question Builder ({questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkText(exportObjectiveQuestionsToText(questions));
                      setMode("bulk");
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      mode === "bulk" ? "bg-orange-500 text-[#090915]" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Bulk Text Import / Export
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-400">
                    {questions.length} / 300 Questions
                  </span>
                  {mode === "builder" && (
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-black transition-all"
                    >
                      <i className="fas fa-plus text-[10px]" />
                      <span>Add Question</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BUILDER MODE */}
              {mode === "builder" && (
                <div className="space-y-4">
                  {/* Pagination if > 25 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0c0c1e] p-2.5">
                      <span className="text-xs text-gray-400">
                        Page {page + 1} of {totalPages} (Items {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, questions.length)})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={page === 0}
                          onClick={() => setPage((p) => p - 1)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 disabled:opacity-30"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={page >= totalPages - 1}
                          onClick={() => setPage((p) => p + 1)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 disabled:opacity-30"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Modular QuestionBuilderItem List */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {currentSlice.map((q, sIdx) => {
                      const globalIdx = page * PAGE_SIZE + sIdx;
                      return (
                        <QuestionBuilderItem
                          key={globalIdx}
                          index={globalIdx + 1}
                          question={q}
                          minOptions={minOptions}
                          canDelete={questions.length > 1}
                          onChange={(updated) => updateQuestion(globalIdx, updated)}
                          onDelete={() => removeQuestion(globalIdx)}
                          onMoveUp={globalIdx > 0 ? () => moveQuestion(globalIdx, -1) : undefined}
                          onMoveDown={globalIdx < questions.length - 1 ? () => moveQuestion(globalIdx, 1) : undefined}
                          isFirst={globalIdx === 0}
                          isLast={globalIdx === questions.length - 1}
                        />
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full rounded-2xl border border-dashed border-white/20 bg-white/[0.02] py-3 text-xs font-bold text-gray-400 hover:border-orange-500/40 hover:text-orange-400 transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-plus text-xs" />
                    <span>Add Another Objective Question ({questions.length + 1} of 300)</span>
                  </button>
                </div>
              )}

              {/* BULK TEXT MODE */}
              {mode === "bulk" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-[#0c0c1e] p-3 text-xs text-gray-300 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <i className="fas fa-info-circle text-orange-400" />
                      <span>Supported Bulk Format:</span>
                    </div>
                    <pre className="font-mono text-[11px] text-gray-400 leading-relaxed overflow-x-auto">
{`1. Which NACE competency focuses on gathering diverse info?
A) Critical Thinking
B) Communication
C) Technology
D) Leadership
Answer: A
Explanation: Critical Thinking involves objective analysis.`}
                    </pre>
                  </div>

                  <textarea
                    rows={12}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Paste up to 300 numbered questions here..."
                    className="w-full rounded-2xl border border-white/10 bg-[#070714] p-4 font-mono text-xs text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleBulkParse}
                      className={orangeButton}
                    >
                      <i className="fas fa-check" />
                      <span>Parse & Load into Builder</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-white/20 text-orange-500 focus:ring-0"
                />
                <span>Active & available for cohort assignments</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={secondaryButton}
                >
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
                      <i className="fas fa-save" />
                      <span>Save Assessment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: ASSIGN TO STUDENTS MODAL
// ============================================================
function AssignModal({
  assessment,
  onClose,
  onAssigned,
}: {
  assessment: AssessmentSummary;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const searchStudents = async () => {
    setSearching(true);
    setError("");
    try {
      const res = await searchStudentsForAssessmentAction(assessment.id, search, department);
      setStudents(res as StudentSearchResult[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to search students.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    let active = true;
    searchStudentsForAssessmentAction(assessment.id, "", department)
      .then((res) => {
        if (active) setStudents(res as StudentSearchResult[]);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load students.");
      });
    return () => {
      active = false;
    };
  }, [department, assessment.id]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllUnassigned = () => {
    const unassigned = students.filter((s) => !s.isAssigned).map((s) => s.id);
    setSelectedIds(new Set(unassigned));
  };

  const handleAssign = async () => {
    if (!selectedIds.size) {
      setError("Please select at least one student.");
      return;
    }
    setAssigning(true);
    setError("");
    try {
      const res = await assignAssessmentToStudentsAction(assessment.id, Array.from(selectedIds));
      if (!res.success) throw new Error(res.error);
      setSuccessMsg(`Successfully assigned assessment to ${res.count} student(s)!`);
      setTimeout(() => {
        onAssigned();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign assessment.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block truncate">
              Student Assignment Hub
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl truncate">
              Assign Assessment
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              Target: <strong className="text-white">{assessment.title}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <i className="fas fa-times text-orange-400" />
            <span>Close</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchStudents()}
              placeholder="Search by student name or matric number…"
              className="w-full rounded-xl border border-white/10 bg-[#0c0c1e] pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-xs text-gray-500" />
          </div>

          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0c0c1e] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Software Engineering">Computer Software Eng</option>
              <option value="Networking & System Security">Networking & Security</option>
              <option value="Electrical & Electronics Engineering">Electrical & Electronics</option>
              <option value="Banking Operations">Banking Operations</option>
              <option value="Accountancy">Accountancy</option>
            </select>
          </div>
        </div>

        {/* Students Ledger Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Found {students.length} student(s) · {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={selectAllUnassigned}
              className="text-orange-400 hover:underline font-semibold"
            >
              Select All Unassigned
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto rounded-xl border border-white/10 bg-[#070714] p-2 divide-y divide-white/[0.04]">
            {searching ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <i className="fas fa-spinner fa-spin mr-2" /> Searching students…
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No matching enrolled students found.
              </div>
            ) : (
              students.map((s) => (
                <div
                  key={s.id}
                  onClick={() => !s.isAssigned && toggleSelect(s.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer ${
                    s.isAssigned
                      ? "opacity-50 cursor-not-allowed bg-transparent"
                      : selectedIds.has(s.id)
                      ? "bg-orange-500/10 border border-orange-500/30"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={s.isAssigned}
                      checked={selectedIds.has(s.id) || s.isAssigned}
                      onChange={() => toggleSelect(s.id)}
                      className="rounded border-white/20 text-orange-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">{s.fullName}</div>
                      <div className="text-[10px] font-mono text-gray-400">
                        {s.regNumber} · {s.department || "General"}
                      </div>
                    </div>
                  </div>

                  <div>
                    {s.isAssigned ? (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Already Assigned
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500">Ready</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            disabled={assigning || selectedIds.size === 0}
            onClick={handleAssign}
            className={orangeButton}
          >
            {assigning ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                <span>Assigning…</span>
              </>
            ) : (
              <>
                <i className="fas fa-user-check" />
                <span>Assign to {selectedIds.size} Student(s)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: INTERACTIVE PREVIEW MODAL
// ============================================================
function PreviewModal({
  assessment,
  questions,
  onClose,
}: {
  assessment: AssessmentSummary;
  questions: ObjectiveQuestionData[];
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showKey, setShowKey] = useState(false);

  const currentQ = questions[currentIdx];
  const total = questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold">
                Interactive Examination Preview
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">
                Staff Review Mode
              </span>
            </div>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl truncate">
              {assessment.title}
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-1 flex-wrap">
              <span>{total} Objective Items</span>
              <span>·</span>
              <span>{assessment.timeLimitMinutes} Minutes</span>
              <span>·</span>
              <span>Pass Benchmark: {assessment.passingScore}%</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <i className="fas fa-times text-orange-400" />
            <span>Close</span>
          </button>
        </div>

        {total === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            This assessment currently has no questions configured.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Question Progress Bar */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-mono text-orange-400 font-bold">
                Question {currentIdx + 1} of {total}
              </span>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-orange-400 hover:underline font-semibold flex items-center gap-1"
              >
                <i className={`fas ${showKey ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                <span>{showKey ? "Hide Answer Key & Explanation" : "Reveal Answer Key"}</span>
              </button>
            </div>

            {/* Question Stem */}
            <div className="rounded-2xl border border-white/10 bg-[#0c0c1e] p-6 space-y-4">
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {currentQ.questionText}
              </p>

              {/* Choices */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options?.choices.map((c) => {
                  const selected = selectedAnswers[currentIdx] === c.id;
                  const isCorrect = currentQ.options?.correctOption === c.id;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [currentIdx]: c.id,
                        }))
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs transition-all ${
                        showKey && isCorrect
                          ? "border-emerald-500 bg-emerald-500/15 text-white font-semibold ring-1 ring-emerald-500/50"
                          : selected
                          ? "border-orange-500 bg-orange-500/10 text-white"
                          : "border-white/10 bg-[#070714] text-gray-300 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                          showKey && isCorrect
                            ? "bg-emerald-500 text-black font-extrabold"
                            : selected
                            ? "bg-orange-500 text-[#090915]"
                            : "bg-white/10 text-gray-400"
                        }`}
                      >
                        {c.id}
                      </span>
                      <span className="flex-1">{c.text}</span>
                      {showKey && isCorrect && (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          Correct Answer
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Educational Explanation Box (when revealed) */}
              {showKey && currentQ.options?.explanation && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <i className="fas fa-lightbulb text-xs" />
                    <span>Post-Assessment Rationale:</span>
                  </div>
                  <p className="mt-1 text-gray-300 leading-relaxed">
                    {currentQ.options.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => i - 1)}
                className={secondaryButton}
              >
                <i className="fas fa-arrow-left" />
                <span>Previous</span>
              </button>

              {/* Quick Jump Palette */}
              <div className="flex max-w-[200px] sm:max-w-xs flex-wrap justify-center gap-1">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIdx(i)}
                    className={`h-6 w-6 rounded text-[10px] font-mono font-bold transition-all ${
                      i === currentIdx
                        ? "bg-orange-500 text-[#090915] ring-2 ring-orange-400/50"
                        : selectedAnswers[i]
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-gray-500 hover:text-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentIdx === total - 1}
                onClick={() => setCurrentIdx((i) => i + 1)}
                className={orangeButton}
              >
                <span>Next</span>
                <i className="fas fa-arrow-right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: STUDENT SUBMISSION INSPECTOR MODAL
// ============================================================
function StudentSubmissionInspectorModal({
  data,
  onClose,
}: {
  data: AttemptInspectorData;
  onClose: () => void;
}) {
  const { attempt, questions } = data;
  const isPassed = attempt.score !== null && attempt.score >= attempt.passingScore;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 sm:p-6 md:p-8 backdrop-blur-md">
      <div className="relative my-4 sm:my-8 w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090918] p-5 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block truncate">
              Student Response Inspector
            </span>
            <h2 className="font-academic text-xl font-bold text-white sm:text-2xl truncate">
              {attempt.studentName} ({attempt.regNumber})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              Assessment: <strong className="text-white">{attempt.assessmentTitle}</strong> · {attempt.department}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <i className="fas fa-times text-orange-400" />
            <span>Close</span>
          </button>
        </div>

        {/* Score Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0d0d21] p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${
                isPassed
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/15 border border-red-500/30 text-red-400"
              }`}
            >
              {attempt.score !== null ? `${attempt.score}%` : "—"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Final Evaluated Result</span>
                {isPassed ? (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    PASSED
                  </span>
                ) : (
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    FAILED
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Passing Benchmark: {attempt.passingScore}% · Status: {attempt.status}
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-gray-400 font-mono">
            <div>
              Completed:{" "}
              {attempt.completedAt
                ? new Date(attempt.completedAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })
                : "Incomplete"}
            </div>
          </div>
        </div>

        {/* Question-by-Question Response Breakdown */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          <div className="text-xs font-mono uppercase text-gray-400 font-bold">
            Question-by-Question Breakdown ({questions.length} Items)
          </div>

          {questions.map((q) => (
            <div
              key={q.questionId}
              className={`rounded-2xl border p-4 space-y-3 ${
                q.isCorrect
                  ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                  : "border-red-500/30 bg-red-500/[0.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold ${
                      q.isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    Q{q.displayOrder}
                  </span>
                  <span className="text-xs font-bold text-white leading-snug">
                    {q.questionText}
                  </span>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold font-mono ${
                    q.isCorrect
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}
                >
                  {q.isCorrect ? "CORRECT (1/1)" : "INCORRECT (0/1)"}
                </span>
              </div>

              {/* Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                {q.choices.map((c) => {
                  const wasChosen = q.chosenOption === c.id;
                  const isTheCorrect = q.correctOption === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                        isTheCorrect
                          ? "border-emerald-500/50 bg-emerald-500/15 text-white font-semibold"
                          : wasChosen && !q.isCorrect
                          ? "border-red-500/50 bg-red-500/15 text-white font-semibold"
                          : "border-white/5 bg-white/[0.01] text-gray-400"
                      }`}
                    >
                      <span className="font-mono font-bold text-[11px]">{c.id})</span>
                      <span className="flex-1 text-[11px] leading-tight">{c.text}</span>
                      {wasChosen && (
                        <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] font-mono text-white">
                          Chosen
                        </span>
                      )}
                      {isTheCorrect && (
                        <span className="rounded bg-emerald-500/30 px-1 py-0.2 text-[9px] font-mono text-emerald-300 font-bold">
                          Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation note */}
              {q.explanation && (
                <div className="ml-7 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[11px] text-gray-400">
                  <strong className="text-gray-300">Explanation: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-white/[0.08] pt-4">
          <button type="button" onClick={onClose} className={orangeButton}>
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
