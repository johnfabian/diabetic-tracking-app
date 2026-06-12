import { Card } from "@/components/Card";
import { Input } from "@/components/Field";
import { PillButton } from "@/components/Pill";

export function RecipeFilterBar({
  q,
  tag,
  tags,
  onSearch,
  onTagToggle,
}: {
  q: string;
  tag: string;
  tags: string[];
  onSearch: (q: string) => void;
  onTagToggle: (tag: string) => void;
}) {
  return (
    <Card className="mb-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Input
          type="search"
          value={q}
          placeholder="search title or ingredient…"
          aria-label="search recipes"
          className="max-w-xs"
          onChange={(e) => onSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <PillButton key={t} text={t} active={tag === t} onClick={() => onTagToggle(t)} />
          ))}
        </div>
      </div>
    </Card>
  );
}
