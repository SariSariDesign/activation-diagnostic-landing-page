"use client";

import { cloneElement, isValidElement, useId, useState } from "react";
import { Button } from "@/components/Button";
import { diagnostic } from "@/content/activation-diagnostic";
import {
  EMPTY_FORM,
  validateScorecardForm,
  type FormErrors,
  type FormState,
} from "@/lib/scorecard/formValidation";
import { ScorecardCover } from "./ScorecardCover";

type Step = "form" | "submitting" | "done" | "duplicate" | "error";

const { scorecard } = diagnostic;

/**
 * The free Activation Scorecard lead form + its submit state machine, shared by
 * the landing-page modal (`ScorecardModal`) and the standalone `/preview` page.
 *
 * - `variant="modal"` renders the two-column layout with the illustrative gauge
 *   pitch pane (the original modal look).
 * - `variant="page"` renders a single column (headline + form) for the
 *   focused, shareable page — no pitch pane.
 *
 * The confirmation screen's "Close" affordance only appears when `onClose` is
 * supplied (the modal has one; the page does not).
 */
export function ScorecardForm({
  variant,
  titleId,
  firstFieldRef,
  onClose,
}: {
  variant: "modal" | "page";
  titleId?: string;
  firstFieldRef?: React.RefObject<HTMLInputElement | null>;
  onClose?: () => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const fallbackTitleId = useId();
  const headingId = titleId ?? fallbackTitleId;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Honeypot filled → pretend success without hitting the API.
    if (form.faxNumber) {
      setStep("done");
      return;
    }
    const nextErrors = validateScorecardForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
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

  if (step === "submitting") return <LoadingScreen titleId={headingId} />;

  if (step === "done" || step === "duplicate") {
    return <ConfirmationScreen titleId={headingId} variant={step} onClose={onClose} />;
  }

  if (step === "error") {
    return <ErrorScreen titleId={headingId} onRetry={() => setStep("form")} />;
  }

  return (
    <FormScreen
      variant={variant}
      titleId={headingId}
      form={form}
      errors={errors}
      update={update}
      firstFieldRef={firstFieldRef}
      onSubmit={handleSubmit}
    />
  );
}

/* -------------------------------------------------------------------------- */

function FormScreen({
  variant,
  titleId,
  form,
  errors,
  update,
  firstFieldRef,
  onSubmit,
}: {
  variant: "modal" | "page";
  titleId: string;
  form: FormState;
  errors: FormErrors;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  firstFieldRef?: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { form: f } = scorecard;

  const fields = (
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
  );

  const formPane = (
    <div className={variant === "modal" ? "flex flex-col gap-5 p-8" : "flex flex-col gap-5"}>
      <span className="ds-label text-label-m text-primary-400">{scorecard.eyebrow}</span>
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
      {fields}
    </div>
  );

  // Left pane presents the packaged report cover. Hidden on small screens in the
  // modal (to keep it compact); stacked above the form on the page.
  const coverPane = (
    <div
      className={
        variant === "modal"
          ? "hidden items-center justify-center bg-neutral-200 p-8 md:flex md:rounded-l-2xl"
          : "flex items-center justify-center py-2 md:py-0"
      }
    >
      <ScorecardCover />
    </div>
  );

  return (
    <div
      className={
        variant === "modal"
          ? "grid gap-0 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]"
          : "grid items-center gap-8 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:gap-12"
      }
    >
      {coverPane}
      {formPane}
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
  onClose?: () => void;
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
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ds-label text-label-s text-neutral-500 underline-offset-4 hover:underline"
          >
            Close
          </button>
        )}
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
