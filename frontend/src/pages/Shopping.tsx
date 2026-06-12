import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { PageError, PageLoading } from "@/components/PageState";
import { ShoppingAddForm } from "@/features/shopping/ShoppingAddForm";
import { ShoppingListPanel } from "@/features/shopping/ShoppingListPanel";
import { useClearCheckedItems, useShoppingItems } from "@/lib/queries";

export default function Shopping() {
  const items = useShoppingItems();
  const clearChecked = useClearCheckedItems();

  if (items.isPending) return <PageLoading />;
  if (items.isError) return <PageError error={items.error} />;

  const doneCount = items.data.filter((item) => item.checked).length;

  return (
    <>
      <PageHeader
        title="Shopping List"
        subtitle={
          items.data.length
            ? `${items.data.length - doneCount} to get · ${doneCount} in the cart`
            : "Empty — build one from the recipes page."
        }
        actions={
          doneCount > 0 && (
            <Button size="sm" busy={clearChecked.isPending} onClick={() => clearChecked.mutate()}>
              Clear checked items
            </Button>
          )
        }
      />

      <div className="grid grid-cols-[1.6fr_1fr] gap-4 max-lg:grid-cols-1">
        <ShoppingListPanel items={items.data} />
        <ShoppingAddForm />
      </div>
    </>
  );
}
