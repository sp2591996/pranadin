"use client";

/** Small shared building blocks for Dev-2 screens (tokens from DS-1). */
import { useEffect, useRef, type ReactNode } from "react";

export const btn = {
  primary:
    "inline-flex min-h-12 min-w-[132px] items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-on-primary hover:bg-primary-pressed disabled:opacity-50",
  secondary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border-input bg-surface px-6 font-semibold text-text hover:bg-surface-2 disabled:opacity-50",
  ghost: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 font-semibold text-primary hover:bg-primary-tint",
  danger:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-error px-6 font-semibold text-on-error disabled:opacity-50",
  icon: "flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-surface-2",
  chip: "inline-flex min-h-11 items-center gap-2 rounded-full border border-border-input px-4 aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary-tint aria-[pressed=true]:text-on-primary-tint aria-[checked=true]:border-primary aria-[checked=true]:bg-primary-tint aria-[checked=true]:text-on-primary-tint",
} as const;

export const card = "rounded-lg border border-divider bg-surface p-4";

/** Accessible confirm dialog on the native <dialog> element (focus trap, Esc). */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,420px)] rounded-xl border border-divider bg-surface-raised p-6 text-text backdrop:bg-scrim"
    >
      <h2 id="confirm-title" className="mb-2">
        {title}
      </h2>
      <div className="mb-6 text-text-muted">{body}</div>
      <div className="flex flex-wrap justify-end gap-3">
        {/* The safe choice is first and gets initial focus. */}
        <button type="button" autoFocus className={btn.primary} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={danger ? btn.danger : btn.secondary} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

/** Polite live region for one-line status messages. */
export function Status({ message }: { message: string | null }) {
  return (
    <p role="status" aria-live="polite" className={message ? "rounded-md bg-success-tint p-3 text-text" : "sr-only"}>
      {message ?? ""}
    </p>
  );
}
