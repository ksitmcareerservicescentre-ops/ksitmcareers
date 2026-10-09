"use client";

import { useState } from "react";
import { validateAnswers, type ModuleContent } from "@/lib/modules";

export const moduleInput =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#070714]/90 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 shadow-inner transition-all duration-150 focus:border-[#FF7F24] focus:bg-[#090918] focus:outline-none focus:ring-2 focus:ring-[#FF7F24]/20";
export const moduleButton =
  "rounded-xl bg-gradient-to-r from-[#FF7F24] via-[#ff9042] to-[#FF7F24] px-5 py-2.5 text-sm font-bold text-[#090915] shadow-[0_2px_14px_rgba(255,127,36,0.28)] hover:shadow-[0_4px_22px_rgba(255,127,36,0.45)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
export const modulePanel =
  "rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111126] to-[#0b0b1c] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.35)] backdrop-blur-xl";

export function ModuleForm({
  content,
  answers,
  onChange,
  disabled = false,
}: {
  content: ModuleContent;
  answers: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      <p className="whitespace-pre-wrap rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm leading-relaxed text-gray-300 backdrop-blur-sm">
        {content.instructions}
      </p>
      {content.resources.length > 0 && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Academic & Industry Resources
            </span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-300">
              {content.resources.length}
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {content.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0A0A1A]/70 px-3.5 py-2.5 text-xs text-gray-200 transition-all duration-200 hover:border-orange-500/40 hover:bg-[#0A0A1A] hover:text-white hover:shadow-[0_0_15px_rgba(255,127,36,0.12)]"
              >
                <span className="truncate pr-2 font-medium">
                  {resource.title}
                </span>
                <span
                  className="text-orange-400 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <fieldset disabled={disabled} className="space-y-4">
        {content.questions.map((q) => (
          <div
            key={q.id}
            className="rounded-xl border border-white/[0.06] bg-[#0c0c1e]/70 p-4 transition-all duration-150 hover:border-white/[0.12] hover:bg-[#0c0c1e]/90"
          >
            <label className="block text-sm font-medium leading-relaxed text-gray-200">
              <span className="flex items-start justify-between gap-3">
                <span className="font-semibold text-gray-100">{q.prompt}</span>
                {q.required ? (
                  <span className="shrink-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-400">
                    (required)
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-400">
                    Optional
                  </span>
                )}
              </span>
              {q.type === "SCALE_1_5" && (
                <span className="mt-1.5 block text-xs font-normal text-gray-400">
                  Proficiency scale: 1 (Beginning / Low) → 3 (Competent) → 5 (Advanced / Highly Confident)
                </span>
              )}
              {q.type === "TEXT" ? (
                <textarea
                  className={`${moduleInput} min-h-24`}
                  value={answers[q.id] || ""}
                  maxLength={10000}
                  onChange={(e) =>
                    onChange({ ...answers, [q.id]: e.target.value })
                  }
                />
              ) : (
                <select
                  className={moduleInput}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    onChange({ ...answers, [q.id]: e.target.value })
                  }
                >
                  <option value="">Choose an answer</option>
                  {(q.type === "SCALE_1_5"
                    ? ["1", "2", "3", "4", "5"]
                    : q.options || []
                  ).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </div>
        ))}
      </fieldset>
    </div>
  );
}

export function ModulePreview({
  title,
  content,
}: {
  title: string;
  content: ModuleContent;
}) {
  const [stage, setStage] = useState("assigned");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  return (
    <section className={`${modulePanel} min-w-0`} aria-label="Student preview">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Student preview
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">{title}</h2>
        </div>
        <button
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          onClick={() => {
            setStage("assigned");
            setAnswers({});
            setMessage("");
          }}
        >
          Reset preview
        </button>
      </div>
      <p className="mb-5 text-xs text-gray-400">
        Try the student workflow. Preview answers and progress are not saved.
      </p>
      {stage === "assigned" ? (
        <>
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Assigned · Not started
          </div>
          <div>
            <button className={moduleButton} onClick={() => setStage("started")}>
              Start module
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            {stage === "completed" ? "Completed" : "In progress"}
          </div>
          <ModuleForm
            content={content}
            answers={answers}
            onChange={setAnswers}
            disabled={stage === "completed"}
          />
          {stage !== "completed" && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className={moduleButton}
                onClick={() =>
                  setMessage("Preview progress saved for this session only.")
                }
              >
                Save progress
              </button>
              <button
                className={moduleButton}
                onClick={() => {
                  try {
                    validateAnswers(content, answers, true);
                    setStage("completed");
                    setMessage(
                      "Preview completed. No student record was changed.",
                    );
                  } catch (error) {
                    setMessage((error as Error).message);
                  }
                }}
              >
                Complete module
              </button>
            </div>
          )}
        </>
      )}
      {message && (
        <p role="status" className="mt-4 rounded-xl border border-orange-400/30 bg-orange-400/10 p-3 text-sm text-orange-200">
          {message}
        </p>
      )}
    </section>
  );
}
