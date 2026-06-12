import { Link } from "react-router";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/config/routes";
import { useDeleteShoppingItem, useToggleShoppingItem } from "@/lib/queries";
import type { ShoppingItem } from "@/lib/types";
import { OTHER_CATEGORY, SHOPPING_CATEGORIES } from "./categories";

function Item({ item }: { item: ShoppingItem }) {
  const toggle = useToggleShoppingItem();
  const remove = useDeleteShoppingItem();

  return (
    <div className="flex items-center gap-[11px] border-b border-dashed border-line px-0.5 py-1.5 last:border-b-0">
      <input
        type="checkbox"
        checked={item.checked}
        aria-label={`got ${item.name}`}
        className="size-[17px] cursor-pointer accent-accent"
        onChange={(e) => toggle.mutate({ id: item.id, checked: e.target.checked })}
      />
      <span className={`flex-1 ${item.checked ? "text-faint line-through" : ""}`}>{item.name}</span>
      {item.quantity && <span className="font-mono text-[0.74rem] text-muted">{item.quantity}</span>}
      {item.recipe_title && <span className="text-[0.66rem] text-faint">{item.recipe_title}</span>}
      <Button
        size="sm"
        variant="danger-ghost"
        title="remove"
        className="border-transparent"
        busy={remove.isPending && remove.variables === item.id}
        onClick={() => remove.mutate(item.id)}
      >
        ✕
      </Button>
    </div>
  );
}

export function ShoppingListPanel({ items }: { items: ShoppingItem[] }) {
  const groups = [
    ...SHOPPING_CATEGORIES.map((category) => ({
      category,
      rows: items.filter((item) => item.category === category),
    })),
    {
      category: OTHER_CATEGORY,
      rows: items.filter(
        (item) => !(SHOPPING_CATEGORIES as readonly string[]).includes(item.category),
      ),
    },
  ].filter((group) => group.rows.length > 0);

  return (
    <Card raised>
      {groups.length === 0 ? (
        <EmptyState>
          Nothing here yet.{" "}
          <Link to={ROUTES.recipes} className="text-ink underline">Pick some recipes</Link> and hit
          “Build shopping list”, or add items by hand →
        </EmptyState>
      ) : (
        groups.map((group) => (
          <div key={group.category} className="mb-4 last:mb-0">
            <h3 className="mb-1.5 text-[0.7rem] tracking-[0.14em] text-accent uppercase">
              {group.category}
            </h3>
            {group.rows.map((item) => (
              <Item item={item} key={item.id} />
            ))}
          </div>
        ))
      )}
    </Card>
  );
}
