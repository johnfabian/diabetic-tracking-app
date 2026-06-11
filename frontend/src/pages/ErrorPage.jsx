import { Link, useRouteError } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();
  let message = "Something went sideways.";
  try {
    if (error?.data) {
      const parsed = typeof error.data === "string" ? JSON.parse(error.data) : error.data;
      message = parsed.message ?? message;
    } else if (error?.message) {
      message = error.message;
    }
  } catch { /* keep default */ }

  return (
    <div className="shell">
      <main className="main">
        <div className="card raised" style={{ maxWidth: 520, margin: "80px auto" }}>
          <h1>well, that's a spike.</h1>
          <p className="error-box num">{message}</p>
          <p className="hint">
            Make sure all three processes are running: <code>npm run dev</code> starts
            the PGlite database, the FastAPI backend, and this frontend together.
          </p>
          <Link className="btn primary" to="/">Back to dashboard</Link>
        </div>
      </main>
    </div>
  );
}
