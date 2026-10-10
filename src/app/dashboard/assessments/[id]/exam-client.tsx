"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startAssessmentAttemptAction,
  submitAssessmentAttemptAction,
} from "@/actions/assessments";

interface ExamAssessmentData {
  id: string;
  title: string;
  category: string;
  description: string;
  timeLimitMinutes: number;
  passingScore: number;
}

interface ExamQuestionItem {
  id: string;
  displayOrder: number;
  questionText: string;
  choices: Array<{ id: string; text: string }>;
}

export function AssessmentExamClient({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [assessment, setAssessment] = useState<ExamAssessmentData | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setConfirmSubmitOpen(false);
    setError("");

    try {
      const res = await submitAssessmentAttemptAction(attemptId, answersRef.current);
      if (!res.success) throw new Error(res.error);
      // Refresh page to transition to completed results view
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment.");
      setSubmitting(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    startAssessmentAttemptAction(attemptId)
      .then((res) => {
        if (!res.success) {
          setError(res.error || "Failed to start assessment.");
        } else {
          setAssessment(res.assessment as ExamAssessmentData);
          setQuestions((res.questions || []) as ExamQuestionItem[]);
          setTimeLeft((res.assessment?.timeLimitMinutes || 30) * 60);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load exam."))
      .finally(() => setLoading(false));
  }, [attemptId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitting, handleSubmit]);

  const selectChoice = (questionId: string, choiceId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070714] text-white">
        <div className="text-center space-y-3">
          <i className="fas fa-spinner fa-spin text-2xl text-orange-400" />
          <p className="text-xs text-gray-400">Initializing examination environment…</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070714] p-4 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-[#0d0d21] p-6 text-center space-y-4">
          <i className="fas fa-exclamation-triangle text-2xl text-red-400" />
          <h2 className="text-base font-bold text-white">Assessment Error</h2>
          <p className="text-xs text-red-300">{error || "Assessment not found."}</p>
          <Link
            href="/dashboard/assessments"
            className="inline-flex rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
          >
            Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Format time remaining
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-8 text-white selection:bg-[#FF7F24]/30">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Exam Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                {assessment.category}
              </span>
              <span className="text-xs text-gray-500 font-mono">Passing Mark: {assessment.passingScore}%</span>
            </div>
            <h1 className="font-academic mt-1 text-lg font-bold text-white sm:text-xl">
              {assessment.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-mono text-gray-400 block">Answered</span>
              <span className="text-xs font-bold text-white font-mono">
                {answeredCount} / {totalQuestions}
              </span>
            </div>

            <div
              className={`rounded-xl border px-3 py-1.5 text-center ${
                minutes < 5
                  ? "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse"
                  : "border-orange-500/30 bg-orange-500/10 text-orange-400"
              }`}
            >
              <span className="text-[10px] uppercase font-mono block">Time Left</span>
              <span className="text-xs font-mono font-bold">{formattedTime}</span>
            </div>

            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-xs font-extrabold text-[#090915] shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              Submit Exam
            </button>
          </div>
        </header>

        {/* Question Palette / Number Strip */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c1e]/60 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 font-mono">
            <span>QUESTION PALETTE (JUMP TO ITEM)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/20" /> Remaining
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-7 w-7 rounded-lg text-xs font-mono font-bold transition-all ${
                    isCurrent
                      ? "bg-orange-500 text-[#090915] ring-2 ring-orange-400 scale-105"
                      : isAnswered
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {q.displayOrder}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question View */}
        {currentQ && (
          <div className="rounded-3xl border border-white/[0.08] bg-[#0d0d24] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between text-xs text-gray-400 border-b border-white/[0.06] pb-4">
              <span className="font-mono text-orange-400 font-bold">
                Question {currentQ.displayOrder} of {totalQuestions}
              </span>
              <span className="font-mono">1 Point</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.questionText}
            </h2>

            {/* Options selection */}
            <div className="space-y-3 pt-2">
              {currentQ.choices.map((c) => {
                const selected = answers[currentQ.id] === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectChoice(currentQ.id, c.id)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? "border-orange-500 bg-orange-500/10 text-white shadow-lg shadow-orange-500/10"
                        : "border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold font-mono transition-all ${
                        selected
                          ? "bg-orange-500 text-[#090915] shadow-md shadow-orange-500/30"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {c.id}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-relaxed">
                      {c.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-6">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:text-white disabled:opacity-40"
              >
                <span>← Previous</span>
              </button>

              <div className="flex items-center gap-3">
                {currentIdx < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((p) => Math.min(totalQuestions - 1, p + 1))}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                  >
                    <span>Next Question →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-2.5 text-xs font-extrabold text-[#090915] shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
                  >
                    <span>Review & Finalize Submission</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal before Submit */}
        {confirmSubmitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0c20] p-6 text-center space-y-4 shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-2xl">
                <i className="fas fa-question-circle" />
              </div>
              <h3 className="font-academic text-xl font-bold text-white">
                Submit Your Examination?
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                You have answered <strong className="text-white">{answeredCount}</strong> of{" "}
                <strong className="text-white">{totalQuestions}</strong> questions.
                {unansweredCount > 0 && (
                  <span className="block mt-1 text-amber-400 font-semibold">
                    Warning: You still have {unansweredCount} unanswered question(s).
                  </span>
                )}
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmSubmitOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white"
                >
                  Continue Reviewing
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-2 text-xs font-extrabold text-[#090915] shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
                >
                  {submitting ? "Submitting & Grading…" : "Yes, Submit Exam"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
