"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/Button";
import { diagnostic } from "@/content/activation-diagnostic";
import { ScoreGauge } from "./ScoreGauge";

type Step = "form" | "submitting" | "done" | "duplicate" | "error";

type FormState = {
  name: string;
  company: string;
  email: string;
  stage: string;
  url: string;
  /** Honeypot — must stay empty. Bots that autofill it are silently dropped. */
  faxNumber: string;
};

const EMPTY: FormState = {
  name: "",
  company: "",
  email: "",
  stage: "",
  url: "",
  faxNumber: "",
};

const { scorecard } = diagnostic;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isUrlish(v: string) {
  const s = v.trim();
  try {
    // Accept bare domains by prefixing a scheme for validation.
    new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return /\./.test(s);
  } catch {
    return false;
  }
}

export function ScorecardModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const lastActiveRef = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  // Reset to a clean form each time the modal opens.
  useEffect(() => {
    if (open) {
      setStep("form");
      setForm(EMPTY);
      setErrors({});
    }
  }, [open]);

  // Body scroll lock + focus management while open.
  useEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the panel (not the first input) so the mobile keyboard doesn't spring
    // up and the visitor lands on the pitch, not mid-form.
    const t = setTimeout(() => panelRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      (lastActiveRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  // Escape to close + basic focus trap on Tab.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!form.company.trim()) next.company = "Please enter your company.";
    if (!isEmail(form.email)) next.email = "Please enter a valid email.";
    if (!form.stage) next.stage = "Please select a funding stage.";
    if (!isUrlish(form.url)) next.url = "Please enter a valid URL.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Honeypot filled → pretend success without hitting the API.
    if (form.faxNumber) {
      setStep("done");
      return;
    }
    if (!validate()) return;
    setStep("submitting");
    try {
      // Trailing slash matches next.config `trailingSlash: true` (avoids a 308 on POST).
      const res = await fetch("/api/scorecard-request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          stage: form.stage,
          url: form.url.trim(),
          faxNumber: form.faxNumber,
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = (await res.json().catch(() => ({}))) as { duplicate?: boolean };
      setStep(data.duplicate ? "duplicate" : "done");
    } catch {
      setStep("error");
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-neutral-1000/40 p-4 backdrop-blur-md sm:items-center sm:p-6"
      onMouseDown={(e) => {
        // Close only when the backdrop itself is pressed (not a drag out of the panel).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative my-auto w-full max-w-[880px] rounded-2xl bg-neutral-100 shadow-[0_20px_60px_rgba(31,29,28,0.28)] focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {step === "form" && (
          <FormScreen
            titleId={titleId}
            form={form}
            errors={errors}
            update={update}
            firstFieldRef={firstFieldRef}
            onSubmit={handleSubmit}
          />
        )}

        {step === "submitting" && <LoadingScreen titleId={titleId} />}

        {(step === "done" || step === "duplicate") && (
          <ConfirmationScreen titleId={titleId} variant={step} onClose={onClose} />
        )}

        {step === "error" && (
          <ErrorScreen titleId={titleId} onRetry={() => setStep("form")} />
        )}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */

function FormScreen({
  titleId,
  form,
  errors,
  update,
  firstFieldRef,
  onSubmit,
}: {
  titleId: string;
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { form: f } = scorecard;
  return (
    <div className="grid gap-0 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      {/* Left — pitch + illustrative score */}
      <div className="flex flex-col gap-6 rounded-t-2xl bg-primary-600 p-8 md:rounded-l-2xl md:rounded-tr-none">
        <span className="ds-label text-label-m text-primary-300">
          {scorecard.modalTitle}
        </span>
        <div className="flex justify-center py-2">
          <ScoreGauge score={scorecard.sampleScore} />
        </div>
        <p className="text-body-s text-primary-100">
          A preview of what you'll receive — scored across 11 UX dimensions.
        </p>
      </div>

      {/* Right — headline, body, form */}
      <div className="flex flex-col gap-5 p-8">
        <h2 id={titleId} className="font-brand text-h2 text-neutral-900">
          {scorecard.headline}
        </h2>
        <div className="flex flex-col gap-3">
          {scorecard.body.map((p) => (
            <p key={p.slice(0, 24)} className="text-body-s text-neutral-700">
              {p}
            </p>
          ))}
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <Field label={f.fields.name} error={errors.name}>
            <input
              ref={firstFieldRef}
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputCls(!!errors.name)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={f.fields.company} error={errors.company}>
              <input
                type="text"
                autoComplete="organization"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                className={inputCls(!!errors.company)}
              />
            </Field>
            <Field label={f.fields.email} error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputCls(!!errors.email)}
              />
            </Field>
          </div>

          <Field label={f.fields.stage} error={errors.stage}>
            <select
              value={form.stage}
              onChange={(e) => update("stage", e.target.value)}
              className={inputCls(!!errors.stage)}
            >
              <option value="" disabled>
                Select…
              </option>
              {f.stageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label={f.fields.url} error={errors.url}>
            <input
              type="url"
              inputMode="url"
              placeholder={f.urlPlaceholder}
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              className={inputCls(!!errors.url)}
            />
          </Field>

          {/* Honeypot — hidden from users, catches bots. */}
          <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Fax number
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.faxNumber}
                onChange={(e) => update("faxNumber", e.target.value)}
              />
            </label>
          </div>

          <div className="mt-1">
            <Button type="submit" onClick={() => {}} variant="primary" size="large" className="w-full justify-center rounded-full">
              {f.submitLabel}
            </Button>
          </div>

          <LegalFooter />
        </form>
      </div>
    </div>
  );
}

function LoadingScreen({ titleId }: { titleId: string }) {
  return (
    <div className="flex flex-col items-center gap-6 px-8 py-20 text-center">
      <h2 id={titleId} className="font-brand text-h2 text-neutral-900">
        Submitting…
      </h2>
      <div className="h-[3px] w-56 overflow-hidden rounded-full bg-neutral-300">
        <div className="h-full w-1/3 animate-[scorecard-load_1.1s_ease-in-out_infinite] rounded-full bg-primary-400" />
      </div>
      <p className="text-body-s text-neutral-600">Sending your request to our analyst.</p>
    </div>
  );
}

function ConfirmationScreen({
  titleId,
  variant,
  onClose,
}: {
  titleId: string;
  variant: "done" | "duplicate";
  onClose: () => void;
}) {
  const confirmation = variant === "duplicate" ? scorecard.duplicate : scorecard.confirmation;
  return (
    <div className="flex flex-col items-center gap-6 px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-200">
        <svg width="30" height="30" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path
            d="M6 11.5l3.2 3.2L16 8"
            stroke="var(--color-success-500)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 id={titleId} className="font-brand text-h2 text-neutral-900">
        {confirmation.headline}
      </h2>
      <p className="max-w-[46ch] text-body-m text-neutral-700">{confirmation.body}</p>
      <div className="flex flex-col items-center gap-3 pt-2">
        <span className="ds-label text-label-s text-neutral-600">
          {confirmation.bookPrompt}
        </span>
        <Button href={diagnostic.bookingUrl} external variant="light" size="medium" className="rounded-full">
          {diagnostic.ctaLabel}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="ds-label text-label-s text-neutral-500 underline-offset-4 hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ErrorScreen({
  titleId,
  onRetry,
}: {
  titleId: string;
  onRetry: () => void;
}) {
  const { error } = scorecard;
  return (
    <div className="flex flex-col items-center gap-6 px-8 py-16 text-center">
      <h2 id={titleId} className="font-brand text-h2 text-neutral-900">
        {error.headline}
      </h2>
      <p className="max-w-[46ch] text-body-m text-neutral-700">{error.body}</p>
      <Button onClick={onRetry} variant="primary" size="medium" className="rounded-full">
        {error.retryLabel}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const errId = `${id}-err`;
  const field = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errId : undefined,
      })
    : children;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="ds-label text-label-s text-neutral-800">
        {label}
      </label>
      {field}
      {error && (
        <span id={errId} className="text-body-s text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    "w-full rounded-lg border bg-neutral-100 px-4 py-3 text-body-m text-neutral-900",
    "placeholder:text-neutral-500",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400",
    hasError ? "border-red-400" : "border-neutral-400",
  ].join(" ");
}

function LegalFooter() {
  const { legal } = scorecard;
  return (
    <p className="text-body-s text-neutral-600">
      {legal.entity}. {legal.note}{" "}
      <a href={legal.privacyHref} className="underline underline-offset-2 hover:text-neutral-900">
        Privacy Policy
      </a>{" "}
      &amp;{" "}
      <a href={legal.termsHref} className="underline underline-offset-2 hover:text-neutral-900">
        Terms of Service
      </a>
      .
    </p>
  );
}
