"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ScorecardForm } from "./ScorecardForm";

/**
 * Modal chrome (portal, backdrop, focus trap, scroll lock, close button) around
 * the shared `ScorecardForm`. The form + submit logic lives in `ScorecardForm`
 * so the modal and the standalone `/preview` page can't drift.
 */
export function ScorecardModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  // Remount the form on each open so it resets to a clean state machine.
  const [instance, setInstance] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setInstance((n) => n + 1);
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

        <ScorecardForm key={instance} variant="modal" titleId={titleId} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
