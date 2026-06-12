import type { ButtonHTMLAttributes } from "react";
import type { GlycemicImpact } from "@/lib/types";

const impactStyles: Record<GlycemicImpact, string> = {
  low: "border-ok text-ok",
  moderate: "border-warn text-warn",
  high: "border-danger text-danger",
};

export function Pill({ text, tone }: { text: string; tone?: GlycemicImpact }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-px font-mono text-[0.66rem] lowercase ${
        tone ? impactStyles[tone] : "border-line-strong text-muted"
      }`}
    >
      {text}
    </span>
  );
}

/** Clickable filter pill (recipe tag filter). */
export function PillButton({
  text,
  active,
  ...rest
}: { text: string; active: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-full border px-2.5 py-px font-mono text-[0.66rem] lowercase ${
        active
          ? "border-accent bg-accent font-bold text-accent-ink"
          : "border-line-strong bg-transparent text-muted hover:text-ink"
      }`}
      {...rest}
    >
      {text}
    </button>
  );
}
