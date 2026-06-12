import { Link, useRouteError } from "react-router";

import { Card } from "@/components/Card";
import { ROUTES } from "@/config/routes";
import { errorMessage } from "@/lib/http";

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <main className="mx-auto w-full max-w-[1180px] px-8 max-md:px-4">
      <Card raised className="mx-auto my-20 max-w-[520px]">
        <h1 className="text-[1.7rem]">well, that's a spike.</h1>
        <p className="my-2.5 rounded-[9px] border border-danger bg-danger/5 px-3.5 py-2.5 font-mono
          text-[0.84rem] text-danger">
          {errorMessage(error)}
        </p>
        <p className="mb-3.5 text-[0.74rem] text-faint">
          Make sure all three processes are running: <code className="font-mono">pnpm start</code>{" "}
          launches the PGlite database, the FastAPI backend, and this frontend together.
        </p>
        <Link
          to={ROUTES.dashboard}
          className="inline-block rounded-[9px] border border-accent bg-accent px-4 py-2
            text-[0.88rem] font-bold text-accent-ink no-underline"
        >
          Back to dashboard
        </Link>
      </Card>
    </main>
  );
}
