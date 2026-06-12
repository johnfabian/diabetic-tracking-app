import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PageError, PageLoading } from "@/components/PageState";
import { ROUTES } from "@/config/routes";
import { RecipeCard } from "@/features/recipes/RecipeCard";
import { RecipeFilterBar } from "@/features/recipes/RecipeFilterBar";
import { useBuildShoppingList, useRecipeTags, useRecipes } from "@/lib/queries";

export default function Recipes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";

  const recipes = useRecipes(q, tag);
  const tags = useRecipeTags();
  const buildList = useBuildShoppingList();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());

  function updateParams(next: { q?: string; tag?: string }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextTag = next.tag ?? tag;
    if (nextQ) params.set("q", nextQ);
    if (nextTag) params.set("tag", nextTag);
    setSearchParams(params, { replace: true });
  }

  function toggleRecipe(id: number) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (recipes.isPending) return <PageLoading />;
  if (recipes.isError) return <PageError error={recipes.error} />;

  return (
    <>
      <PageHeader
        title="Recipes"
        subtitle="Diabetic-friendly, macro-counted. Pick a few and build a shopping list."
      />

      <RecipeFilterBar
        q={q}
        tag={tag}
        tags={tags.data ?? []}
        onSearch={(value) => updateParams({ q: value })}
        onTagToggle={(value) => updateParams({ tag: tag === value ? "" : value })}
      />

      {recipes.data.length === 0 ? (
        <EmptyState>No recipes match that search.</EmptyState>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
          {recipes.data.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              selected={selected.has(recipe.id)}
              onToggle={() => toggleRecipe(recipe.id)}
            />
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="sticky bottom-4 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl
          border border-accent bg-surface-2 px-4 py-3 shadow-raised max-md:bottom-[84px]">
          <span>
            <b className="font-mono">{selected.size}</b> recipe{selected.size > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="primary"
            busy={buildList.isPending}
            onClick={() =>
              buildList.mutate([...selected], { onSuccess: () => navigate(ROUTES.shopping) })
            }
          >
            🛒 Build shopping list
          </Button>
        </div>
      )}
    </>
  );
}
