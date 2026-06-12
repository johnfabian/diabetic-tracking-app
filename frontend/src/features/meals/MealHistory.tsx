import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ListRow, ListWhen } from "@/components/ListRow";
import { MacroRow } from "@/components/MacroRow";
import { Pill } from "@/components/Pill";
import { fmtTime } from "@/lib/format";
import { useDeleteMeal } from "@/lib/queries";
import type { Meal } from "@/lib/types";

export function MealHistory({ meals }: { meals: Meal[] }) {
  const deleteMeal = useDeleteMeal();

  return (
    <Card title="Meal history" subtitle="Last 30 days.">
      {meals.length === 0 ? (
        <EmptyState>No meals logged yet. Describe your last meal above.</EmptyState>
      ) : (
        <div className="flex flex-col">
          {meals.map((meal) => (
            <ListRow key={meal.id}>
              <ListWhen>{fmtTime(meal.eaten_at)}</ListWhen>
              <div className="min-w-0 flex-1 max-md:order-3 max-md:basis-full">
                <div>{meal.source === "photo" ? "📷 " : ""}{meal.name}</div>
                <MacroRow meal={meal} />
                {meal.tip && <div className="truncate text-[0.78rem] text-faint">💡 {meal.tip}</div>}
              </div>
              {meal.glycemic_impact && <Pill text={meal.glycemic_impact} tone={meal.glycemic_impact} />}
              <Button
                size="sm"
                variant="danger-ghost"
                title="delete"
                className="border-transparent"
                busy={deleteMeal.isPending && deleteMeal.variables === meal.id}
                onClick={() => deleteMeal.mutate(meal.id)}
              >
                ✕
              </Button>
            </ListRow>
          ))}
        </div>
      )}
    </Card>
  );
}
