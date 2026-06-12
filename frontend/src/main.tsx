import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";
import { ROUTES } from "./config/routes";
import { AppShell } from "./components/AppShell";
import ErrorPage from "./pages/ErrorPage";
import Splash from "./pages/Splash";
import Dashboard from "./pages/Dashboard";
import Log from "./pages/Log";
import Meals from "./pages/Meals";
import Recipes from "./pages/Recipes";
import Shopping from "./pages/Shopping";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000, // page revisits within 15s serve cache, then refetch
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  { path: ROUTES.splash, element: <Splash />, errorElement: <ErrorPage /> },
  {
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      { path: ROUTES.dashboard, element: <Dashboard /> },
      { path: ROUTES.log, element: <Log /> },
      { path: ROUTES.meals, element: <Meals /> },
      { path: ROUTES.recipes, element: <Recipes /> },
      { path: ROUTES.shopping, element: <Shopping /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
