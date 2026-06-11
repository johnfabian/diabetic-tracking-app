import { Link, useLoaderData } from "react-router";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, fmtDay, fmtTime, glucoseTone } from "../api.js";

export async function dashboardLoader() {
  const [summary, series, meals] = await Promise.all([
    api("/api/stats/summary?days=14"),
    api("/api/stats/series?days=14"),
    api("/api/meals?days=2&limit=4"),
  ]);
  return { summary, series, meals };
}

const C = {
  ok: "#5ad07e", warn: "#f5a45c", danger: "#ff6b6b",
  accent: "#ffd23f", muted: "#8fa899", line: "#2b3d33",
  carbs: "#ffd23f", protein: "#5ad07e", fat: "#6db9ff",
};

const tooltipStyle = {
  background: "#121d18", border: "1px solid #3d5547", borderRadius: 8,
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
};

function GlucoseChart({ readings, target }) {
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
          tickFormatter={(t) => fmtDay(new Date(t).toISOString().slice(0, 10))}
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
          labelFormatter={(t) => fmtTime(new Date(t).toISOString())}
          formatter={(v) => [`${v} mg/dL`, "glucose"]}
        />
        <Line
          type="monotone" dataKey="value" stroke={C.accent} strokeWidth={2}
          dot={({ cx, cy, payload, index }) => {
            const tone = glucoseTone(payload.value, target);
            const color = tone === "ok" ? C.ok : tone === "high" ? C.warn : C.danger;
            return <circle key={index} cx={cx} cy={cy} r={3.5} fill={color} stroke="none" />;
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function RangeDonut({ summary }) {
  const data = [
    { name: "in range", value: summary.time_in_range_pct ?? 0, color: C.ok },
    { name: "high", value: summary.high_pct ?? 0, color: C.warn },
    { name: "low", value: summary.low_pct ?? 0, color: C.danger },
  ].filter((d) => d.value > 0);
  if (!data.length) return <p className="empty">No readings yet</p>;
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
          formatter={(v) => <span style={{ color: C.muted, fontSize: 12 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function MacroChart({ macros }) {
  if (!macros.length) return <p className="empty">Log some meals to see daily macros</p>;
  const data = macros.map((m) => ({ ...m, day: fmtDay(m.day) }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={C.line} strokeDasharray="2 6" vertical={false} />
        <XAxis dataKey="day" stroke={C.muted} fontSize={11} tickLine={false} />
        <YAxis stroke={C.muted} fontSize={11} tickLine={false} unit="g" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v, k) => [`${v} g`, k]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: C.muted, fontSize: 12 }}>{v}</span>} />
        <Bar dataKey="carbs_g" name="carbs" stackId="m" fill={C.carbs} />
        <Bar dataKey="protein_g" name="protein" stackId="m" fill={C.protein} />
        <Bar dataKey="fat_g" name="fat" stackId="m" fill={C.fat} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { summary, series, meals } = useLoaderData();
  const latest = summary.latest;
  const latestTone = latest ? glucoseTone(latest.value_mg_dl, summary.target) : null;
  const toneClass = { ok: "tone-ok", high: "tone-warn", low: "tone-danger" };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Last 14 days at a glance.</p>
        </div>
        <Link to="/log" className="btn primary">+ Log a reading</Link>
      </div>

      <div className="grid stats" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="stat-label">Latest reading</div>
          <div className={`stat-value ${latest ? toneClass[latestTone] : ""}`}>
            {latest ? latest.value_mg_dl : "—"} <small>mg/dL</small>
          </div>
          <div className="stat-note num">{latest ? fmtTime(latest.taken_at) : "no data yet"}</div>
        </div>
        <div className="card">
          <div className="stat-label">14-day average</div>
          <div className="stat-value">{summary.avg_mg_dl ?? "—"} <small>mg/dL</small></div>
          <div className="stat-note num">
            {summary.week_delta != null
              ? `${summary.week_delta > 0 ? "▲" : "▼"} ${Math.abs(summary.week_delta)} vs prior week`
              : `${summary.count} readings`}
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Est. A1C</div>
          <div className="stat-value tone-accent">{summary.est_a1c ?? "—"}<small>%</small></div>
          <div className="stat-note">from mean glucose (ADAG)</div>
        </div>
        <div className="card">
          <div className="stat-label">Time in range</div>
          <div className={`stat-value ${summary.time_in_range_pct >= 70 ? "tone-ok" : "tone-warn"}`}>
            {summary.time_in_range_pct ?? "—"}<small>%</small>
          </div>
          <div className="stat-note num">target {summary.target.low}–{summary.target.high} mg/dL</div>
        </div>
      </div>

      <div className="card raised" style={{ marginBottom: 16 }}>
        <h2>Glucose</h2>
        <p className="sub">Every reading, with your target band shaded.</p>
        {series.readings.length
          ? <GlucoseChart readings={series.readings} target={summary.target} />
          : <p className="empty">No readings yet — snap a photo of your meter on the Glucose Log page.</p>}
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Daily macros</h2>
          <p className="sub">Carbs / protein / fat from logged meals.</p>
          <MacroChart macros={series.macros} />
        </div>
        <div className="card">
          <h2>Range split</h2>
          <p className="sub">Share of readings in / above / below range.</p>
          <RangeDonut summary={summary} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Recent meals</h2>
        <p className="sub">Last 48 hours.</p>
        {meals.length ? (
          <div className="list">
            {meals.map((m) => (
              <div className="list-row" key={m.id}>
                <span className="when">{fmtTime(m.eaten_at)}</span>
                <div className="grow">
                  <div>{m.name}</div>
                  <div className="macro-row">
                    <span><b>{Math.round(m.carbs_g ?? 0)}g</b> carbs</span>
                    <span><b>{Math.round(m.sugar_g ?? 0)}g</b> sugar</span>
                    <span><b>{Math.round(m.protein_g ?? 0)}g</b> protein</span>
                    <span><b>{Math.round(m.fat_g ?? 0)}g</b> fat</span>
                  </div>
                </div>
                {m.glycemic_impact && <span className={`pill gi-${m.glycemic_impact}`}>{m.glycemic_impact} GI</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">Nothing logged yet — head to <Link to="/meals">Meals</Link> and tell me what you ate.</p>
        )}
      </div>
    </>
  );
}
