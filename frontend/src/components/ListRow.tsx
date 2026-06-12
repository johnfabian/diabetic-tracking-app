import type { ReactNode } from "react";

/** Dashed-divider row used by history lists and the shopping list. */
export function ListRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 border-b border-dashed border-line px-1 py-2.5 last:border-b-0 max-md:flex-wrap max-md:gap-x-2.5 max-md:gap-y-2">
      {children}
    </div>
  );
}

export function ListWhen({ children }: { children: ReactNode }) {
  return (
    <span className="w-[122px] shrink-0 font-mono text-[0.74rem] text-muted max-md:w-auto">
      {children}
    </span>
  );
}
