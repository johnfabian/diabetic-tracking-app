/** Domain types mirroring the FastAPI response models. */

export type GlucoseTone = "low" | "ok" | "high";
export type GlycemicImpact = "low" | "moderate" | "high";
export type ReadingSource = "manual" | "photo";

export interface TargetRange {
  low: number;
  high: number;
}

export interface Reading {
  id: number;
  value_mg_dl: number;
  taken_at: string;
  source: ReadingSource;
  note: string | null;
  created_at: string;
}

export interface NewReading {
  value_mg_dl: number;
  taken_at: string | null;
  note: string | null;
}

export interface StatsSummary {
  count: number;
  avg_mg_dl: number | null;
  est_a1c: number | null;
  time_in_range_pct: number | null;
  low_pct: number | null;
  high_pct: number | null;
  latest: Reading | null;
  week_delta: number | null;
  target: TargetRange;
}

export interface DailyAggregate {
  day: string;
  avg: number;
  min: number;
  max: number;
  n: number;
}

export interface DailyMacros {
  day: string;
  carbs_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  sugar_g: number | null;
  fiber_g: number | null;
}

export interface StatsSeries {
  readings: Pick<Reading, "value_mg_dl" | "taken_at">[];
  daily: DailyAggregate[];
  macros: DailyMacros[];
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  carbs_g: number;
  sugar_g: number;
  fiber_g: number;
  protein_g: number;
  fat_g: number;
}

export interface MealAnalysis {
  meal_name: string;
  items: FoodItem[];
  calories: number;
  carbs_g: number;
  sugar_g: number;
  fiber_g: number;
  protein_g: number;
  fat_g: number;
  glycemic_impact: GlycemicImpact;
  tip: string;
}

export interface Meal {
  id: number;
  name: string;
  eaten_at: string;
  source: string;
  calories: number | null;
  carbs_g: number | null;
  sugar_g: number | null;
  fiber_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  glycemic_impact: GlycemicImpact | null;
  tip: string | null;
  items: FoodItem[] | string;
  created_at: string;
}

export interface GlucometerParse {
  value: number | null;
  unit: "mg/dL" | "mmol/L" | null;
  display_date: string | null;
  display_time: string | null;
  iso_datetime: string | null;
  confidence: "high" | "medium" | "low";
  notes: string | null;
}

export interface PhotoReadingResult {
  saved: Reading | null;
  parsed: GlucometerParse;
}

export interface RecipeIngredient {
  name: string;
  qty: string;
  category?: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  tags: string[];
  servings: number;
  prep_minutes: number;
  calories: number;
  carbs_g: number;
  fiber_g: number;
  protein_g: number;
  fat_g: number;
  ingredients: RecipeIngredient[] | string;
  instructions: string[] | string;
}

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: string | null;
  category: string;
  checked: boolean;
  recipe_title: string | null;
  created_at: string;
}

export interface NewShoppingItem {
  name: string;
  quantity: string | null;
  category: string;
}

export interface Health {
  ok: boolean;
  ai_configured: boolean;
  vision_provider: string;
  vision_model: string;
  vision_detail: string | null;
  db_pooled: boolean;
}

/** JSONB columns arrive as strings from PGlite; parse once at the edge. */
export function parseJsonColumn<T>(value: T[] | string): T[] {
  return typeof value === "string" ? (JSON.parse(value) as T[]) : value;
}
