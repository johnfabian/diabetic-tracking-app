import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { api, fmtTime, glucoseTone, postJSON } from "../api.js";

export async function logLoader() {
  const [readings, summary] = await Promise.all([
    api("/api/readings?days=30"),
    api("/api/stats/summary?days=30"),
  ]);
  return { readings, summary };
}

export async function logAction({ request }) {
  const fd = await request.formData();
  const intent = fd.get("intent");

  if (intent === "delete") {
    await api(`/api/readings/${fd.get("id")}`, { method: "DELETE" });
    return { ok: true };
  }

  if (intent === "photo") {
    // forward the multipart body straight to the backend OCR endpoint
    const upstream = new FormData();
    upstream.append("photo", fd.get("photo"));
    return api("/api/readings/photo", { method: "POST", body: upstream });
  }

  // manual entry
  const taken = fd.get("taken_at");
  await postJSON("/api/readings", {
    value_mg_dl: Number(fd.get("value")),
    taken_at: taken ? new Date(taken).toISOString() : null,
    note: fd.get("note") || null,
  });
  return { ok: true, saved_manual: true };
}

function PhotoCapture() {
  const fetcher = useFetcher();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const busy = fetcher.state !== "idle";
  const result = fetcher.data;

  useEffect(() => {
    // clear the preview once a photo reading was saved
    if (result?.saved) setPreview(null);
  }, [result]);

  function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("intent", "photo");
    fd.append("photo", file);
    fetcher.submit(fd, { method: "post", encType: "multipart/form-data" });
  }

  return (
    <div className="card raised">
      <h2>Snap your meter</h2>
      <p className="sub">
        Photograph the glucometer screen — the value and the date/time shown on the
        display are read automatically.
      </p>
      <div className="photo-drop" onClick={() => !busy && inputRef.current?.click()}>
        {preview && <img src={preview} alt="glucometer" />}
        {busy
          ? <span><span className="spin" /> reading the display…</span>
          : <span>📷 Tap to take or choose a photo</span>}
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={onPick}
      />
      {result?.saved && (
        <div className="analysis">
          Saved <b className="num">{result.saved.value_mg_dl} mg/dL</b>
          {" "}at <span className="num">{fmtTime(result.saved.taken_at)}</span>
          {result.parsed?.confidence !== "high" && (
            <div className="hint" style={{ marginTop: 6 }}>
              Confidence: {result.parsed.confidence}
              {result.parsed.notes ? ` — ${result.parsed.notes}` : ""}. Double-check the value below.
            </div>
          )}
        </div>
      )}
      {result && !result.saved && result.parsed && (
        <div className="error-box">
          Couldn't read a value from that photo
          {result.parsed.notes ? ` — ${result.parsed.notes}` : ""}. Try again with less glare.
        </div>
      )}
      {fetcher.data instanceof Error && <div className="error-box">{String(fetcher.data)}</div>}
    </div>
  );
}

function ManualEntry() {
  const fetcher = useFetcher();
  const formRef = useRef(null);
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.saved_manual) formRef.current?.reset();
  }, [fetcher.data]);

  return (
    <div className="card">
      <h2>Manual entry</h2>
      <p className="sub">Type it in if you'd rather not take a photo.</p>
      <fetcher.Form method="post" ref={formRef}>
        <label className="field">
          <span>Glucose (mg/dL)</span>
          <input type="number" name="value" min="20" max="600" step="1" required placeholder="118" />
        </label>
        <label className="field">
          <span>When (blank = now)</span>
          <input type="datetime-local" name="taken_at" />
        </label>
        <label className="field">
          <span>Note</span>
          <input type="text" name="note" placeholder="fasting / 2h after lunch / felt shaky…" />
        </label>
        <button className="btn primary" disabled={busy}>
          {busy ? <span className="spin" /> : null} Save reading
        </button>
      </fetcher.Form>
    </div>
  );
}

export default function Log() {
  const { readings, summary } = useLoaderData();
  const deleteFetcher = useFetcher();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Glucose Log</h1>
          <p>Last 30 days · {readings.length} readings</p>
        </div>
      </div>

      <div className="grid two" style={{ marginBottom: 16 }}>
        <PhotoCapture />
        <ManualEntry />
      </div>

      <div className="card">
        <h2>History</h2>
        <p className="sub">Newest first. Colored by range: green in, amber high, red low.</p>
        {readings.length ? (
          <div className="list">
            {readings.map((r) => {
              const tone = glucoseTone(r.value_mg_dl, summary.target);
              return (
                <div className="list-row" key={r.id}>
                  <span className="when">{fmtTime(r.taken_at)}</span>
                  <span className={`badge-value ${tone}`}>{r.value_mg_dl}</span>
                  <div className="grow">
                    <span className="note">
                      {r.source === "photo" ? "📷 " : ""}{r.note ?? ""}
                    </span>
                  </div>
                  <deleteFetcher.Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn small ghost danger" title="delete">✕</button>
                  </deleteFetcher.Form>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty">No readings yet. Take a photo of your meter above to get started.</p>
        )}
      </div>
    </>
  );
}
