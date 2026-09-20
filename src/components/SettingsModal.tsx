import {
  ActionIcon,
  Box,
  Button,
  Chip,
  Divider,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import {
  Copy,
  Download,
  Minus,
  Plus,
  Trash,
  Upload,
  X,
} from "lucide-react";
import { useRef } from "react";
import type { GapAnchorType, ScheduleMode } from "../types";
import { useStore } from "../store";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun

interface Props {
  opened: boolean;
  onClose: () => void;
}

// ─── Meals tab ────────────────────────────────────────────────────────────────

function MealsTab() {
  const {
    preset,
    setPresetName,
    setMeals,
    toggleDay,
    setMode,
    setFirst,
    setLast,
    setGap,
    setGapAnchor,
    setGapAnchorIdx,
    setGapAnchorTime,
    addAnchor,
    removeAnchor,
    updateAnchorIdx,
    updateAnchorTime,
    setRound30,
  } = useStore();

  return (
    <Stack gap="md">
      <TextInput
        label="Preset name"
        value={preset.name}
        onChange={(e) => setPresetName(e.target.value)}
      />

      <Group justify="space-between">
        <Text size="sm">Meals per day</Text>
        <Group gap="xs">
          <ActionIcon
            variant="default"
            size="sm"
            onClick={() => setMeals(Math.max(2, preset.meals - 1))}
          >
            <Minus size={12} />
          </ActionIcon>
          <Text w={24} ta="center">
            {preset.meals}
          </Text>
          <ActionIcon
            variant="default"
            size="sm"
            onClick={() => setMeals(Math.min(12, preset.meals + 1))}
          >
            <Plus size={12} />
          </ActionIcon>
        </Group>
      </Group>

      <div>
        <Text size="sm" mb="xs">
          Active on
        </Text>
        <Stack gap={4}>
          <Group gap={4} justify="center">
            {[1, 2, 3, 4, 5].map((day) => (
              <Chip key={day} size="xs" checked={preset.days.includes(day)} onChange={() => toggleDay(day)}>
                {DAY_LABELS[day]}
              </Chip>
            ))}
          </Group>
          <Group gap={4} justify="center">
            {[6, 0].map((day) => (
              <Chip key={day} size="xs" checked={preset.days.includes(day)} onChange={() => toggleDay(day)}>
                {DAY_LABELS[day]}
              </Chip>
            ))}
          </Group>
        </Stack>
      </div>

      <div>
        <Text size="sm" mb="xs">
          Schedule
        </Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={preset.mode}
          onChange={(v) => setMode(v as ScheduleMode)}
          data={[
            { value: "spread", label: "Even spread" },
            { value: "gap", label: "Fixed gap" },
            { value: "anchor", label: "Anchor" },
          ]}
        />
      </div>

      {preset.mode === "spread" && (
        <Stack gap="xs">
          <TextInput
            type="time"
            label="First meal"
            value={preset.first}
            onChange={(e) => setFirst(e.target.value)}
          />
          <TextInput
            type="time"
            label="Last meal"
            value={preset.last}
            onChange={(e) => setLast(e.target.value)}
          />
        </Stack>
      )}

      {preset.mode === "gap" && (
        <Stack gap="xs">
          <NumberInput
            label="Gap (hours)"
            value={preset.gap}
            onChange={(v) => typeof v === "number" && setGap(v)}
            min={0.25}
            max={12}
            step={0.25}
            decimalScale={2}
          />
          <div>
            <Text size="sm" mb="xs">
              Anchor on
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={preset.gapAnchor}
              onChange={(v) => setGapAnchor(v as GapAnchorType)}
              data={[
                { value: "first", label: "First" },
                { value: "last", label: "Last" },
                { value: "specific", label: "Specific" },
              ]}
            />
          </div>
          {preset.gapAnchor === "first" && (
            <TextInput
              type="time"
              label="First meal"
              value={preset.first}
              onChange={(e) => setFirst(e.target.value)}
            />
          )}
          {preset.gapAnchor === "last" && (
            <TextInput
              type="time"
              label="Last meal"
              value={preset.last}
              onChange={(e) => setLast(e.target.value)}
            />
          )}
          {preset.gapAnchor === "specific" && (
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Anchor meal #</Text>
                <Group gap="xs">
                  <ActionIcon
                    variant="default"
                    size="sm"
                    onClick={() =>
                      setGapAnchorIdx(Math.max(1, preset.gapAnchorIdx - 1))
                    }
                  >
                    <Minus size={12} />
                  </ActionIcon>
                  <Text w={20} ta="center" size="sm">
                    {preset.gapAnchorIdx}
                  </Text>
                  <ActionIcon
                    variant="default"
                    size="sm"
                    onClick={() =>
                      setGapAnchorIdx(
                        Math.min(preset.meals, preset.gapAnchorIdx + 1)
                      )
                    }
                  >
                    <Plus size={12} />
                  </ActionIcon>
                </Group>
              </Group>
              <TextInput
                type="time"
                label="Anchor time"
                value={preset.gapAnchorTime}
                onChange={(e) => setGapAnchorTime(e.target.value)}
              />
            </Stack>
          )}
        </Stack>
      )}

      {preset.mode === "anchor" && (
        <Stack gap="xs">
          <TextInput
            type="time"
            label="First meal"
            value={preset.first}
            onChange={(e) => setFirst(e.target.value)}
          />
          {(preset.anchors ?? []).map((anchor, i) => (
            <Group key={i} gap="xs" align="center">
              <Group gap={4} align="center" style={{ flexShrink: 0 }}>
                <ActionIcon
                  variant="default"
                  size="sm"
                  onClick={() =>
                    updateAnchorIdx(i, Math.max(2, anchor.idx - 1))
                  }
                >
                  <Minus size={12} />
                </ActionIcon>
                <Text size="sm" w={20} ta="center">
                  {anchor.idx}
                </Text>
                <ActionIcon
                  variant="default"
                  size="sm"
                  onClick={() =>
                    updateAnchorIdx(
                      i,
                      Math.min(preset.meals - 1, anchor.idx + 1)
                    )
                  }
                >
                  <Plus size={12} />
                </ActionIcon>
              </Group>
              <TextInput
                type="time"
                style={{ flex: 1 }}
                value={anchor.time}
                onChange={(e) => updateAnchorTime(i, e.target.value)}
              />
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => removeAnchor(i)}
              >
                <X size={12} />
              </ActionIcon>
            </Group>
          ))}
          <Button
            size="xs"
            variant="default"
            leftSection={<Plus size={12} />}
            onClick={addAnchor}
            disabled={(preset.anchors ?? []).length >= preset.meals - 2}
          >
            Add anchor
          </Button>
          <TextInput
            type="time"
            label="Last meal"
            value={preset.last}
            onChange={(e) => setLast(e.target.value)}
          />
        </Stack>
      )}

      <Switch
        label="Round to 30 min"
        checked={preset.round30}
        onChange={(e) => setRound30(e.target.checked)}
      />
    </Stack>
  );
}

