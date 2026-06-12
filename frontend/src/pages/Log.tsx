import { PageHeader } from "@/components/PageHeader";
import { PageError, PageLoading } from "@/components/PageState";
import { ManualEntryForm } from "@/features/readings/ManualEntryForm";
import { PhotoCaptureCard } from "@/features/readings/PhotoCaptureCard";
import { ReadingHistory } from "@/features/readings/ReadingHistory";
import { useReadings, useStatsSummary } from "@/lib/queries";

const DAYS = 30;

export default function Log() {
  const readings = useReadings(DAYS);
  const summary = useStatsSummary(DAYS);

  if (readings.isPending) return <PageLoading />;
  if (readings.isError) return <PageError error={readings.error} />;

  return (
    <>
      <PageHeader
        title="Glucose Log"
        subtitle={`Last ${DAYS} days · ${readings.data.length} readings`}
      />

      <div className="mb-4 grid grid-cols-[1.6fr_1fr] gap-4 max-lg:grid-cols-1">
        <PhotoCaptureCard />
        <ManualEntryForm />
      </div>

      <ReadingHistory readings={readings.data} target={summary.data?.target} />
    </>
  );
}
