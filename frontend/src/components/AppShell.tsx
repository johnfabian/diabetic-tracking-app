import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";

import { ROUTES } from "@/config/routes";
import { useHealth } from "@/lib/queries";

function Icon({ d, extra }: { d: string; extra?: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="size-[17px] shrink-0 max-md:size-5">
      {extra}
      <path d={d} />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: <Icon d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v4h8V3zM3 17v4h8v-4z" /> },
  { to: ROUTES.log, label: "Log", icon: <Icon d="M12 2c-4 5.5-6 8.6-6 11.5A6 6 0 0 0 18 13.5C18 10.6 16 7.5 12 2z" /> },
  { to: ROUTES.meals, label: "Meals", icon: <Icon d="M4 3v7a2 2 0 0 0 2 2v9M8 3v7M6 3v7M16 3c-1.5 1.5-2 4-2 6 0 2 1 3 2 3v9M16 3c1.5 1.5 2 4 2 6 0 2-1 3-2 3" /> },
  { to: ROUTES.recipes, label: "Recipes", icon: <Icon d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /> },
  {
    to: ROUTES.shopping,
    label: "Shopping",
    icon: (
      <Icon
        d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"
        extra={<><circle cx="9" cy="21" r="1.5" /><circle cx="18" cy="21" r="1.5" /></>}
      />
    ),
  },
];

function HealthDot({ ok }: { ok: boolean }) {
  return (
    <span className={`mr-1.5 inline-block size-[7px] rounded-full ${ok ? "bg-ok" : "bg-danger"}`} />
  );
}

function Brand() {
  return (
    <Link to={ROUTES.splash} title="back to the welcome page"
      className="flex items-center gap-2.5 px-2.5 pb-4 no-underline max-md:p-0">
      <div className="grid size-[34px] place-items-center rounded-[9px] bg-accent font-mono text-[15px]
        font-bold text-accent-ink shadow-raised">
        GL
      </div>
      <div>
        <div className="text-[1.05rem] leading-tight font-extrabold">GlucoLog</div>
        <div className="text-[0.66rem] tracking-[0.14em] text-muted uppercase">field lab no. 1</div>
      </div>
    </Link>
  );
}

/** Desktop: sticky sidebar. Mobile: top brand bar + fixed bottom tab nav. */
export function AppShell() {
  const { data: health } = useHealth();

  return (
    <div className="grid min-h-dvh grid-cols-[218px_minmax(0,1fr)] max-md:grid-cols-1">
      <aside className="sticky top-0 flex h-dvh flex-col border-r border-line bg-surface p-3.5 pt-5
        max-md:static max-md:h-auto max-md:flex-row max-md:items-center max-md:justify-between
        max-md:border-r-0 max-md:border-b max-md:px-3.5 max-md:py-2.5">
        <Brand />

        <nav className="flex flex-col gap-1 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50
          max-md:flex-row max-md:border-t max-md:border-line max-md:bg-surface max-md:px-2 max-md:pt-1.5
          max-md:pb-[max(6px,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                "flex items-center gap-[11px] rounded-[9px] border border-transparent px-3 py-2.5 " +
                "text-[0.92rem] font-semibold no-underline transition-colors " +
                "max-md:flex-1 max-md:flex-col max-md:gap-1 max-md:px-0.5 max-md:py-1.5 max-md:text-center max-md:text-[0.62rem] " +
                (isActive
                  ? "border-line-strong bg-surface-2 text-ink shadow-[inset_3px_0_0_var(--color-accent)] max-md:border-transparent max-md:shadow-[inset_0_3px_0_var(--color-accent)]"
                  : "text-muted hover:bg-surface-2 hover:text-ink")
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-3 py-2.5 text-[0.7rem] leading-relaxed text-faint max-md:hidden">
          <div>
            <HealthDot ok={Boolean(health?.ok)} />
            api {health?.ok ? "connected" : "offline"}
          </div>
          <div title={health?.vision_model ?? ""}>
            <HealthDot ok={Boolean(health?.ai_configured)} />
            vision {health?.ai_configured ? `ready · ${health.vision_provider}` : "not configured"}
          </div>
          <div className="mt-2">Not medical advice. Always confirm readings with your meter.</div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-[1180px] min-w-0 px-8 pt-7 pb-16 max-lg:px-5
        max-md:px-3.5 max-md:pt-4 max-md:pb-24">
        <Outlet />
      </main>
    </div>
  );
}
