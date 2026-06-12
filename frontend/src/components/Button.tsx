import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "default" | "ghost" | "danger-ghost";
type Size = "md" | "sm";

const base =
  "inline-flex cursor-pointer items-center gap-2 rounded-[9px] border font-bold transition-[transform,box-shadow] duration-75 " +
  "hover:-translate-x-px hover:-translate-y-px hover:shadow-raised-sm active:translate-0 active:shadow-none " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-0";

const variants: Record<Variant, string> = {
  primary: "border-accent bg-accent text-accent-ink",
  default: "border-line-strong bg-surface-2 text-ink",
  ghost: "border-line-strong bg-transparent text-ink",
  "danger-ghost": "border-danger bg-transparent text-danger",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2 text-[0.88rem]",
  sm: "px-2.5 py-1 text-[0.76rem]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  busy?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "default",
  size = "md",
  busy = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || busy}
      {...rest}
    >
      {busy && <Spinner onAccent={variant === "primary"} />}
      {children}
    </button>
  );
}
