export function Spinner({ onAccent = false }: { onAccent?: boolean }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={`inline-block size-3.5 animate-spin rounded-full border-2 border-t-transparent ${
        onAccent ? "border-accent-ink border-t-transparent" : "border-accent border-t-transparent"
      }`}
    />
  );
}
