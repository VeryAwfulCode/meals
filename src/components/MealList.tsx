import { Box, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import { Check } from "lucide-react";
import { catppuccin } from "../catppuccin";
import { useStore } from "../store";
import { fmtHours, tagFor } from "../utils";

interface Props {
  nextIdx: number;
}

export function MealList({ nextIdx }: Props) {
  const { colorScheme } = useMantineColorScheme();
  const C = colorScheme === "light" ? catppuccin.latte : catppuccin.mocha;

  const { preset, times, rawTimes, toggleDone, isDone } = useStore();

  if (!times.length) return null;

  return (
    <Stack gap={0}>
      {times.map((time, i) => {
        const num = i + 1;
        const done = isDone(num);
        const isNext = i === nextIdx;
        const name = preset.names[num];
        const tag = tagFor(num, preset);
        const gap = i > 0 ? fmtHours(rawTimes[i] - rawTimes[i - 1]) : null;

        return (
          <Box
            key={i}
            component="button"
            onClick={() => toggleDone(num)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 0.5rem",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${C.surface1}`,
              width: "100%",
              cursor: "pointer",
              textAlign: "left",
              color: "inherit",
              fontFamily: "inherit",
            }}
          >
            <ThemeIcon
              variant={done ? "filled" : "outline"}
              radius="xl"
              size="sm"
              color="blue"
            >
              {done && <Check size={10} />}
            </ThemeIcon>

            <Group
              wrap="nowrap"
              align="center"
              gap="0.75rem"
              style={{ flex: 1, minWidth: 0, opacity: done ? 0.4 : 1 }}
            >
              <Text size="sm" c="dimmed" w={20} ta="center" style={{ flexShrink: 0 }}>
                {num}
              </Text>

              <Group flex={1} gap="xs" align="baseline" wrap="nowrap" style={{ minWidth: 0 }}>
                {name ? (
                  <Text
                    size="sm"
                    td={done ? "line-through" : undefined}
                    c={isNext ? "blue" : undefined}
                    fw={isNext ? 600 : undefined}
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {name}
                  </Text>
                ) : (
                  <Text size="sm" c="dimmed" fs="italic">
                    Meal {num}
                  </Text>
                )}
                {tag && (
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                    {tag}
                  </Text>
                )}
              </Group>

              <Text
                size="md"
                c={isNext ? "blue" : undefined}
                fw={isNext ? 600 : undefined}
                td={done ? "line-through" : undefined}
                style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
              >
                {time}
              </Text>

              <Text
                size="xs"
                c="dimmed"
                ta="right"
                style={{ minWidth: 48, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
              >
                {gap ? `+${gap}` : ""}
              </Text>
            </Group>
          </Box>
        );
      })}
    </Stack>
  );
}
