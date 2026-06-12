import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ManualEntryForm } from "@/features/readings/ManualEntryForm";
import { jsonResponse, renderWithProviders } from "./utils";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(jsonResponse({ id: 1 }, 201));
  vi.stubGlobal("fetch", fetchMock);
});

describe("ManualEntryForm", () => {
  it("prefills the date so the browser never blocks an empty picker", () => {
    renderWithProviders(<ManualEntryForm />);
    const dateInput = screen.getByLabelText<HTMLInputElement>(/when/i);
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("saves a reading with the local wall-clock time (no UTC shift)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManualEntryForm />);

    await user.type(screen.getByLabelText(/glucose/i), "118");
    await user.type(screen.getByLabelText(/note/i), "after lunch");
    await user.click(screen.getByRole("button", { name: /save reading/i }));

    expect(await screen.findByText("✓ saved")).toBeInTheDocument();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/readings");
    const body = JSON.parse(String(init.body));
    expect(body.value_mg_dl).toBe(118);
    expect(body.note).toBe("after lunch");
    expect(body.taken_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/); // local, no Z suffix
  });

  it("validates the glucose range client-side without calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManualEntryForm />);

    await user.type(screen.getByLabelText(/glucose/i), "9000");
    await user.click(screen.getByRole("button", { name: /save reading/i }));

    expect(await screen.findByText(/at most 600/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a glucose value", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManualEntryForm />);

    await user.click(screen.getByRole("button", { name: /save reading/i }));

    expect(await screen.findByText(/enter a glucose value/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows backend errors inline", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "database is offline" }, 500));
    const user = userEvent.setup();
    renderWithProviders(<ManualEntryForm />);

    await user.type(screen.getByLabelText(/glucose/i), "118");
    await user.click(screen.getByRole("button", { name: /save reading/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("database is offline");
  });
});
