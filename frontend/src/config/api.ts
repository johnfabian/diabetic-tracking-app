/** Single source of truth for every backend URL and React Query cache key.
 *  Nothing outside this file builds an /api/... string. */

/** Empty in dev (the Vite proxy forwards /api); set VITE_API_BASE_URL when
 *  the frontend is served from a different origin than the API. */
export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "";

function url(path: string, params?: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const query = qs.size ? `?${qs}` : "";
  return `${API_BASE}${path}${query}`;
}

export const endpoints = {
  health: () => url("/api/health"),

  readings: (opts?: { days?: number; limit?: number }) => url("/api/readings", opts),
  reading: (id: number) => url(`/api/readings/${id}`),
  readingFromPhoto: () => url("/api/readings/photo"),

  meals: (opts?: { days?: number; limit?: number }) => url("/api/meals", opts),
  meal: (id: number) => url(`/api/meals/${id}`),
  mealAnalyze: () => url("/api/meals/analyze"),

  statsSummary: (days: number) => url("/api/stats/summary", { days }),
  statsSeries: (days: number) => url("/api/stats/series", { days }),

  recipes: (opts?: { q?: string; tag?: string }) => url("/api/recipes", opts),
  recipeTags: () => url("/api/recipes/tags"),

  shopping: () => url("/api/shopping"),
  shoppingItem: (id: number) => url(`/api/shopping/${id}`),
  shoppingFromRecipes: () => url("/api/shopping/from-recipes"),
} as const;

/** React Query cache keys — keep hierarchical so invalidation can target a
 *  whole domain (e.g. everything under ["readings"]). */
export const queryKeys = {
  health: ["health"] as const,
  readings: { all: ["readings"] as const, list: (days: number) => ["readings", { days }] as const },
  meals: { all: ["meals"] as const, list: (days: number, limit?: number) => ["meals", { days, limit }] as const },
  stats: {
    all: ["stats"] as const,
    summary: (days: number) => ["stats", "summary", { days }] as const,
    series: (days: number) => ["stats", "series", { days }] as const,
  },
  recipes: {
    all: ["recipes"] as const,
    list: (q: string, tag: string) => ["recipes", { q, tag }] as const,
    tags: ["recipes", "tags"] as const,
  },
  shopping: { all: ["shopping"] as const },
} as const;
