import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";

import Splash from "@/pages/Splash";
import { ROUTES } from "@/config/routes";

describe("Splash", () => {
  it("renders the start button pointing at the app", async () => {
    const Stub = createRoutesStub([
      { path: ROUTES.splash, Component: Splash },
      { path: ROUTES.dashboard, Component: () => <h1>dash</h1> },
    ]);
    render(<Stub initialEntries={[ROUTES.splash]} />);

    const start = screen.getByRole("link", { name: /start tracking/i });
    expect(start).toHaveAttribute("href", ROUTES.dashboard);

    await userEvent.click(start);
    expect(await screen.findByText("dash")).toBeInTheDocument();
  });
});
