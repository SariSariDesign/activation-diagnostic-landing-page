import { describe, it, expect } from "vitest";
import {
  isEmail,
  isUrlish,
  validateScorecardForm,
  EMPTY_FORM,
  type FormState,
} from "./formValidation";

function filled(over: Partial<FormState> = {}): FormState {
  return {
    name: "Ada",
    company: "Acme",
    email: "ada@acme.com",
    stage: "Seed",
    url: "acme.com",
    faxNumber: "",
    ...over,
  };
}

describe("isEmail", () => {
  it("accepts a normal address", () => {
    expect(isEmail("ada@acme.com")).toBe(true);
  });
  it("trims surrounding whitespace", () => {
    expect(isEmail("  ada@acme.com  ")).toBe(true);
  });
  it("rejects missing @, domain, or TLD", () => {
    expect(isEmail("ada")).toBe(false);
    expect(isEmail("ada@acme")).toBe(false);
    expect(isEmail("ada@.com")).toBe(false);
    expect(isEmail("")).toBe(false);
  });
});

describe("isUrlish", () => {
  it("accepts a bare domain", () => {
    expect(isUrlish("acme.com")).toBe(true);
  });
  it("accepts a full URL with path", () => {
    expect(isUrlish("https://acme.com/pricing")).toBe(true);
  });
  it("rejects a value with no dot", () => {
    expect(isUrlish("acme")).toBe(false);
    expect(isUrlish("localhost")).toBe(false);
  });
  it("rejects empty/garbage", () => {
    expect(isUrlish("")).toBe(false);
    expect(isUrlish("   ")).toBe(false);
  });
});

describe("validateScorecardForm", () => {
  it("returns no errors for a fully valid form", () => {
    expect(validateScorecardForm(filled())).toEqual({});
  });

  it("flags every empty/invalid field with its message", () => {
    const errors = validateScorecardForm(EMPTY_FORM);
    expect(errors).toEqual({
      name: "Please enter your name.",
      company: "Please enter your company.",
      email: "Please enter a valid email.",
      stage: "Please select a funding stage.",
      url: "Please enter a valid URL.",
    });
  });

  it("treats whitespace-only name/company as empty", () => {
    const errors = validateScorecardForm(filled({ name: "  ", company: "\t" }));
    expect(errors.name).toBe("Please enter your name.");
    expect(errors.company).toBe("Please enter your company.");
  });

  it("flags only the invalid field", () => {
    const errors = validateScorecardForm(filled({ email: "nope" }));
    expect(errors).toEqual({ email: "Please enter a valid email." });
  });

  it("ignores the honeypot field", () => {
    expect(validateScorecardForm(filled({ faxNumber: "bot" }))).toEqual({});
  });
});
