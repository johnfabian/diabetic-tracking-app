export async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch { /* non-JSON error body */ }
    throw new Response(JSON.stringify({ message: detail }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (res.status === 204) return null;
  return res.json();
}

export function postJSON(path, body) {
  return api(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const fmtTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

export const fmtDay = (isoDay) =>
  new Date(isoDay + "T12:00:00").toLocaleDateString(undefined, {
    month: "short", day: "numeric",
  });

export function glucoseTone(v, target = { low: 70, high: 180 }) {
  if (v < target.low) return "low";
  if (v > target.high) return "high";
  return "ok";
}
