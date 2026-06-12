interface MacroSource {
  calories?: number | null;
  carbs_g: number | null;
  sugar_g: number | null;
  fiber_g?: number | null;
  protein_g: number | null;
  fat_g: number | null;
}

const round = (n: number | null | undefined) => Math.round(n ?? 0);

/** Inline "520 cal · 45g carbs · …" macro summary for meal rows. */
export function MacroRow({ meal, showCalories = true }: { meal: MacroSource; showCalories?: boolean }) {
  const entries: [string, number, string][] = [
    ...(showCalories ? ([["cal", round(meal.calories), ""]] as [string, number, string][]) : []),
    ["carbs", round(meal.carbs_g), "g"],
    ["sugar", round(meal.sugar_g), "g"],
    ...(meal.fiber_g !== undefined ? ([["fiber", round(meal.fiber_g), "g"]] as [string, number, string][]) : []),
    ["protein", round(meal.protein_g), "g"],
    ["fat", round(meal.fat_g), "g"],
  ];
  return (
    <div className="flex flex-wrap gap-3.5 font-mono text-[0.78rem] text-muted">
      {entries.map(([label, value, unit]) => (
        <span key={label}>
          <b className="text-ink">{value}{unit}</b> {label}
        </span>
      ))}
    </div>
  );
}
