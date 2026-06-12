import { Link } from "react-router";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ListRow, ListWhen } from "@/components/ListRow";
import { MacroRow } from "@/components/MacroRow";
import { PageHeader } from "@/components/PageHeader";
import { PageError, PageLoading } from "@/components/PageState";
import { Pill } from "@/components/Pill";
import { StatCard } from "@/components/StatCard";
import { ROUTES } from "@/config/routes";
import { GlucoseChart, MacroChart, RangeDonut } from "@/features/dashboard/charts";
import { fmtTime, glucoseTone } from "@/lib/format";
import { useMeals, useStatsSeries, useStatsSummary } from "@/lib/queries";

const DAYS = 14;
const toneClass = { ok: "text-ok", high: "text-warn", low: "text-danger" } as const;

export default function Dashboard() {
  const summaryQuery = useStatsSummary(DAYS);
  const seriesQuery = useStatsSeries(DAYS);
  const mealsQuery = useMeals(2, 4);

  if (summaryQuery.isPending || seriesQuery.isPending) return <PageLoading />;
  if (summaryQuery.isError) return <PageError error={summaryQuery.error} />;
  if (seriesQuery.isError) return <PageError error={seriesQuery.error} />;

  const summary = summaryQuery.data;
  const series = seriesQuery.data;
  const meals = mealsQuery.data ?? [];
  const latest = summary.latest;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Last ${DAYS} days at a glance.`}
        actions={
          <Link
            to={ROUTES.log}
            className="rounded-[9px] border border-accent bg-accent px-4 py-2 text-[0.88rem] font-bold
              text-accent-ink no-underline shadow-none transition-transform hover:-translate-y-px"
          >
            + Log a reading
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        <StatCard
          label="Latest reading"
          value={latest ? latest.value_mg_dl : "—"}
          unit="mg/dL"
          note={latest ? fmtTime(latest.taken_at) : "no data yet"}
          toneClass={latest ? toneClass[glucoseTone(latest.value_mg_dl, summary.target)] : ""}
        />
        <StatCard
          label={`${DAYS}-day average`}
          value={summary.avg_mg_dl ?? "—"}
          unit="mg/dL"
          note={
            summary.week_delta != null
              ? `${summary.week_delta > 0 ? "▲" : "▼"} ${Math.abs(summary.week_delta)} vs prior week`
              : `${summary.count} readings`
          }
        />
        <StatCard
          label="Est. A1C"
          value={summary.est_a1c ?? "—"}
          unit="%"
          note="from mean glucose (ADAG)"
          toneClass="text-accent"
        />
        <StatCard
          label="Time in range"
          value={summary.time_in_range_pct ?? "—"}
          unit="%"
          note={`target ${summary.target.low}–${summary.target.high} mg/dL`}
          toneClass={(summary.time_in_range_pct ?? 0) >= 70 ? "text-ok" : "text-warn"}
        />
      </div>

      <Card raised title="Glucose" subtitle="Every reading, with your target band shaded." className="mb-4">
        {series.readings.length ? (
          <GlucoseChart readings={series.readings} target={summary.target} />
        ) : (
          <EmptyState>No readings yet — snap a photo of your meter on the Glucose Log page.</EmptyState>
        )}
      </Card>

      <div className="grid grid-cols-[1.6fr_1fr] gap-4 max-lg:grid-cols-1">
        <Card title="Daily macros" subtitle="Carbs / protein / fat from logged meals.">
          <MacroChart macros={series.macros} />
        </Card>
        <Card title="Range split" subtitle="Share of readings in / above / below range.">
          <RangeDonut summary={summary} />
        </Card>
      </div>

      <Card title="Recent meals" subtitle="Last 48 hours." className="mt-4">
        {meals.length === 0 ? (
          <EmptyState>
            Nothing logged yet — head to{" "}
            <Link to={ROUTES.meals} className="text-ink underline">Meals</Link> and tell me what you ate.
          </EmptyState>
        ) : (
          <div className="flex flex-col">
            {meals.map((meal) => (
              <ListRow key={meal.id}>
                <ListWhen>{fmtTime(meal.eaten_at)}</ListWhen>
                <div className="min-w-0 flex-1 max-md:order-3 max-md:basis-full">
                  <div>{meal.name}</div>
                  <MacroRow meal={meal} showCalories={false} />
                </div>
                {meal.glycemic_impact && (
                  <Pill text={`${meal.glycemic_impact} GI`} tone={meal.glycemic_impact} />
                )}
              </ListRow>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
