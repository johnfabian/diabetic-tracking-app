import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MealComposer } from "@/features/meals/MealComposer";
import type { MealAnalysis } from "@/lib/types";
import { jsonResponse, renderWithProviders } from "./utils";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

const ANALYSIS: MealAnalysis = {
  meal_name: "Eggs & toast",
  items: [{
    name: "eggs", portion: "2 large", calories: 140, carbs_g: 1,
    sugar_g: 0, fiber_g: 0, protein_g: 12, fat_g: 10,
  }],
  calories: 250, carbs_g: 16, sugar_g: 2, fiber_g: 2,
  protein_g: 16, fat_g: 12, glycemic_impact: "moderate",
  tip: "Add fiber to slow the spike.",
};

describe("MealComposer (useActionState)", () => {
  it("requires a description or photo before calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MealComposer />);

    await user.click(screen.getByRole("button", { name: /analyze meal/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/describe the meal or attach a photo/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("analyzes a description and shows the result panel", async () => {
    fetchMock.mockResolvedValue(jsonResponse(ANALYSIS));
    const user = userEvent.setup();
    renderWithProviders(<MealComposer />);

    await user.type(screen.getByLabelText(/description/i), "two eggs and toast");
    await user.click(screen.getByRole("button", { name: /analyze meal/i }));

    expect(await screen.findByText("Eggs & toast")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log this meal/i })).toBeInTheDocument();
    expect(screen.getByText(/add fiber to slow the spike/i)).toBeInTheDocument();
  });

  it("shows AI-unconfigured errors inline instead of crashing", async () => {
    fetchMock.mockResolvedValue(jsonResponse(
      { detail: "Vision provider 'anthropic' is not configured" }, 503,
    ));
    const user = userEvent.setup();
    renderWithProviders(<MealComposer />);

    await user.type(screen.getByLabelText(/description/i), "two eggs");
    await user.click(screen.getByRole("button", { name: /analyze meal/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/not configured/);
  });
});
