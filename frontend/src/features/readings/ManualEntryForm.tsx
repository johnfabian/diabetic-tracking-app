import { useForm } from "react-hook-form";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorBox } from "@/components/ErrorBox";
import { Field, Input } from "@/components/Field";
import { errorMessage } from "@/lib/http";
import { isValidLocalDatetime, localDatetimeValue } from "@/lib/format";
import { useCreateReading } from "@/lib/queries";

interface ManualEntryValues {
  value: number;
  taken_at: string;
  note: string;
}

const GLUCOSE_MIN = 20;
const GLUCOSE_MAX = 600;

export function ManualEntryForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualEntryValues>({
    defaultValues: { taken_at: localDatetimeValue(), note: "" },
  });

  const createReading = useCreateReading({
    onSuccess: () => reset({ taken_at: localDatetimeValue(), note: "" }),
  });

  const onSubmit = handleSubmit((values) =>
    createReading.mutate({
      value_mg_dl: values.value,
      // send the local wall-clock string as-is: the backend stores naive
      // local timestamps, so converting to UTC would shift every entry
      taken_at: values.taken_at || null,
      note: values.note || null,
    }),
  );

  return (
    <Card title="Manual entry" subtitle="Type it in if you'd rather not take a photo.">
      <form onSubmit={onSubmit} noValidate>
        <Field label="Glucose (mg/dL)" error={errors.value?.message}>
          <Input
            type="number"
            inputMode="numeric"
            step="1"
            placeholder="118"
            aria-invalid={Boolean(errors.value)}
            {...register("value", {
              valueAsNumber: true,
              required: "Enter a glucose value.",
              min: { value: GLUCOSE_MIN, message: `Must be at least ${GLUCOSE_MIN} mg/dL.` },
              max: { value: GLUCOSE_MAX, message: `Must be at most ${GLUCOSE_MAX} mg/dL.` },
              validate: (v) => !Number.isNaN(v) || "Enter a glucose value.",
            })}
          />
        </Field>

        <Field label="When" error={errors.taken_at?.message}>
          <Input
            type="datetime-local"
            aria-invalid={Boolean(errors.taken_at)}
            {...register("taken_at", {
              validate: (v) =>
                !v ||
                isValidLocalDatetime(v) ||
                "That date/time looks incomplete — fill every part (date, hour, minute).",
            })}
          />
        </Field>

        <Field label="Note">
          <Input type="text" placeholder="fasting / 2h after lunch / felt shaky…" {...register("note")} />
        </Field>

        <Button type="submit" variant="primary" busy={createReading.isPending}>
          Save reading
        </Button>
        {createReading.isSuccess && (
          <span role="status" className="ml-3 animate-fade-up font-mono text-[0.8rem] text-ok">
            ✓ saved
          </span>
        )}
      </form>
      {createReading.isError && <ErrorBox>{errorMessage(createReading.error)}</ErrorBox>}
    </Card>
  );
}
