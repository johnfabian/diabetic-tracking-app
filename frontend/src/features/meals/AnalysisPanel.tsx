import { Button } from "@/components/Button";
import { ErrorBox } from "@/components/ErrorBox";
import { Pill } from "@/components/Pill";
import { errorMessage } from "@/lib/http";
import { useSaveMeal } from "@/lib/queries";
import type { MealAnalysis } from "@/lib/types";

const HEADERS = ["item", "portion", "cal", "carbs", "sugar", "fiber", "protein", "fat"] as const;

export function AnalysisPanel({
  analysis,
  source,
  onDiscard,
}: {
  analysis: MealAnalysis;
  source: string;
  onDiscard: () => void;
}) {
  const saveMeal = useSaveMeal();
  if (saveMeal.isSuccess) return null;

  return (
    <div className="mt-4 rounded-xl border border-dashed border-accent bg-accent/5 px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-2.5">
        <h3 className="text-[0.95rem]">{analysis.meal_name}</h3>
        <Pill text={`${analysis.glycemic_impact} glycemic impact`} tone={analysis.glycemic_impact} />
      </div>

      <div className="overflow-x-auto">
        <table className="my-2.5 w-full min-w-[520px] border-collapse text-[0.82rem]">
          <thead>
            <tr>
              {HEADERS.map((h) => (
                <th key={h} className="border-b border-line py-1 pr-2 text-left text-[0.66rem]
                  tracking-wider text-muted uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysis.items.map((item, i) => (
              <tr key={i}>
                <td className="border-b border-dashed border-line py-1.5 pr-2">{item.name}</td>
                {[item.portion, Math.round(item.calories), `${item.carbs_g}g`, `${item.sugar_g}g`,
                  `${item.fiber_g}g`, `${item.protein_g}g`, `${item.fat_g}g`].map((cell, j) => (
                  <td key={j} className="border-b border-dashed border-line py-1.5 pr-2 font-mono text-[0.78rem]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-1.5 pr-2">total</td>
              <td />
              {[Math.round(analysis.calories), `${Math.round(analysis.carbs_g)}g`,
                `${Math.round(analysis.sugar_g)}g`, `${Math.round(analysis.fiber_g)}g`,
                `${Math.round(analysis.protein_g)}g`, `${Math.round(analysis.fat_g)}g`].map((cell, j) => (
                <td key={j} className="py-1.5 pr-2 font-mono text-[0.78rem]">{cell}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[0.85rem] text-accent">💡 {analysis.tip}</p>

      <div className="mt-2.5 flex gap-2.5">
        <Button
          variant="primary"
          busy={saveMeal.isPending}
          onClick={() => saveMeal.mutate({ analysis, source })}
        >
          Log this meal
        </Button>
        <Button variant="ghost" onClick={onDiscard}>Discard</Button>
      </div>

      {saveMeal.isError && <ErrorBox>{errorMessage(saveMeal.error)}</ErrorBox>}
    </div>
  );
}
