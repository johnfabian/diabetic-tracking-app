import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { GlucoseBadge } from "@/components/GlucoseBadge";
import { ListRow, ListWhen } from "@/components/ListRow";
import { fmtTime } from "@/lib/format";
import { useDeleteReading } from "@/lib/queries";
import type { Reading, TargetRange } from "@/lib/types";

export function ReadingHistory({
  readings,
  target,
}: {
  readings: Reading[];
  target?: TargetRange;
}) {
  const deleteReading = useDeleteReading();

  return (
    <Card title="History" subtitle="Newest first. Colored by range: green in, amber high, red low.">
      {readings.length === 0 ? (
        <EmptyState>No readings yet. Take a photo of your meter above to get started.</EmptyState>
      ) : (
        <div className="flex flex-col">
          {readings.map((reading) => (
            <ListRow key={reading.id}>
              <ListWhen>{fmtTime(reading.taken_at)}</ListWhen>
              <GlucoseBadge value={reading.value_mg_dl} target={target} />
              <div className="min-w-0 flex-1 max-md:order-3 max-md:basis-full">
                <span className="block truncate text-[0.78rem] text-faint">
                  {reading.source === "photo" ? "📷 " : ""}
                  {reading.note ?? ""}
                </span>
              </div>
              <Button
                size="sm"
                variant="danger-ghost"
                title="delete"
                className="border-transparent"
                busy={deleteReading.isPending && deleteReading.variables === reading.id}
                onClick={() => deleteReading.mutate(reading.id)}
              >
                ✕
              </Button>
            </ListRow>
          ))}
        </div>
      )}
    </Card>
  );
}
