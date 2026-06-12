import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <h1 className="text-[1.7rem] max-md:text-[1.45rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-[0.9rem] text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
