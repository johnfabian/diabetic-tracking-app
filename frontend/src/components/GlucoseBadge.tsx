import { glucoseTone } from "@/lib/format";
import type { GlucoseTone, TargetRange } from "@/lib/types";

const toneStyles: Record<GlucoseTone, string> = {
  ok: "border-ok text-ok bg-ok/10",
  high: "border-warn text-warn bg-warn/10",
  low: "border-danger text-danger bg-danger/10",
};

export function GlucoseBadge({ value, target }: { value: number; target?: TargetRange }) {
  const tone = glucoseTone(value, target);
  return (
    <span
      data-tone={tone}
      className={`rounded-lg border px-2.5 py-0.5 font-mono text-[1.05rem] font-bold ${toneStyles[tone]}`}
    >
      {value}
    </span>
  );
}
