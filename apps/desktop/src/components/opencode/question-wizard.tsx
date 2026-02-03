"use client";

import { useState, useMemo } from "react";
import type { ToolPart } from "@/lib/opencode/types";
import { CheckIcon } from "./icons";
import type { AskUserQuestion } from "./types";

export function parseAskUserQuestions(input: Record<string, unknown>): AskUserQuestion[] | null {
  let questions = input.questions;

  // Handle stringified JSON
  if (typeof questions === "string") {
    try {
      questions = JSON.parse(questions);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(questions)) return null;

  return questions.filter((q): q is AskUserQuestion =>
    q && typeof q === "object" &&
    typeof q.question === "string" &&
    Array.isArray(q.options)
  );
}

export function AskUserQuestionDisplay({
  part,
  onAnswer,
}: {
  part: ToolPart;
  onAnswer?: (answer: string) => void;
}) {
  const questions = useMemo(() => parseAskUserQuestions(part.state.input), [part.state.input]);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const [showCustom, setShowCustom] = useState<Record<number, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const isCompleted = part.state.status === "completed";
  const isPending = part.state.status === "pending" || part.state.status === "running";

  if (!questions || questions.length === 0) {
    return null;
  }

  const totalSteps = questions.length + 1; // +1 for summary
  const isSummaryStep = currentStep === questions.length;

  const handleOptionClick = (qIndex: number, option: string, multiSelect: boolean) => {
    setSelectedOptions(prev => {
      const current = prev[qIndex] || [];
      if (multiSelect) {
        if (current.includes(option)) {
          return { ...prev, [qIndex]: current.filter(o => o !== option) };
        } else {
          return { ...prev, [qIndex]: [...current, option] };
        }
      } else {
        setShowCustom(prevCustom => ({ ...prevCustom, [qIndex]: false }));
        return { ...prev, [qIndex]: [option] };
      }
    });
  };

  const toggleCustomInput = (qIndex: number, multiSelect: boolean) => {
    setShowCustom(prev => {
      const willShow = !prev[qIndex];
      if (willShow && !multiSelect) {
        setSelectedOptions(opts => ({ ...opts, [qIndex]: [] }));
      }
      return { ...prev, [qIndex]: willShow };
    });
  }

  const handleSubmit = () => {
    if (!onAnswer) return;

    const answers: string[] = [];
    questions.forEach((q, i) => {
      const selections = selectedOptions[i] || [];
      const hasCustom = showCustom[i] && !!customInputs[i]?.trim();

      const parts: string[] = [];

      if (q.multiSelect) {
        parts.push(...selections);
        if (hasCustom) parts.push(customInputs[i]!.trim());
      } else {
        if (hasCustom) {
          parts.push(customInputs[i]!.trim());
        } else if (selections.length > 0 && selections[0]) {
          parts.push(selections[0]);
        }
      }

      if (parts.length > 0) {
        answers.push(`${q.header}: ${parts.join(", ")}`);
      }
    });

    if (answers.length > 0) {
      onAnswer(answers.join("\n"));
    }
  };

  const currentStepHasSelection = (() => {
    if (isCompleted) return true;
    if (isSummaryStep) return true;

    const opts = selectedOptions[currentStep];
    const hasOpts = opts && opts.length > 0;
    const hasCust = showCustom[currentStep] && !!customInputs[currentStep]?.trim();

    return hasOpts || hasCust;
  })();

  const hasAnySelection = questions.some((_, i) => {
    const opts = selectedOptions[i];
    const hasOpts = opts && opts.length > 0;
    const hasCust = showCustom[i] && !!customInputs[i]?.trim();
    return hasOpts || hasCust;
  });

  const getAnswerText = (qIndex: number) => {
    const q = questions[qIndex];
    if (!q) return null;
    const selections = selectedOptions[qIndex] || [];
    const hasCustom = showCustom[qIndex] && customInputs[qIndex];

    if (q.multiSelect) {
      const parts = [...selections];
      if (hasCustom) parts.push(customInputs[qIndex]!);
      return parts.length > 0 ? parts.join(", ") : null;
    } else {
      if (hasCustom) return customInputs[qIndex];
      if (selections.length && selections[0]) return selections[0];
      return null;
    }
  };

  // Completed state: compact summary
  if (isCompleted) {
    return (
      <div className="border border-accent bg-white p-3 space-y-1 rounded-sm">
        <div className="text-[10px] font-medium text-muted uppercase tracking-wider">Answered</div>
        {questions.map((q, qIndex) => {
          const answer = getAnswerText(qIndex);
          return answer ? (
            <div key={qIndex} className="text-xs">
              <span className="text-neutral-500 font-medium">{q.header}:</span> {answer}
            </div>
          ) : null;
        })}
      </div>
    );
  }

  return (
    <div className="border border-accent bg-white p-3 flex flex-col max-h-[50vh] rounded-sm shadow-sm">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { if (i <= currentStep) setCurrentStep(i); }}
              className={`size-4 flex items-center justify-center text-[9px] font-mono border transition-all duration-150 rounded-full ${i === currentStep
                ? "border-accent bg-accent text-white"
                : i < currentStep
                  ? "border-accent bg-white text-accent cursor-pointer hover:bg-accent/5"
                  : "border-neutral-200 text-neutral-300 cursor-default"
                }`}
            >
              {i < currentStep ? (
                <CheckIcon className="size-2.5" />
              ) : i === questions.length ? (
                <span className="text-[8px]">&#x2713;</span>
              ) : (
                i + 1
              )}
            </button>
          ))}
        </div>
        <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
          {isSummaryStep ? "Review" : `${currentStep + 1} / ${questions.length}`}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Question step */}
        {!isSummaryStep && (() => {
          const q = questions[currentStep];
          if (!q) return null;
          const qIndex = currentStep;
          const isRadio = !q.multiSelect;

          return (
            <div key={`step-${currentStep}`} className="wizard-step-enter space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-accent text-white rounded-sm uppercase tracking-wide">
                  {q.header}
                </span>
                {q.multiSelect && (
                  <span className="text-[10px] text-muted">(Multi-select)</span>
                )}
              </div>
              <p className="text-xs font-medium text-neutral-800 leading-relaxed">{q.question}</p>

              <div className="space-y-1.5">
                {q.options.map((opt, optIndex) => {
                  const isSelected = selectedOptions[qIndex]?.includes(opt.label);
                  return (
                    <button
                      key={optIndex}
                      type="button"
                      onClick={() => handleOptionClick(qIndex, opt.label, q.multiSelect || false)}
                      className={`w-full text-left p-2 border rounded transition-colors ${isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-neutral-400"
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`size-3.5 flex-shrink-0 mt-0.5 border ${isSelected ? "border-accent bg-accent" : "border-neutral-300"} flex items-center justify-center ${isRadio ? 'rounded-full' : 'rounded-sm'}`}>
                          {isSelected && <CheckIcon className="size-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-neutral-700">{opt.label}</div>
                          {opt.description && (
                            <div className="text-[10px] text-muted mt-0.5 leading-tight">{opt.description}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Custom input option */}
                {isPending && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => toggleCustomInput(qIndex, q.multiSelect || false)}
                      className={`w-full text-left p-2 border rounded transition-colors ${showCustom[qIndex]
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-neutral-400"
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`size-3.5 flex-shrink-0 mt-0.5 border ${showCustom[qIndex] ? "border-accent bg-accent" : "border-neutral-300"} flex items-center justify-center ${isRadio ? 'rounded-full' : 'rounded-sm'}`}>
                          {showCustom[qIndex] && <CheckIcon className="size-2.5 text-white" />}
                        </div>
                        <div className="text-xs font-medium text-neutral-700">Other</div>
                      </div>
                    </button>

                    {showCustom[qIndex] && (
                      <input
                        type="text"
                        value={customInputs[qIndex] || ""}
                        onChange={(e) => setCustomInputs(prev => ({ ...prev, [qIndex]: e.target.value }))}
                        placeholder="Enter custom answer..."
                        className="w-full px-2 py-1.5 text-xs border border-border focus:border-accent focus:outline-none rounded"
                        autoFocus
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Summary step */}
        {isSummaryStep && (
          <div key="step-summary" className="wizard-step-enter space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
              Review Answers
            </div>
            {questions.map((q, qIndex) => {
              const answer = getAnswerText(qIndex);
              const hasAnswer = !!answer;
              return (
                <button
                  key={qIndex}
                  type="button"
                  onClick={() => setCurrentStep(qIndex)}
                  className={`w-full text-left p-2 border rounded transition-colors group ${hasAnswer
                    ? "border-border hover:border-accent"
                    : "border-red-300 bg-red-50"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-muted">
                        {q.header}
                      </div>
                      <div className="text-xs mt-0.5 truncate text-neutral-700">
                        {hasAnswer ? answer : "Not answered"}
                      </div>
                    </div>
                    <span className="text-[9px] text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      Edit
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      {isPending && onAnswer && (
        <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            className={`text-[10px] font-mono px-2 py-1 border border-border rounded transition-colors hover:bg-neutral-100 ${currentStep === 0 ? "opacity-0 pointer-events-none" : ""
              }`}
          >
            Back
          </button>

          {isSummaryStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasAnySelection}
              className="px-3 py-1 bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-wider hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!currentStepHasSelection}
              className="px-3 py-1 bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-wider hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === questions.length - 1 ? "Review" : "Next"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
