import { useState } from "react";
import { Form, redirect, useLoaderData, useNavigation, useSubmit } from "react-router";
import { api, postJSON } from "../api.js";

export async function recipesLoader({ request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const tag = url.searchParams.get("tag") ?? "";
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tag) params.set("tag", tag);
  const [recipes, tags] = await Promise.all([
    api(`/api/recipes?${params}`),
    api("/api/recipes/tags"),
  ]);
  return { recipes, tags, q, tag };
}

export async function recipesAction({ request }) {
  const fd = await request.formData();
  const ids = fd.getAll("recipe_id").map(Number);
  await postJSON("/api/shopping/from-recipes", { recipe_ids: ids });
  return redirect("/shopping");
}

export default function Recipes() {
  const { recipes, tags, q, tag } = useLoaderData();
  const [selected, setSelected] = useState(new Set());
  const submit = useSubmit();
  const navigation = useNavigation();
  const building = navigation.state === "submitting";

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Recipes</h1>
          <p>Diabetic-friendly, macro-counted. Pick a few and build a shopping list.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <Form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="search" name="q" defaultValue={q} placeholder="search title or ingredient…"
            style={{ maxWidth: 320 }}
            onChange={(e) => submit(e.currentTarget.form, { replace: true })}
          />
          {tag && <input type="hidden" name="tag" value={tag} />}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tags.map((t) => (
              <button
                key={t} type="button"
                className={`pill ${tag === t ? "on" : ""}`}
                style={{ cursor: "pointer", background: tag === t ? undefined : "transparent" }}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (q) params.set("q", q);
                  if (tag !== t) params.set("tag", t);
                  submit(params, { replace: true });
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </Form>
      </div>

      {recipes.length ? (
        <div className="grid cards">
          {recipes.map((r) => {
            const ingredients = typeof r.ingredients === "string" ? JSON.parse(r.ingredients) : r.ingredients;
            const instructions = typeof r.instructions === "string" ? JSON.parse(r.instructions) : r.instructions;
            const isSelected = selected.has(r.id);
            return (
              <div className={`card recipe-card ${isSelected ? "selected" : ""}`} key={r.id}>
                <input
                  type="checkbox" className="recipe-check" checked={isSelected}
                  onChange={() => toggle(r.id)} title="add to shopping list"
                />
                <h3 style={{ paddingRight: 28 }}>{r.title}</h3>
                <div className="tags">
                  {r.tags.map((t) => <span className="pill" key={t}>{t}</span>)}
                </div>
                <p className="desc">{r.description}</p>
                <div className="recipe-meta">
                  <span>⏱ {r.prep_minutes} min</span>
                  <span>🍽 {r.servings} servings</span>
                </div>
                <div className="macro-row">
                  <span><b>{Math.round(r.calories)}</b> cal</span>
                  <span><b>{r.carbs_g}g</b> carbs</span>
                  <span><b>{r.fiber_g}g</b> fiber</span>
                  <span><b>{r.protein_g}g</b> protein</span>
                  <span><b>{r.fat_g}g</b> fat</span>
                </div>
                <details className="ingredients">
                  <summary>Ingredients & steps</summary>
                  <ul>
                    {ingredients.map((ing, i) => (
                      <li key={i}><span className="num">{ing.qty}</span> {ing.name}</li>
                    ))}
                  </ul>
                  <ol>
                    {instructions.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </details>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty">No recipes match that search.</p>
      )}

      {selected.size > 0 && (
        <Form method="post" className="select-bar">
          <span>
            <b className="num">{selected.size}</b> recipe{selected.size > 1 ? "s" : ""} selected
          </span>
          {[...selected].map((id) => (
            <input type="hidden" name="recipe_id" value={id} key={id} />
          ))}
          <button className="btn primary" disabled={building}>
            {building ? <span className="spin" /> : "🛒"} Build shopping list
          </button>
        </Form>
      )}
    </>
  );
}
