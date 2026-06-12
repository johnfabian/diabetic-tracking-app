import { Pill } from "@/components/Pill";
import { parseJsonColumn, type Recipe, type RecipeIngredient } from "@/lib/types";

export function RecipeCard({
  recipe,
  selected,
  onToggle,
}: {
  recipe: Recipe;
  selected: boolean;
  onToggle: () => void;
}) {
  const ingredients = parseJsonColumn<RecipeIngredient>(recipe.ingredients);
  const instructions = parseJsonColumn<string>(recipe.instructions);

  return (
    <div
      className={`relative flex flex-col gap-2.5 rounded-xl border bg-surface px-5 py-4 ${
        selected ? "border-accent shadow-[0_0_0_1px_var(--color-accent)] shadow-raised" : "border-line"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        title="add to shopping list"
        className="absolute top-3.5 right-3.5 size-5 cursor-pointer accent-accent"
      />
      <h3 className="pr-7 text-[0.95rem]">{recipe.title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {recipe.tags.map((tag) => <Pill key={tag} text={tag} />)}
      </div>
      <p className="m-0 text-[0.84rem] text-muted">{recipe.description}</p>
      <div className="flex gap-3.5 font-mono text-[0.72rem] text-muted">
        <span>⏱ {recipe.prep_minutes} min</span>
        <span>🍽 {recipe.servings} servings</span>
      </div>
      <div className="flex flex-wrap gap-3.5 font-mono text-[0.78rem] text-muted">
        <span><b className="text-ink">{Math.round(recipe.calories)}</b> cal</span>
        <span><b className="text-ink">{recipe.carbs_g}g</b> carbs</span>
        <span><b className="text-ink">{recipe.fiber_g}g</b> fiber</span>
        <span><b className="text-ink">{recipe.protein_g}g</b> protein</span>
        <span><b className="text-ink">{recipe.fat_g}g</b> fat</span>
      </div>
      <details className="text-[0.82rem]">
        <summary className="cursor-pointer text-[0.78rem] font-semibold text-muted">
          Ingredients & steps
        </summary>
        <ul className="mt-2 list-disc pl-4.5 text-muted">
          {ingredients.map((ingredient, i) => (
            <li key={i}>
              <span className="font-mono">{ingredient.qty}</span> {ingredient.name}
            </li>
          ))}
        </ul>
        <ol className="mt-2 list-decimal pl-4.5 text-muted">
          {instructions.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </details>
    </div>
  );
}
