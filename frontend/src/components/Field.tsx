import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const inputClasses =
  "w-full rounded-lg border border-line-strong bg-bg px-2.5 py-2 font-mono text-[0.9rem] text-ink " +
  "outline-none focus:border-accent aria-invalid:border-danger";

/** Label + control wrapper. Pass the control as children (works with
 *  react-hook-form's register spread or plain props). */
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-3 block text-[0.78rem] font-semibold text-muted">
      <span className="mb-1.5 block text-[0.67rem] tracking-wider uppercase">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[0.72rem] font-normal text-danger">{error}</span>}
    </label>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClasses} ${className}`} {...rest} />;
}

export function Select({ className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${inputClasses} ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${inputClasses} min-h-[74px] resize-y font-display ${className}`}
      {...rest}
    />
  );
}
