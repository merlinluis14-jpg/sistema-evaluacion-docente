"use client";

import { useRef, useState } from "react";

import {
  PLATFORM_FEEDBACK_OPTIONS,
  PLATFORM_FEEDBACK_QUESTIONS,
} from "@/lib/platformFeedback";

export function PlatformFeedbackForm({
  periodId,
  action,
}: {
  periodId: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const focusQuestion = (fieldName: string) => {
    const target = formRef.current?.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`);

    if (!target) return;

    target.focus();
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const validateQuestions = () => {
    const form = formRef.current;
    if (!form) return true;

    const missingQuestion = PLATFORM_FEEDBACK_QUESTIONS.find(
      (question) => !form.querySelector(`input[name="${question.key}"]:checked`),
    );

    if (!missingQuestion) {
      setValidationMessage(null);
      return true;
    }

    setValidationMessage("Responde las cinco preguntas antes de enviar tu encuesta final.");
    focusQuestion(missingQuestion.key);
    return false;
  };

  return (
    <form
      ref={formRef}
      noValidate
      onChange={() => {
        if (validationMessage) {
          setValidationMessage(null);
        }
      }}
      onSubmit={(event) => {
        if (!validateQuestions()) {
          event.preventDefault();
          return;
        }

        setLoading(true);
      }}
      action={async (formData) => {
        try {
          await action(formData);
        } finally {
          setLoading(false);
        }
      }}
      className="space-y-5"
    >
      <input type="hidden" name="periodId" value={periodId} />

      {validationMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {validationMessage}
        </div>
      )}

      <div className="space-y-4">
        {PLATFORM_FEEDBACK_QUESTIONS.map((question, index) => (
          <div
            key={question.key}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                  {index + 1}
                </div>
                <p className="mt-3 text-base font-bold leading-relaxed text-slate-800">
                  {question.label}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:min-w-[240px]">
                {PLATFORM_FEEDBACK_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name={question.key}
                      value={option.value}
                      required
                      className="h-4 w-4 accent-blue-600"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
            Tu respuesta ayudara a medir la experiencia y el desempeno general del sistema. Solo
            necesitas enviarla una vez por periodo.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Guardando encuesta..." : "Enviar encuesta final"}
          </button>
        </div>
      </div>
    </form>
  );
}
