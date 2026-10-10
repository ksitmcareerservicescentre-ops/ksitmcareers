"use client";

import { ObjectiveQuestionData } from "@/lib/assessments";

interface QuestionBuilderItemProps {
  index: number;
  question: ObjectiveQuestionData;
  minOptions: number;
  canDelete: boolean;
  onChange: (updated: ObjectiveQuestionData) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function QuestionBuilderItem({
  index,
  question,
  minOptions,
  canDelete,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}: QuestionBuilderItemProps) {
  const choices = question.options?.choices || [
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
  ];
  const correctOption = question.options?.correctOption || "A";
  const explanation = question.options?.explanation || "";
  const points = question.options?.points || 1;

  const updateQuestionText = (text: string) => {
    onChange({
      ...question,
      questionText: text,
    });
  };

  const updateChoiceText = (choiceId: string, text: string) => {
    const updatedChoices = choices.map((c) =>
      c.id === choiceId ? { ...c, text } : c
    );
    onChange({
      ...question,
      options: {
        ...question.options,
        choices: updatedChoices,
        correctOption,
        explanation,
        points,
      },
    });
  };

  const setCorrect = (choiceId: string) => {
    onChange({
      ...question,
      options: {
        ...question.options,
        choices,
        correctOption: choiceId,
        explanation,
        points,
      },
    });
  };

  const addOption = () => {
    if (choices.length >= OPTION_LETTERS.length) return;
    const nextLetter = OPTION_LETTERS[choices.length];
    const updatedChoices = [...choices, { id: nextLetter, text: "" }];
    onChange({
      ...question,
      options: {
        ...question.options,
        choices: updatedChoices,
        correctOption,
        explanation,
        points,
      },
    });
  };

  const removeOption = (choiceId: string) => {
    if (choices.length <= minOptions) return;
    const filtered = choices.filter((c) => c.id !== choiceId);
    // Re-letter remaining options to keep A, B, C... sequence
    const reindexed = filtered.map((c, i) => ({
      id: OPTION_LETTERS[i],
      text: c.text,
    }));
    // If the removed option was the correct one, default to first option
    let nextCorrect = correctOption;
    if (choiceId === correctOption || !reindexed.some((c) => c.id === nextCorrect)) {
      nextCorrect = reindexed[0]?.id || "A";
    }
    onChange({
      ...question,
      options: {
        ...question.options,
        choices: reindexed,
        correctOption: nextCorrect,
        explanation,
        points,
      },
    });
  };

  const updateExplanation = (exp: string) => {
    onChange({
      ...question,
      options: {
        ...question.options,
        choices,
        correctOption,
        explanation: exp,
        points,
      },
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0c1e] p-5 shadow-lg space-y-4 transition-all hover:border-white/20">
      {/* Question Header & Order Controls */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 border border-orange-500/30 text-xs font-mono font-bold text-orange-400">
            #{index}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Objective Question {index}
          </span>
          <span className="text-[11px] font-mono text-gray-500">
            ({choices.length} options)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onMoveUp && (
            <button
              type="button"
              disabled={isFirst}
              onClick={onMoveUp}
              aria-label="Move question up"
              className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
            >
              <i className="fas fa-arrow-up" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              disabled={isLast}
              onClick={onMoveDown}
              aria-label="Move question down"
              className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
            >
              <i className="fas fa-arrow-down" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete question"
              className="h-7 w-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center text-xs ml-1"
            >
              <i className="fas fa-trash-alt" />
            </button>
          )}
        </div>
      </div>

      {/* Question Prompt */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-300">
          Question Stem / Prompt:
        </label>
        <textarea
          rows={2}
          value={question.questionText}
          onChange={(e) => updateQuestionText(e.target.value)}
          placeholder={`Enter the text for objective question #${index}...`}
          className="w-full rounded-xl border border-white/10 bg-[#070714] p-3 text-xs text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Customizable Options / Choices */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
            <span>Answer Choices & Correct Key:</span>
            <span className="text-[10px] text-gray-400 font-normal">
              (Select radio to mark correct answer, minimum {minOptions} options)
            </span>
          </label>
          {choices.length < OPTION_LETTERS.length && (
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[11px] font-bold text-orange-400 hover:bg-orange-500/20"
            >
              <i className="fas fa-plus text-[10px]" />
              <span>Add Option {OPTION_LETTERS[choices.length]}</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {choices.map((choice) => {
            const isCorrect = correctOption === choice.id;
            const canRemoveChoice = choices.length > minOptions;

            return (
              <div
                key={choice.id}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                  isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/[0.07]"
                    : "border-white/10 bg-[#070714]"
                }`}
              >
                {/* Correct Selector Radio */}
                <button
                  type="button"
                  onClick={() => setCorrect(choice.id)}
                  title={isCorrect ? "Correct answer key" : `Set ${choice.id} as correct`}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all ${
                    isCorrect
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400"
                      : "border border-white/20 bg-white/5 text-gray-400 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {choice.id}
                </button>

                {/* Option Text Input */}
                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) => updateChoiceText(choice.id, e.target.value)}
                  placeholder={`Option ${choice.id} description...`}
                  className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                />

                {/* Status Indicator */}
                {isCorrect && (
                  <span className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Correct Key
                  </span>
                )}

                {/* Delete Option (enforcing minOptions) */}
                {canRemoveChoice && (
                  <button
                    type="button"
                    onClick={() => removeOption(choice.id)}
                    title={`Delete option ${choice.id}`}
                    className="h-6 w-6 shrink-0 rounded-md text-gray-500 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-xs"
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Post-Assessment Pedagogical Explanation */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
          <i className="fas fa-lightbulb text-amber-400 text-xs" />
          <span>Educational Explanation (Shown to student on post-exam score report):</span>
        </label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => updateExplanation(e.target.value)}
          placeholder="Why is this the correct answer? (e.g. ATS scans for matching keywords...)"
          className="w-full rounded-xl border border-white/10 bg-[#070714] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
