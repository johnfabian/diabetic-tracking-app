import { useActionState } from "react";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorBox } from "@/components/ErrorBox";
import { Field, Input, Select } from "@/components/Field";
import { errorMessage } from "@/lib/http";
import { useAddShoppingItem } from "@/lib/queries";
import { SHOPPING_CATEGORIES, DEFAULT_CATEGORY } from "./categories";

interface AddState {
  error: string | null;
}

export function ShoppingAddForm() {
  const addItem = useAddShoppingItem();

  const [state, formAction, isPending] = useActionState<AddState, FormData>(
    async (_previous, formData) => {
      const name = String(formData.get("name") ?? "").trim();
      if (!name) return { error: "Name the item first." };
      try {
        await addItem.mutateAsync({
          name,
          quantity: String(formData.get("quantity") ?? "") || null,
          category: String(formData.get("category") ?? DEFAULT_CATEGORY),
        });
        return { error: null }; // uncontrolled form resets via key below
      } catch (error) {
        return { error: errorMessage(error) };
      }
    },
    { error: null },
  );

  return (
    <Card title="Add an item" subtitle="For everything that isn't from a recipe.">
      {/* remount on each successful add to clear the fields */}
      <form action={formAction} key={addItem.isSuccess ? addItem.data.id : "new"}>
        <Field label="Item">
          <Input type="text" name="name" required placeholder="glucose tabs" />
        </Field>
        <Field label="Quantity">
          <Input type="text" name="quantity" placeholder="1 bottle" />
        </Field>
        <Field label="Category">
          <Select name="category" defaultValue={DEFAULT_CATEGORY}>
            {SHOPPING_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="primary" busy={isPending}>
          Add to list
        </Button>
      </form>
      {state.error && <ErrorBox>{state.error}</ErrorBox>}
    </Card>
  );
}
