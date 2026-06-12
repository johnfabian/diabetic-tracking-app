import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-2.5 py-8 text-center text-[0.88rem] text-faint">{children}</p>;
}
