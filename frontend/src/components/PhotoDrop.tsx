import { useRef, type ReactNode } from "react";

/** Dashed tap-to-pick photo area with hidden file input and preview. */
export function PhotoDrop({
  name,
  preview,
  disabled = false,
  onPick,
  children,
  className = "",
}: {
  name?: string;
  preview: string | null;
  disabled?: boolean;
  onPick: (file: File | null) => void;
  children: ReactNode;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div
        role="button"
        aria-label="choose a photo"
        className={`cursor-pointer rounded-xl border-2 border-dashed border-line-strong p-5 text-center
          text-[0.86rem] text-muted transition-colors hover:border-accent hover:text-ink ${className}`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {preview && (
          <img src={preview} alt="preview" className="mx-auto mb-2 block max-h-[220px] max-w-full rounded-lg" />
        )}
        {children}
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </>
  );
}
