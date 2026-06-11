import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v4h8V3zM3 17v4h8v-4z" />
    </svg>
  ),
  log: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2c-4 5.5-6 8.6-6 11.5A6 6 0 0 0 18 13.5C18 10.6 16 7.5 12 2z" />
    </svg>
  ),
  meals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 3v7a2 2 0 0 0 2 2v9M8 3v7M6 3v7M16 3c-1.5 1.5-2 4-2 6 0 2 1 3 2 3v9M16 3c1.5 1.5 2 4 2 6 0 2-1 3-2 3" />
    </svg>
  ),
  recipes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </svg>
  ),
  shopping: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1.5" /><circle cx="18" cy="21" r="1.5" />
      <path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  ),
};

export default function Root() {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">GL</div>
          <div>
            <div className="brand-name">GlucoLog</div>
            <div className="brand-sub">field lab no. 1</div>
          </div>
        </div>
        <NavLink to="/" end className="nav-link">{icons.dashboard} Dashboard</NavLink>
        <NavLink to="/log" className="nav-link">{icons.log} Glucose Log</NavLink>
        <NavLink to="/meals" className="nav-link">{icons.meals} Meals</NavLink>
        <NavLink to="/recipes" className="nav-link">{icons.recipes} Recipes</NavLink>
        <NavLink to="/shopping" className="nav-link">{icons.shopping} Shopping List</NavLink>
        <div className="sidebar-foot">
          <div>
            <span className={`dot ${health?.ok ? "ok" : "bad"}`} />
            api {health?.ok ? "connected" : "offline"}
          </div>
          <div title={health?.vision_model ?? ""}>
            <span className={`dot ${health?.ai_configured ? "ok" : "bad"}`} />
            vision {health?.ai_configured ? `ready · ${health.vision_provider}` : "not configured"}
          </div>
          <div style={{ marginTop: 8 }}>
            Not medical advice. Always confirm readings with your meter.
          </div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
