/**
 * Client-side validation for the free Activation Scorecard lead form. Extracted
 * so the modal (`ScorecardModal`) and the standalone `/preview` page share one
 * source of truth via `ScorecardForm`. Pure functions only — unit-tested in
 * `formValidation.test.ts`.
 */

export type FormState = {
  name: string;
  company: string;
  email: string;
  stage: string;
  url: string;
  /** Honeypot — must stay empty. Bots that autofill it are silently dropped. */
  faxNumber: string;
};

export type FormErrors = Partial<Record<keyof FormState, string>>;

export const EMPTY_FORM: FormState = {
  name: "",
  company: "",
  email: "",
  stage: "",
  url: "",
  faxNumber: "",
};

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function isUrlish(v: string) {
  const s = v.trim();
  try {
    // Accept bare domains by prefixing a scheme for validation.
    new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return /\./.test(s);
  } catch {
    return false;
  }
}

export function validateScorecardForm(form: FormState): FormErrors {
  const next: FormErrors = {};
  if (!form.name.trim()) next.name = "Please enter your name.";
  if (!form.company.trim()) next.company = "Please enter your company.";
  if (!isEmail(form.email)) next.email = "Please enter a valid email.";
  if (!form.stage) next.stage = "Please select a funding stage.";
  if (!isUrlish(form.url)) next.url = "Please enter a valid URL.";
  return next;
}
