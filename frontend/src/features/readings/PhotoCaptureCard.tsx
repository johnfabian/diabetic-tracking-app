import { useState } from "react";

import { Card } from "@/components/Card";
import { ErrorBox } from "@/components/ErrorBox";
import { PhotoDrop } from "@/components/PhotoDrop";
import { Spinner } from "@/components/Spinner";
import { errorMessage } from "@/lib/http";
import { fmtTime } from "@/lib/format";
import { useReadingFromPhoto } from "@/lib/queries";

export function PhotoCaptureCard() {
  const [preview, setPreview] = useState<string | null>(null);
  const ocr = useReadingFromPhoto();
  const result = ocr.data;

  function onPick(file: File | null) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    ocr.mutate(file, { onSuccess: (data) => data.saved && setPreview(null) });
  }

  return (
    <Card
      raised
      title="Snap your meter"
      subtitle="Photograph the glucometer screen — the value and the date/time shown on the display are read automatically."
    >
      <PhotoDrop preview={preview} disabled={ocr.isPending} onPick={onPick}>
        {ocr.isPending ? (
          <span className="inline-flex items-center gap-2"><Spinner /> reading the display…</span>
        ) : (
          <span>📷 Tap to take or choose a photo</span>
        )}
      </PhotoDrop>

      {result?.saved && (
        <div className="mt-4 rounded-xl border border-dashed border-accent bg-accent/5 px-4 py-3.5">
          Saved <b className="font-mono">{result.saved.value_mg_dl} mg/dL</b> at{" "}
          <span className="font-mono">{fmtTime(result.saved.taken_at)}</span>
          {result.parsed.confidence !== "high" && (
            <div className="mt-1.5 text-[0.74rem] text-faint">
              Confidence: {result.parsed.confidence}
              {result.parsed.notes ? ` — ${result.parsed.notes}` : ""}. Double-check the value below.
            </div>
          )}
        </div>
      )}

      {result && !result.saved && (
        <ErrorBox>
          Couldn't read a value from that photo
          {result.parsed.notes ? ` — ${result.parsed.notes}` : ""}. Try again with less glare.
        </ErrorBox>
      )}

      {ocr.isError && <ErrorBox>{errorMessage(ocr.error)}</ErrorBox>}
    </Card>
  );
}
