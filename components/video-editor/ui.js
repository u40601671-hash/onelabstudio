"use client";
// Small building blocks shared by every panel of the video editor.
import { forwardRef, useId, useState } from "react";

export const cx = (...a) => a.filter(Boolean).join(" ");

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-500";

export const Btn = forwardRef(function Btn({ variant = "light", size = "md", className, children, ...rest }, ref) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-45";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-200",
    light: "border border-slate-300 bg-white text-ink hover:border-brand-600 hover:text-brand-700 focus-visible:ring-brand-100",
    ghost: "text-slate-700 hover:bg-slate-100 focus-visible:ring-brand-100",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-100",
    dark: "bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/30",
  };
  return (
    <button ref={ref} type="button" className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
});

/** Numbered, collapsible section of the left panel. */
export function Section({ n, title, status, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-b border-slate-200 last:border-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-extrabold text-white">{n}</span>
          <span className="min-w-0 flex-1 text-sm font-extrabold uppercase tracking-wide text-ink">{title}</span>
          {status && <span className="max-w-[45%] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">{status}</span>}
          <span aria-hidden className={cx("text-slate-500 transition-transform", open && "rotate-180")}>▾</span>
        </button>
      </h2>
      <div id={id} hidden={!open} className="space-y-4 px-4 pb-5 pt-1">
        {children}
      </div>
    </section>
  );
}

export function Field({ label, hint, children, className }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-bold text-slate-700">{label}</label>
      {typeof children === "function" ? children(id) : children}
      {hint && <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

export function Segmented({ value, onChange, options, label, size = "md", dark = false }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("inline-flex flex-wrap gap-1 rounded-xl p-1", dark ? "bg-white/10" : "bg-slate-100")}>
      {options.map(([v, text, sub]) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={cx(
              "rounded-lg font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
              on ? "bg-brand-600 text-white shadow-sm" : dark ? "text-white/80 hover:bg-white/10" : "text-slate-700 hover:bg-white",
            )}
          >
            {text}
            {sub && <span className={cx("ml-1 text-[10px] font-semibold", on ? "text-white/80" : "text-slate-500")}>{sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200", checked ? "bg-brand-600" : "bg-slate-300")}
      >
        <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-ink">
        {label}
        {hint && <span className="block text-[11px] font-medium text-slate-500">{hint}</span>}
      </label>
    </div>
  );
}

export function Notice({ type = "info", children, onClose }) {
  const tone = {
    info: "border-brand-200 bg-brand-50 text-ink",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-800",
  }[type];
  return (
    <div role={type === "error" ? "alert" : "status"} className={cx("flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-semibold leading-snug", tone)}>
      <span className="min-w-0 flex-1">{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="shrink-0 rounded px-1 text-base leading-none opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}

export function ProgressBar({ pct, label }) {
  return (
    <div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export const mb = (bytes) => (bytes / 1048576 >= 10 ? Math.round(bytes / 1048576) : (bytes / 1048576).toFixed(1));
