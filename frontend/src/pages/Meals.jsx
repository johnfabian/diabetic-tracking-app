import { useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { api, fmtTime, postJSON } from "../api.js";

export async function mealsLoader() {
  const meals = await api("/api/meals?days=30");
  return { meals };
}

export async function mealsAction({ request }) {
  const fd = await request.formData();
  const intent = fd.get("intent");

  if (intent === "delete") {
    await api(`/api/meals/${fd.get("id")}`, { method: "DELETE" });
    return { ok: true };
  }

  if (intent === "analyze") {
    const upstream = new FormData();
    const description = fd.get("description");
    const photo = fd.get("photo");
    if (description) upstream.append("description", description);
    if (photo && photo.size > 0) upstream.append("photo", photo);
    const analysis = await api("/api/meals/analyze", { method: "POST", body: upstream });
    return { analysis, source: photo && photo.size > 0 ? "photo" : "text" };
  }

  if (intent === "save") {
    const analysis = JSON.parse(fd.get("analysis"));
    await postJSON("/api/meals", {
      name: analysis.meal_name,
      source: fd.get("source") || "text",
      calories: analysis.calories,
      carbs_g: analysis.carbs_g,
      sugar_g: analysis.sugar_g,
      fiber_g: analysis.fiber_g,
      protein_g: analysis.protein_g,
      fat_g: analysis.fat_g,
      glycemic_impact: analysis.glycemic_impact,
      tip: analysis.tip,
      items: analysis.items,
    });
    return { saved: true };
  }
  return null;
}

function AnalysisPanel({ analysis, source, onDiscard }) {
  const saveFetcher = useFetcher();
  const busy = saveFetcher.state !== "idle";
  if (saveFetcher.data?.saved) return null;

  return (
    <div className="analysis">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <h3>{analysis.meal_name}</h3>
        <span className={`pill gi-${analysis.glycemic_impact}`}>{analysis.glycemic_impact} glycemic impact</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>item</th><th>portion</th><th>cal</th><th>carbs</th>
            <th>sugar</th><th>fiber</th><th>protein</th><th>fat</th>
          </tr>
        </thead>
        <tbody>
          {analysis.items.map((it, i) => (
            <tr key={i}>
              <td>{it.name}</td><td>{it.portion}</td>
              <td>{Math.round(it.calories)}</td><td>{it.carbs_g}g</td>
              <td>{it.sugar_g}g</td><td>{it.fiber_g}g</td>
              <td>{it.protein_g}g</td><td>{it.fat_g}g</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700 }}>
            <td>total</td><td></td>
            <td>{Math.round(analysis.calories)}</td><td>{Math.round(analysis.carbs_g)}g</td>
            <td>{Math.round(analysis.sugar_g)}g</td><td>{Math.round(analysis.fiber_g)}g</td>
            <td>{Math.round(analysis.protein_g)}g</td><td>{Math.round(analysis.fat_g)}g</td>
          </tr>
        </tbody>
      </table>
      <p className="tip">💡 {analysis.tip}</p>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <saveFetcher.Form method="post">
          <input type="hidden" name="intent" value="save" />
          <input type="hidden" name="source" value={source} />
          <input type="hidden" name="analysis" value={JSON.stringify(analysis)} />
          <button className="btn primary" disabled={busy}>
            {busy ? <span className="spin" /> : null} Log this meal
          </button>
        </saveFetcher.Form>
        <button className="btn ghost" onClick={onDiscard}>Discard</button>
      </div>
    </div>
  );
}

function MealComposer() {
  const fetcher = useFetcher();
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [discarded, setDiscarded] = useState(null);
  const busy = fetcher.state !== "idle";
  const analysis = fetcher.data?.analysis;
  const showAnalysis = analysis && discarded !== analysis;

  function onPick(e) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="card raised">
      <h2>What did you eat?</h2>
      <p className="sub">
        Describe it, photograph it, or both — protein, fat, sugar and carbs get
        estimated for you.
      </p>
      <fetcher.Form method="post" encType="multipart/form-data" ref={formRef}>
        <input type="hidden" name="intent" value="analyze" />
        <label className="field">
          <span>Description (optional if you attach a photo)</span>
          <textarea
            name="description"
            placeholder="grilled chicken breast, about a cup of brown rice, side caesar salad, sweet tea…"
          />
        </label>
        <div className="photo-drop" onClick={() => inputRef.current?.click()} style={{ marginBottom: 12 }}>
          {preview
            ? <img src={preview} alt="meal" />
            : <span>📷 Optionally add a photo of the plate</span>}
        </div>
        <input
          ref={inputRef} type="file" name="photo" accept="image/*" capture="environment"
          style={{ display: "none" }} onChange={onPick}
        />
        <button className="btn primary" disabled={busy}>
          {busy ? <><span className="spin" /> estimating…</> : "Analyze meal"}
        </button>
      </fetcher.Form>

      {fetcher.data && !fetcher.data.analysis && fetcher.state === "idle" && fetcher.data.message && (
        <div className="error-box">{fetcher.data.message}</div>
      )}
      {showAnalysis && (
        <AnalysisPanel
          analysis={analysis}
          source={fetcher.data.source}
          onDiscard={() => { setDiscarded(analysis); setPreview(null); formRef.current?.reset(); }}
        />
      )}
    </div>
  );
}

export default function Meals() {
  const { meals } = useLoaderData();
  const deleteFetcher = useFetcher();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Meals</h1>
          <p>Estimate macros with AI, keep a running food log.</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <MealComposer />
      </div>

      <div className="card">
        <h2>Meal history</h2>
        <p className="sub">Last 30 days.</p>
        {meals.length ? (
          <div className="list">
            {meals.map((m) => (
              <div className="list-row" key={m.id}>
                <span className="when">{fmtTime(m.eaten_at)}</span>
                <div className="grow">
                  <div>{m.source === "photo" ? "📷 " : ""}{m.name}</div>
                  <div className="macro-row">
                    <span><b>{Math.round(m.calories ?? 0)}</b> cal</span>
                    <span><b>{Math.round(m.carbs_g ?? 0)}g</b> carbs</span>
                    <span><b>{Math.round(m.sugar_g ?? 0)}g</b> sugar</span>
                    <span><b>{Math.round(m.fiber_g ?? 0)}g</b> fiber</span>
                    <span><b>{Math.round(m.protein_g ?? 0)}g</b> protein</span>
                    <span><b>{Math.round(m.fat_g ?? 0)}g</b> fat</span>
                  </div>
                  {m.tip && <div className="note">💡 {m.tip}</div>}
                </div>
                {m.glycemic_impact && <span className={`pill gi-${m.glycemic_impact}`}>{m.glycemic_impact}</span>}
                <deleteFetcher.Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={m.id} />
                  <button className="btn small ghost danger" title="delete">✕</button>
                </deleteFetcher.Form>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">No meals logged yet. Describe your last meal above.</p>
        )}
      </div>
    </>
  );
}
