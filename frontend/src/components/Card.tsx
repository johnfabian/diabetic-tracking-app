import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function Card({ raised = false, title, subtitle, children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface px-5 py-4 max-md:px-3.5 ${
        raised ? "shadow-raised" : ""
      } ${className}`}
      {...rest}
    >
      {title && <h2 className="mb-1 text-[1.15rem]">{title}</h2>}
      {subtitle && <p className="mb-3.5 text-[0.8rem] text-muted">{subtitle}</p>}
      {children}
    </div>
  );
}
