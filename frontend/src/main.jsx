import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./styles.css";
import Root from "./root.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import Dashboard, { dashboardLoader } from "./pages/Dashboard.jsx";
import Log, { logLoader, logAction } from "./pages/Log.jsx";
import Meals, { mealsLoader, mealsAction } from "./pages/Meals.jsx";
import Recipes, { recipesLoader, recipesAction } from "./pages/Recipes.jsx";
import Shopping, { shoppingLoader, shoppingAction } from "./pages/Shopping.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard />, loader: dashboardLoader },
      { path: "log", element: <Log />, loader: logLoader, action: logAction },
      { path: "meals", element: <Meals />, loader: mealsLoader, action: mealsAction },
      { path: "recipes", element: <Recipes />, loader: recipesLoader, action: recipesAction },
      { path: "shopping", element: <Shopping />, loader: shoppingLoader, action: shoppingAction },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
