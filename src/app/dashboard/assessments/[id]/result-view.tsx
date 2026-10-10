import Link from "next/link";

export interface QuestionResultItem {
  questionId: string;
  displayOrder: number;
  questionText: string;
  choices: Array<{ id: string; text: string }>;
  chosenOption: string | null;
  correctOption?: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface AttemptResultDetail {
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
  questions: QuestionResultItem[];
}

export function AssessmentResultView({ details }: { details: AttemptResultDetail }) {
  const { attempt, questions } = details;
  const isPassed = attempt.score !== null && attempt.score >= attempt.passingScore;
  const totalQuestions = questions.length;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-12 text-white selection:bg-[#FF7F24]/30">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/dashboard/assessments"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:border-orange-500/30 hover:bg-white/10 hover:text-white"
        >
          <span>←</span> Back to My Assessments
        </Link>

        {/* Score Banner */}
        <section
          className={`relative overflow-hidden rounded-3xl border p-8 sm:p-10 text-center shadow-2xl ${
            isPassed
              ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 via-[#0a0a1e] to-[#0c0c20]"
              : "border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-[#0a0a1e] to-[#0c0c20]"
          }`}
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 border border-white/10 shadow-inner">
            <span
              className={`text-3xl sm:text-4xl font-black font-mono ${
                isPassed ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {attempt.score !== null ? `${attempt.score}%` : "—"}
            </span>
          </div>

          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold font-mono uppercase tracking-wider mb-2">
              {isPassed ? (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-emerald-400">
                  <i className="fas fa-check-circle mr-1.5" /> PASSED INSTITUTIONAL BENCHMARK
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-amber-400">
                  <i className="fas fa-info-circle mr-1.5" /> ASSESSMENT COMPLETED (NEEDS IMPROVEMENT)
                </span>
              )}
            </div>

            <h1 className="font-academic text-2xl sm:text-3xl font-black text-white">
              {attempt.assessmentTitle}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-300">
              Exam submitted by {attempt.studentName} ({attempt.regNumber})
            </p>
          </div>

          {/* Metrics Matrix */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto border-t border-white/10 pt-6 text-center">
            <div className="rounded-2xl bg-white/[0.03] p-3 border border-white/5">
              <span className="text-[10px] uppercase font-mono text-gray-400 block">Passing Mark</span>
              <span className="text-base font-bold text-white font-mono">{attempt.passingScore}%</span>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-3 border border-white/5">
              <span className="text-[10px] uppercase font-mono text-gray-400 block">Total Items</span>
              <span className="text-base font-bold text-white font-mono">{totalQuestions} Obj</span>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-3 border border-white/5">
              <span className="text-[10px] uppercase font-mono text-gray-400 block">Correct</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{correctCount}</span>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-3 border border-white/5">
              <span className="text-[10px] uppercase font-mono text-gray-400 block">Incorrect</span>
              <span className="text-base font-bold text-red-400 font-mono">{incorrectCount}</span>
            </div>
          </div>
        </section>

        {/* Question-by-Question Review */}
        <section className="space-y-4">
          <div className="border-b border-white/[0.08] pb-3">
            <h2 className="font-academic text-xl font-bold text-white">
              Comprehensive Examination Review
            </h2>
            <p className="text-xs text-gray-400">
              Review your answers alongside official KSITM answer keys and competency rationales.
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.questionId}
                className={`rounded-2xl border p-5 space-y-4 transition-all ${
                  q.isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                    : "border-red-500/30 bg-red-500/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        q.isCorrect
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {q.displayOrder}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-relaxed">
                      {q.questionText}
                    </h3>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                      q.isCorrect
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {q.isCorrect ? "CORRECT" : "INCORRECT"}
                  </span>
                </div>

                {/* Choices list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                  {q.choices.map((c) => {
                    const wasChosen = q.chosenOption === c.id;
                    const isTheCorrect = q.correctOption === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs transition-all ${
                          isTheCorrect
                            ? "border-emerald-500/50 bg-emerald-500/15 text-white font-semibold"
                            : wasChosen && !q.isCorrect
                            ? "border-red-500/50 bg-red-500/15 text-white font-semibold"
                            : "border-white/5 bg-white/[0.01] text-gray-400"
                        }`}
                      >
                        <span className="font-mono font-bold text-xs">{c.id})</span>
                        <span className="flex-1 leading-snug">{c.text}</span>
                        {wasChosen && (
                          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-mono text-white">
                            Your Choice
                          </span>
                        )}
                        {isTheCorrect && (
                          <span className="rounded bg-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300 font-bold">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-300 pl-9 leading-relaxed">
                    <strong className="text-orange-400">Educational Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-center border-t border-white/[0.08] pt-6">
          <Link
            href="/dashboard/assessments"
            className="rounded-xl bg-white/10 px-6 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
          >
            ← Return to Assessments List
          </Link>
        </div>
      </div>
    </main>
  );
}
