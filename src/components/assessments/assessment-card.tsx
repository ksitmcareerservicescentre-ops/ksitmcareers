"use client";

import { AssessmentSummary } from "@/lib/assessments";

interface AssessmentCardProps {
  assessment: AssessmentSummary;
  onEdit: (id: string) => void;
  onAssign: (assessment: AssessmentSummary) => void;
  onPreview: (assessment: AssessmentSummary) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function AssessmentCard({
  assessment,
  onEdit,
  onAssign,
  onPreview,
  onDelete,
  deleting = false,
}: AssessmentCardProps) {
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0c1e]/90 p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-orange-500/10 hover:shadow-2xl">
      {/* Top Banner & Status */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
            <i className="fas fa-certificate text-[9px]" />
            {assessment.category || "Diagnostic Assessment"}
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              assessment.isActive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                assessment.isActive ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
              }`}
            />
            {assessment.isActive ? "Active" : "Archived"}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-academic text-lg font-black text-white transition-colors group-hover:text-orange-400">
            {assessment.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-gray-400 leading-relaxed">
            {assessment.description || "Comprehensive job readiness diagnostic assessment."}
          </p>
        </div>

        {/* Metadata Pills: Duration, Questions, Pass Mark */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center justify-center gap-1">
              <i className="fas fa-clock text-orange-400 text-[10px]" />
              <span>Duration</span>
            </span>
            <span className="font-mono text-xs font-bold text-white mt-0.5">
              {assessment.timeLimitMinutes || 30} mins
            </span>
          </div>

          <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center justify-center gap-1">
              <i className="fas fa-list-ol text-cyan-400 text-[10px]" />
              <span>Questions</span>
            </span>
            <span className="font-mono text-xs font-bold text-white mt-0.5">
              {assessment.questionCount} Obj
            </span>
          </div>

          <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center justify-center gap-1">
              <i className="fas fa-bullseye text-emerald-400 text-[10px]" />
              <span>Pass Score</span>
            </span>
            <span className="font-mono text-xs font-bold text-white mt-0.5">
              {assessment.passingScore || 60}%
            </span>
          </div>
        </div>

        {/* Participation Metric Strip */}
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#080816] px-3 py-2 text-xs">
          <span className="text-gray-400 flex items-center gap-1.5">
            <i className="fas fa-user-graduate text-purple-400 text-xs" />
            <span>Assigned Takers:</span>
            <strong className="text-white font-mono">{assessment.totalAssignments}</strong>
          </span>

          <span className="text-gray-400 flex items-center gap-1.5">
            <i className="fas fa-chart-line text-emerald-400 text-xs" />
            <span>Pass Rate:</span>
            <strong className="text-emerald-400 font-mono">
              {assessment.passRate !== null && assessment.passRate > 0 ? `${assessment.passRate}%` : "—"}
            </strong>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
        <button
          type="button"
          onClick={() => onAssign(assessment)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 px-3 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-black transition-all"
        >
          <i className="fas fa-user-plus text-[10px]" />
          <span>Assign</span>
        </button>

        <button
          type="button"
          onClick={() => onPreview(assessment)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <i className="fas fa-eye text-[10px]" />
          <span>Preview</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(assessment.id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <i className="fas fa-pen text-[10px]" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(assessment.id)}
          aria-label="Delete assessment"
          className="inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all"
        >
          <i className="fas fa-trash-alt" />
        </button>
      </div>
    </div>
  );
}
