import { ErrorBox } from "./ErrorBox";
import { Spinner } from "./Spinner";
import { errorMessage } from "@/lib/http";

export function PageLoading() {
  return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-muted">
      <Spinner /> loading…
    </div>
  );
}

export function PageError({ error }: { error: unknown }) {
  return (
    <div className="mx-auto max-w-lg py-10">
      <ErrorBox>
        {errorMessage(error)} — make sure all three processes are running
        (<code className="font-mono">pnpm start</code>).
      </ErrorBox>
    </div>
  );
}
