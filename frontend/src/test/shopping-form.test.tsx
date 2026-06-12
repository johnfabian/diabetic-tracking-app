import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShoppingAddForm } from "@/features/shopping/ShoppingAddForm";
import { jsonResponse, renderWithProviders } from "./utils";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(jsonResponse({ id: 5, checked: false }, 201));
  vi.stubGlobal("fetch", fetchMock);
});

describe("ShoppingAddForm (useActionState)", () => {
  it("adds an item with defaults applied", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShoppingAddForm />);

    await user.type(screen.getByLabelText(/item/i), "glucose tabs");
    await user.click(screen.getByRole("button", { name: /add to list/i }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([url]) => url === "/api/shopping");
      expect(post).toBeTruthy();
      expect(JSON.parse(String((post![1] as RequestInit).body))).toEqual({
        name: "glucose tabs",
        quantity: null,
        category: "Pantry",
      });
    });
  });

  it("clears the fields after a successful add", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShoppingAddForm />);

    await user.type(screen.getByLabelText(/item/i), "glucose tabs");
    await user.click(screen.getByRole("button", { name: /add to list/i }));

    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>(/item/i).value).toBe(""),
    );
  });

  it("surfaces backend errors", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "nope" }, 500));
    const user = userEvent.setup();
    renderWithProviders(<ShoppingAddForm />);

    await user.type(screen.getByLabelText(/item/i), "glucose tabs");
    await user.click(screen.getByRole("button", { name: /add to list/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("nope");
  });
});
