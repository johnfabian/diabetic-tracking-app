import type { ReactNode } from "react";

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="my-2.5 rounded-[9px] border border-danger bg-danger/5 px-3.5 py-2.5 text-[0.84rem] text-danger"
    >
      {children}
    </div>
  );
}
