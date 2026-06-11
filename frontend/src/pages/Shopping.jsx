import { useRef } from "react";
import { Link, useFetcher, useLoaderData } from "react-router";
import { api, postJSON } from "../api.js";

export async function shoppingLoader() {
  const items = await api("/api/shopping");
  return { items };
}

export async function shoppingAction({ request }) {
  const fd = await request.formData();
  const intent = fd.get("intent");

  if (intent === "toggle") {
    await api(`/api/shopping/${fd.get("id")}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: fd.get("checked") === "true" }),
    });
  } else if (intent === "delete") {
    await api(`/api/shopping/${fd.get("id")}`, { method: "DELETE" });
  } else if (intent === "clear-checked") {
    await api("/api/shopping", { method: "DELETE" });
  } else if (intent === "add") {
    await postJSON("/api/shopping", {
      name: fd.get("name"),
      quantity: fd.get("quantity") || null,
      category: fd.get("category") || "Pantry",
    });
    return { added: true };
  }
  return { ok: true };
}

const CATEGORY_ORDER = ["Produce", "Protein", "Dairy", "Frozen", "Bakery", "Pantry"];

function Item({ item }) {
  const fetcher = useFetcher();
  // optimistic toggle
  const checked = fetcher.formData
    ? fetcher.formData.get("checked") === "true"
    : item.checked;

  return (
    <div className={`shop-item ${checked ? "done" : ""}`}>
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="toggle" />
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="checked" value={String(!checked)} />
        <input
          type="checkbox" checked={checked}
          onChange={(e) => fetcher.submit(e.currentTarget.form)}
        />
      </fetcher.Form>
      <span className="name">{item.name}</span>
      {item.quantity && <span className="qty">{item.quantity}</span>}
      {item.recipe_title && <span className="src">{item.recipe_title}</span>}
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="id" value={item.id} />
        <button className="btn small ghost danger" title="remove">✕</button>
      </fetcher.Form>
    </div>
  );
}

export default function Shopping() {
  const { items } = useLoaderData();
  const addFetcher = useFetcher();
  const clearFetcher = useFetcher();
  const formRef = useRef(null);

  if (addFetcher.data?.added && addFetcher.state === "idle") {
    formRef.current?.reset();
  }

  const groups = CATEGORY_ORDER
    .map((cat) => ({ cat, rows: items.filter((i) => i.category === cat) }))
    .filter((g) => g.rows.length);
  const others = items.filter((i) => !CATEGORY_ORDER.includes(i.category));
  if (others.length) groups.push({ cat: "Other", rows: others });

  const doneCount = items.filter((i) => i.checked).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Shopping List</h1>
          <p>
            {items.length
              ? `${items.length - doneCount} to get · ${doneCount} in the cart`
              : "Empty — build one from the recipes page."}
          </p>
        </div>
        {doneCount > 0 && (
          <clearFetcher.Form method="post">
            <input type="hidden" name="intent" value="clear-checked" />
            <button className="btn small">Clear checked items</button>
          </clearFetcher.Form>
        )}
      </div>

      <div className="grid two">
        <div className="card raised">
          {groups.length ? (
            groups.map((g) => (
              <div className="shop-group" key={g.cat}>
                <h3>{g.cat}</h3>
                {g.rows.map((item) => <Item item={item} key={item.id} />)}
              </div>
            ))
          ) : (
            <p className="empty">
              Nothing here yet. <Link to="/recipes">Pick some recipes</Link> and hit
              “Build shopping list”, or add items by hand →
            </p>
          )}
        </div>

        <div className="card">
          <h2>Add an item</h2>
          <p className="sub">For everything that isn't from a recipe.</p>
          <addFetcher.Form method="post" ref={formRef}>
            <input type="hidden" name="intent" value="add" />
            <label className="field">
              <span>Item</span>
              <input type="text" name="name" required placeholder="glucose tabs" />
            </label>
            <label className="field">
              <span>Quantity</span>
              <input type="text" name="quantity" placeholder="1 bottle" />
            </label>
            <label className="field">
              <span>Category</span>
              <select name="category" defaultValue="Pantry">
                {CATEGORY_ORDER.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <button className="btn primary" disabled={addFetcher.state !== "idle"}>
              Add to list
            </button>
          </addFetcher.Form>
        </div>
      </div>
    </>
  );
}
