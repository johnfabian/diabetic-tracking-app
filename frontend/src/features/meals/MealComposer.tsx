import { useActionState, useState } from "react";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorBox } from "@/components/ErrorBox";
import { Field, Textarea } from "@/components/Field";
import { PhotoDrop } from "@/components/PhotoDrop";
import { errorMessage } from "@/lib/http";
import { useAnalyzeMeal } from "@/lib/queries";
import type { MealAnalysis } from "@/lib/types";
import { AnalysisPanel } from "./AnalysisPanel";

interface ComposerState {
  analysis: MealAnalysis | null;
  source: "text" | "photo";
  error: string | null;
}

const initialState: ComposerState = { analysis: null, source: "text", error: null };

export function MealComposer() {
  const analyzeMeal = useAnalyzeMeal();
  const [preview, setPreview] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<MealAnalysis | null>(null);

  const [state, formAction, isPending] = useActionState<ComposerState, FormData>(
    async (_previous, formData) => {
      const description = String(formData.get("description") ?? "").trim();
      const photo = formData.get("photo");
      const photoFile = photo instanceof File && photo.size > 0 ? photo : undefined;

      if (!description && !photoFile) {
        return { ...initialState, error: "Describe the meal or attach a photo first." };
      }
      try {
        const analysis = await analyzeMeal.mutateAsync({ description, photo: photoFile });
        return { analysis, source: photoFile ? "photo" : "text", error: null };
      } catch (error) {
        return { ...initialState, error: errorMessage(error) };
      }
    },
    initialState,
  );

  const showAnalysis = state.analysis && state.analysis !== dismissed;

  return (
    <Card
      raised
      title="What did you eat?"
      subtitle="Describe it, photograph it, or both — protein, fat, sugar and carbs get estimated for you."
    >
      <form action={formAction}>
        <Field label="Description (optional if you attach a photo)">
          <Textarea
            name="description"
            placeholder="grilled chicken breast, about a cup of brown rice, side caesar salad, sweet tea…"
          />
        </Field>

        <PhotoDrop
          name="photo"
          preview={preview}
          disabled={isPending}
          onPick={(file) => setPreview(file ? URL.createObjectURL(file) : null)}
          className="mb-3"
        >
          {!preview && <span>📷 Optionally add a photo of the plate</span>}
        </PhotoDrop>

        <Button type="submit" variant="primary" busy={isPending}>
          {isPending ? "estimating…" : "Analyze meal"}
        </Button>
      </form>

      {state.error && !isPending && <ErrorBox>{state.error}</ErrorBox>}

      {showAnalysis && state.analysis && (
        <AnalysisPanel
          analysis={state.analysis}
          source={state.source}
          onDiscard={() => {
            setDismissed(state.analysis);
            setPreview(null);
          }}
        />
      )}
    </Card>
  );
}