// ─── Names tab ────────────────────────────────────────────────────────────────

function NamesTab() {
  const { preset, setMealName } = useStore();

  return (
    <Stack gap="xs">
      {Array.from({ length: preset.meals }, (_, i) => (
        <TextInput
          key={i}
          label={`Meal ${i + 1}`}
          placeholder={`Meal ${i + 1}`}
          value={preset.names[i + 1] ?? ""}
          onChange={(e) => setMealName(i + 1, e.target.value)}
        />
      ))}
    </Stack>
  );
}

// ─── Prefs tab ────────────────────────────────────────────────────────────────

function PrefsTab() {
  const {
    notificationsEnabled,
    swipeEnabled,
    setNotificationsEnabled,
    setSwipeEnabled,
  } = useStore();

  return (
    <Stack gap="sm">
      <Switch
        label="Notifications"
        checked={notificationsEnabled}
        onChange={(e) => setNotificationsEnabled(e.target.checked)}
      />
      <Switch
        label="Swipe to mark done"
        checked={swipeEnabled}
        onChange={(e) => setSwipeEnabled(e.target.checked)}
      />
    </Stack>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function SettingsModal({ opened, onClose }: Props) {
  const {
    isDirty,
    savePreset,
    discardChanges,
    duplicatePreset,
    deletePreset,
    exportIcs,
    exportJson,
    importPreset,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDelete() {
    if (!confirm("Delete this preset?")) return;
    const deleted = deletePreset();
    if (deleted) onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Settings" size="sm" styles={{ body: { padding: 0 } }}>
      <Tabs defaultValue="meals">
        <Tabs.List grow>
          <Tabs.Tab value="meals">Meals</Tabs.Tab>
          <Tabs.Tab value="names">Names</Tabs.Tab>
          <Tabs.Tab value="prefs">Prefs</Tabs.Tab>
        </Tabs.List>

        <ScrollArea.Autosize mah="55vh">
          <Box p="md">
            <Tabs.Panel value="meals">
              <MealsTab />
            </Tabs.Panel>
            <Tabs.Panel value="names">
              <NamesTab />
            </Tabs.Panel>
            <Tabs.Panel value="prefs">
              <PrefsTab />
            </Tabs.Panel>
          </Box>
        </ScrollArea.Autosize>
      </Tabs>

      <Divider />

      <Stack gap="xs" p="md">
        {isDirty && (
          <Group grow>
            <Button onClick={savePreset}>Save changes</Button>
            <Button variant="default" onClick={discardChanges}>
              Discard
            </Button>
          </Group>
        )}
        <SimpleGrid cols={3} spacing="xs">
          <Button
            size="xs"
            variant="default"
            leftSection={<Download size={12} />}
            onClick={exportIcs}
          >
            .ics
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={<Download size={12} />}
            onClick={exportJson}
          >
            Export
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={<Upload size={12} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={<Copy size={12} />}
            onClick={duplicatePreset}
          >
            Duplicate
          </Button>
          <Button
            size="xs"
            variant="subtle"
            color="red"
            leftSection={<Trash size={12} />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </SimpleGrid>
      </Stack>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await importPreset(file);
          e.target.value = "";
        }}
      />
    </Modal>
  );
}
