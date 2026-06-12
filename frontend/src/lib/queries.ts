/** TanStack Query hooks — the only data-access layer the UI uses. */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { endpoints, queryKeys } from "@/config/api";
import { http } from "./http";
import type {
  Health,
  Meal,
  MealAnalysis,
  NewReading,
  NewShoppingItem,
  PhotoReadingResult,
  Reading,
  Recipe,
  ShoppingItem,
  StatsSeries,
  StatsSummary,
} from "./types";

// ── queries ─────────────────────────────────────────────────────────

export const useHealth = () =>
  useQuery({
    queryKey: queryKeys.health,
    queryFn: () => http.get<Health>(endpoints.health()),
    staleTime: 60_000,
  });

export const useReadings = (days: number) =>
  useQuery({
    queryKey: queryKeys.readings.list(days),
    queryFn: () => http.get<Reading[]>(endpoints.readings({ days })),
  });

export const useStatsSummary = (days: number) =>
  useQuery({
    queryKey: queryKeys.stats.summary(days),
    queryFn: () => http.get<StatsSummary>(endpoints.statsSummary(days)),
  });

export const useStatsSeries = (days: number) =>
  useQuery({
    queryKey: queryKeys.stats.series(days),
    queryFn: () => http.get<StatsSeries>(endpoints.statsSeries(days)),
  });

export const useMeals = (days: number, limit?: number) =>
  useQuery({
    queryKey: queryKeys.meals.list(days, limit),
    queryFn: () => http.get<Meal[]>(endpoints.meals({ days, limit })),
  });

export const useRecipes = (q: string, tag: string) =>
  useQuery({
    queryKey: queryKeys.recipes.list(q, tag),
    queryFn: () => http.get<Recipe[]>(endpoints.recipes({ q: q || undefined, tag: tag || undefined })),
    placeholderData: (previous) => previous, // keep the grid while a search refines
  });

export const useRecipeTags = () =>
  useQuery({
    queryKey: queryKeys.recipes.tags,
    queryFn: () => http.get<string[]>(endpoints.recipeTags()),
    staleTime: Infinity, // tags only change when the seed data does
  });

export const useShoppingItems = () =>
  useQuery({
    queryKey: queryKeys.shopping.all,
    queryFn: () => http.get<ShoppingItem[]>(endpoints.shopping()),
  });

// ── mutations ───────────────────────────────────────────────────────

/** Readings affect every stats view; invalidate both domains at once. */
function useInvalidate(...domains: readonly (readonly string[])[]) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(domains.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useCreateReading(
  options?: Pick<UseMutationOptions<Reading, Error, NewReading>, "onSuccess">,
) {
  const invalidate = useInvalidate(queryKeys.readings.all, queryKeys.stats.all);
  return useMutation({
    mutationFn: (reading: NewReading) => http.post<Reading>(endpoints.readings(), reading),
    onSuccess: async (...args) => {
      await invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteReading() {
  const invalidate = useInvalidate(queryKeys.readings.all, queryKeys.stats.all);
  return useMutation({
    mutationFn: (id: number) => http.delete(endpoints.reading(id)),
    onSuccess: invalidate,
  });
}

export function useReadingFromPhoto() {
  const invalidate = useInvalidate(queryKeys.readings.all, queryKeys.stats.all);
  return useMutation({
    mutationFn: (photo: File) => {
      const form = new FormData();
      form.append("photo", photo);
      return http.postForm<PhotoReadingResult>(endpoints.readingFromPhoto(), form);
    },
    onSuccess: invalidate,
  });
}

export function useAnalyzeMeal() {
  return useMutation({
    mutationFn: ({ description, photo }: { description?: string; photo?: File }) => {
      const form = new FormData();
      if (description) form.append("description", description);
      if (photo) form.append("photo", photo);
      return http.postForm<MealAnalysis>(endpoints.mealAnalyze(), form);
    },
  });
}

export function useSaveMeal() {
  const invalidate = useInvalidate(queryKeys.meals.all, queryKeys.stats.all);
  return useMutation({
    mutationFn: ({ analysis, source }: { analysis: MealAnalysis; source: string }) =>
      http.post<Meal>(endpoints.meals(), {
        name: analysis.meal_name,
        source,
        calories: analysis.calories,
        carbs_g: analysis.carbs_g,
        sugar_g: analysis.sugar_g,
        fiber_g: analysis.fiber_g,
        protein_g: analysis.protein_g,
        fat_g: analysis.fat_g,
        glycemic_impact: analysis.glycemic_impact,
        tip: analysis.tip,
        items: analysis.items,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteMeal() {
  const invalidate = useInvalidate(queryKeys.meals.all, queryKeys.stats.all);
  return useMutation({
    mutationFn: (id: number) => http.delete(endpoints.meal(id)),
    onSuccess: invalidate,
  });
}

export function useAddShoppingItem() {
  const invalidate = useInvalidate(queryKeys.shopping.all);
  return useMutation({
    mutationFn: (item: NewShoppingItem) => http.post<ShoppingItem>(endpoints.shopping(), item),
    onSuccess: invalidate,
  });
}

export function useToggleShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checked }: { id: number; checked: boolean }) =>
      http.patch<ShoppingItem>(endpoints.shoppingItem(id), { checked }),
    // optimistic: flip the checkbox immediately, roll back on error
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.shopping.all });
      const previous = queryClient.getQueryData<ShoppingItem[]>(queryKeys.shopping.all);
      queryClient.setQueryData<ShoppingItem[]>(queryKeys.shopping.all, (items) =>
        items?.map((item) => (item.id === id ? { ...item, checked } : item)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.shopping.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.shopping.all }),
  });
}

export function useDeleteShoppingItem() {
  const invalidate = useInvalidate(queryKeys.shopping.all);
  return useMutation({
    mutationFn: (id: number) => http.delete(endpoints.shoppingItem(id)),
    onSuccess: invalidate,
  });
}

export function useClearCheckedItems() {
  const invalidate = useInvalidate(queryKeys.shopping.all);
  return useMutation({
    mutationFn: () => http.delete(endpoints.shopping()),
    onSuccess: invalidate,
  });
}

export function useBuildShoppingList() {
  const invalidate = useInvalidate(queryKeys.shopping.all);
  return useMutation({
    mutationFn: (recipeIds: number[]) =>
      http.post<{ added: number }>(endpoints.shoppingFromRecipes(), { recipe_ids: recipeIds }),
    onSuccess: invalidate,
  });
}
