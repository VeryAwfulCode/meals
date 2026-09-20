import { Stack, Text } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { useState } from "react";
import { useStore } from "../store";
import { currentNextIdx, fmtCountdown, isActiveToday } from "../utils";

interface Props {
  nextIdx: number;
}

export function NextMealBanner({ nextIdx }: Props) {
  const { preset, rawTimes, doneMeals } = useStore();
  const [, setTick] = useState(0);
  useInterval(() => setTick((t) => t + 1), 30000);

  if (!rawTimes.length) return null;

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const offDay = !isActiveToday(preset);

  // Recompute locally so countdown stays fresh between store updates
  const liveNextIdx = currentNextIdx(rawTimes, doneMeals);
  const effectiveNextIdx = liveNextIdx !== nextIdx ? liveNextIdx : nextIdx;

  let line: React.ReactNode;
  if (effectiveNextIdx >= 0) {
    const delta = rawTimes[effectiveNextIdx] - nowMins;
    const name = preset.names[effectiveNextIdx + 1] || `Meal ${effectiveNextIdx + 1}`;
    line = (
      <Text size="sm" c="dimmed" ta="center">
        Next:{" "}
        <Text span c="var(--mantine-color-text)">
          {name}
        </Text>{" "}
        in{" "}
        <Text span c="blue">
          {fmtCountdown(delta)}
        </Text>
      </Text>
    );
  } else {
    const done = doneMeals[
      new Date().toISOString().slice(0, 10)
    ] ?? [];
    const remaining = rawTimes.filter((_, i) => !done.includes(i + 1)).length;
    line = (
      <Text size="sm" c="dimmed" ta="center">
        {remaining === 0 ? "All meals done for today" : "No more meals today"}
      </Text>
    );
  }

  return (
    <Stack gap={2} align="center">
      {line}
      {offDay && (
        <Text size="xs" c="dimmed">
          Preset not active today
        </Text>
      )}
    </Stack>
  );
}
