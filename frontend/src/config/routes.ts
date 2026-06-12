/** App route paths — referenced by the router, links and nav. */
export const ROUTES = {
  splash: "/",
  dashboard: "/dashboard",
  log: "/log",
  meals: "/meals",
  recipes: "/recipes",
  shopping: "/shopping",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
