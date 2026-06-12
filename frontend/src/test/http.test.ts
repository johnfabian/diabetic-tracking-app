import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, errorMessage, http } from "@/lib/http";
import { endpoints } from "@/config/api";
import { jsonResponse } from "./utils";

afterEach(() => vi.unstubAllGlobals());

describe("http error handling", () => {
  it("flattens FastAPI validation-error arrays into readable text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(
      { detail: [{ loc: ["body", "taken_at"], msg: "Input should be a valid datetime" }] },
      422,
    )));

    const error = await http.post(endpoints.readings(), {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect(errorMessage(error)).toBe("taken_at: Input should be a valid datetime");
  });

  it("passes plain string details through", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Item not found" }, 404)));
    const error = await http.get(endpoints.shoppingItem(1)).catch((e: unknown) => e);
    expect(errorMessage(error)).toBe("Item not found");
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(http.delete(endpoints.reading(1))).resolves.toBeUndefined();
  });
});

describe("endpoints", () => {
  it("builds query strings without magic strings at call sites", () => {
    expect(endpoints.readings({ days: 30 })).toBe("/api/readings?days=30");
    expect(endpoints.statsSummary(14)).toBe("/api/stats/summary?days=14");
    expect(endpoints.recipes({ q: "soup", tag: "lunch" })).toBe("/api/recipes?q=soup&tag=lunch");
    expect(endpoints.recipes()).toBe("/api/recipes");
    expect(endpoints.shoppingItem(7)).toBe("/api/shopping/7");
  });
});
