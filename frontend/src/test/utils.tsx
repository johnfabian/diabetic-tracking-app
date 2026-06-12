import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createRoutesStub } from "react-router";

/** Render under a fresh QueryClient (retries off) and a minimal router. */
export function renderWithProviders(ui: ReactElement, { path = "/" } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Stub = createRoutesStub([{ path, Component: () => ui }]);
  return render(
    <QueryClientProvider client={queryClient}>
      <Stub initialEntries={[path]} />
    </QueryClientProvider>,
  );
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
