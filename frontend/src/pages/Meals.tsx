import { PageHeader } from "@/components/PageHeader";
import { PageError, PageLoading } from "@/components/PageState";
import { MealComposer } from "@/features/meals/MealComposer";
import { MealHistory } from "@/features/meals/MealHistory";
import { useMeals } from "@/lib/queries";

const DAYS = 30;

export default function Meals() {
  const meals = useMeals(DAYS);

  if (meals.isPending) return <PageLoading />;
  if (meals.isError) return <PageError error={meals.error} />;

  return (
    <>
      <PageHeader title="Meals" subtitle="Estimate macros with AI, keep a running food log." />
      <div className="mb-4">
        <MealComposer />
      </div>
      <MealHistory meals={meals.data} />
    </>
  );
}
