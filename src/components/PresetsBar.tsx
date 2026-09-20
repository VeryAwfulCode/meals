import { ActionIcon, Box, Button, Group } from "@mantine/core";
import { Plus } from "lucide-react";
import { useStore } from "../store";
import { presetDays } from "../utils";
import { useDialog } from "./DialogProvider";

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
  const { confirm } = useDialog();
  const today = new Date().getDay();

  async function confirmDiscard(action: string): Promise<boolean> {
    if (!isDirty) return true;
    return confirm({
      title: "Discard unsaved changes?",
      message: `You have unsaved changes to "${preset.name || "Untitled"}". ${action} anyway?`,
      confirmLabel: "Discard",
      danger: true,
    });
  }

  async function handleSwitch(id: string) {
    if (id === currentPresetId) return;
    if (await confirmDiscard("Switch preset")) switchPreset(id);
  }

  async function handleCreate() {
    if (await confirmDiscard("Create new preset")) createPreset();
  }

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
                onClick={() => handleSwitch(id)}
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
        </Group>
      </Box>

      <ActionIcon
        variant="filled"
        size="sm"
        color="blue"
        onClick={handleCreate}
        style={{
          "--ai-bg": "transparent",
          "--ai-color": "white",
          flexShrink: 0,
        } as React.CSSProperties}
      >
        <Plus size={14} />
      </ActionIcon>

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
