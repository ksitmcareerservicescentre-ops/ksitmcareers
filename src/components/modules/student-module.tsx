"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { moduleAssignments } from "@/db/schema";
import { updateStudentModuleAction } from "@/lib/modules-client";
import { statusLabels } from "@/lib/modules";
import { ModuleForm, moduleButton, modulePanel } from "./module-form";

export function StudentModule({
  initial,
}: {
  initial: typeof moduleAssignments.$inferSelect;
}) {
  const [record, setRecord] = useState(initial);
  const [answers, setAnswers] = useState(initial.answers);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const update = (intent: "start" | "save" | "complete") =>
    startTransition(async () => {
      setMessage("");
      try {
        const next = await updateStudentModuleAction(
          record.id,
          record.version,
          intent,
          answers,
        );
        setRecord(next);
        setAnswers(next.answers);
        setMessage(
          intent === "complete"
            ? "Module completed. Your record has been saved."
            : intent === "save"
              ? "Progress saved."
              : "Module started.",
        );
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to save. Please try again.",
        );
      }
    });
  const statusTheme =
    record.status === "COMPLETED"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : record.status === "IN_PROGRESS"
        ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
        : "border-blue-500/30 bg-blue-500/10 text-blue-400";

  return (
    <section className={`${modulePanel} space-y-6`}>
      <div className="border-b border-white/[0.08] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTheme}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                record.status === "COMPLETED"
                  ? "bg-emerald-400"
                  : record.status === "IN_PROGRESS"
                    ? "bg-orange-400 animate-pulse"
                    : "bg-blue-400"
              }`}
            />
            {statusLabels[record.status]}
          </div>
          <span className="text-xs text-gray-400">
            Version {record.moduleVersion}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
          {record.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
            <span className="text-gray-500">Started:</span>
            <span className="font-medium text-gray-200">
              {record.startedAt
                ? new Date(record.startedAt).toLocaleString()
                : "Not started"}
            </span>
          </span>
          {record.completedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-emerald-300">
              <span className="text-emerald-500/80">Completed:</span>
              <span className="font-medium">
                {new Date(record.completedAt).toLocaleString()}
              </span>
            </span>
          )}
        </div>
      </div>
      {record.note && (
        <div className="rounded-xl border border-orange-500/25 bg-orange-500/[0.07] p-4 text-sm text-orange-200 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Adviser Note
          </p>
          <p className="mt-1 whitespace-pre-wrap leading-relaxed text-orange-100/90">
            {record.note}
          </p>
        </div>
      )}
      {record.status === "ASSIGNED" ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="text-sm leading-relaxed text-gray-300">
            This module is assigned and ready. You can begin whenever you are prepared, save your progress at any time, and return later.
          </p>
          <div className="mt-5">
            <button
              disabled={pending}
              className={moduleButton}
              onClick={() => update("start")}
            >
              {pending ? "Starting…" : "Start module"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <ModuleForm
            content={record.content}
            answers={answers}
            onChange={setAnswers}
            disabled={pending || record.status === "COMPLETED"}
          />
          {record.status !== "COMPLETED" && (
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                disabled={pending}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-all duration-150 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => update("save")}
              >
                {pending ? "Saving…" : "Save progress"}
              </button>
              <button
                disabled={pending}
                className={moduleButton}
                onClick={() => update("complete")}
              >
                {pending ? "Submitting…" : "Complete module"}
              </button>
            </div>
          )}
        </>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl border border-orange-400/30 bg-orange-400/10 p-3.5 text-sm text-orange-200 backdrop-blur-sm"
        >
          {message}
        </p>
      )}
    </section>
  );
}
