import type { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  unit,
  note,
  toneClass = "",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: ReactNode;
  toneClass?: string;
}) {
  return (
    <Card>
      <div className="text-[0.68rem] tracking-widest text-muted uppercase">{label}</div>
      <div className={`mt-0.5 font-mono text-[1.9rem] leading-tight font-bold ${toneClass}`}>
        {value}
        {unit && <small className="text-[0.85rem] font-normal text-muted"> {unit}</small>}
      </div>
      {note && <div className="mt-0.5 font-mono text-[0.74rem] text-faint">{note}</div>}
    </Card>
  );
}
