import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { EmptyState } from "@/components/EmptyState";
import { fmtDay, fmtTime, glucoseTone } from "@/lib/format";
import type { DailyMacros, Reading, StatsSummary, TargetRange } from "@/lib/types";

/** Chart palette — mirrors the @theme tokens in index.css (recharts needs
 *  concrete values, not CSS classes). */
const C = {
  ok: "#5ad07e", warn: "#f5a45c", danger: "#ff6b6b",
  accent: "#ffd23f", muted: "#8fa899", line: "#2b3d33",
  carbs: "#ffd23f", protein: "#5ad07e", fat: "#6db9ff",
} as const;

const tooltipStyle = {
  background: "#121d18", border: "1px solid #3d5547", borderRadius: 8,
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
} as const;

const toneColor = { ok: C.ok, high: C.warn, low: C.danger } as const;

export function GlucoseChart({
  readings,
  target,
}: {
  readings: Pick<Reading, "value_mg_dl" | "taken_at">[];
  target: TargetRange;
}) {
  const data = readings.map((r) => ({
    t: new Date(r.taken_at).getTime(),
    value: r.value_mg_dl,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={C.line} strokeDasharray="2 6" />
        <XAxis
          dataKey="t" type="number" scale="time" domain={["auto", "auto"]}
          tickFormatter={(t: number) => fmtDay(new Date(t).toISOString().slice(0, 10))}
          stroke={C.muted} fontSize={11} tickLine={false}
        />
        <YAxis domain={[40, "auto"]} stroke={C.muted} fontSize={11} tickLine={false} />
        <ReferenceArea
          y1={target.low} y2={target.high}
          fill={C.ok} fillOpacity={0.07}
          stroke={C.ok} strokeOpacity={0.25} strokeDasharray="4 4"
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(t) => fmtTime(new Date(Number(t)).toISOString())}
          formatter={(v) => [`${v} mg/dL`, "glucose"]}
        />
        <Line
          type="monotone" dataKey="value" stroke={C.accent} strokeWidth={2}
          dot={({ cx, cy, payload, index }) => (
            <circle
              key={index} cx={cx} cy={cy} r={3.5} stroke="none"
              fill={toneColor[glucoseTone((payload as { value: number }).value, target)]}
            />
          )}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RangeDonut({ summary }: { summary: StatsSummary }) {
  const data = [
    { name: "in range", value: summary.time_in_range_pct ?? 0, color: C.ok },
    { name: "high", value: summary.high_pct ?? 0, color: C.warn },
    { name: "low", value: summary.low_pct ?? 0, color: C.danger },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return <EmptyState>No readings yet</EmptyState>;

  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={data} dataKey="value" nameKey="name"
          innerRadius={58} outerRadius={86} paddingAngle={3} strokeWidth={0}
        >
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(value: string) => <span style={{ color: C.muted, fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MacroChart({ macros }: { macros: DailyMacros[] }) {
  if (macros.length === 0) return <EmptyState>Log some meals to see daily macros</EmptyState>;

  const data = macros.map((m) => ({ ...m, day: fmtDay(m.day) }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={C.line} strokeDasharray="2 6" vertical={false} />
        <XAxis dataKey="day" stroke={C.muted} fontSize={11} tickLine={false} />
        <YAxis stroke={C.muted} fontSize={11} tickLine={false} unit="g" />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v, k) => [`${v} g`, String(k)]}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(value: string) => <span style={{ color: C.muted, fontSize: 12 }}>{value}</span>}
        />
        <Bar dataKey="carbs_g" name="carbs" stackId="m" fill={C.carbs} />
        <Bar dataKey="protein_g" name="protein" stackId="m" fill={C.protein} />
        <Bar dataKey="fat_g" name="fat" stackId="m" fill={C.fat} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
