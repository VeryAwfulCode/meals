import { ActionIcon, Box, Button, Group } from "@mantine/core";
import { Plus } from "lucide-react";
import { useStore } from "../store";
import { presetDays } from "../utils";

export function PresetsBar() {
  const {
    presets,
    currentPresetId,
    preset,
    isDirty,
    switchPreset,
    createPreset,
    savePreset,
  } = useStore();
  const today = new Date().getDay();

  return (
    <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <Group gap={6} wrap="nowrap" pb={2}>
          {Object.entries(presets).map(([id, p]) => {
            const isActive = id === currentPresetId;
            const name = isActive ? preset.name : p.name;
            const offToday = !presetDays(p).includes(today);
            return (
              <Button
                key={id}
                size="compact-sm"
                variant={isActive ? "filled" : "subtle"}
                onClick={() => switchPreset(id)}
                style={{ opacity: offToday ? 0.55 : 1, flexShrink: 0 }}
                rightSection={
                  isActive && isDirty ? (
                    <Box
                      w={6}
                      h={6}
                      style={{
                        borderRadius: "50%",
                        background: "currentColor",
                      }}
                    />
                  ) : null
                }
              >
                {name || "Untitled"}
              </Button>
            );
          })}
          <ActionIcon
            variant="filled"
            size="sm"
            color="blue"
            onClick={() => createPreset()}
            style={{
              "--ai-bg": "transparent",
              "--ai-color": "white",
            } as React.CSSProperties}
          >
            <Plus size={14} />
          </ActionIcon>
        </Group>
      </Box>

      {isDirty && (
        <Button
          size="compact-sm"
          variant="filled"
          onClick={savePreset}
          style={{ flexShrink: 0 }}
        >
          Save
        </Button>
      )}
    </Group>
  );
}
