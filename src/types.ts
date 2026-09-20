export type ScheduleMode = "spread" | "gap" | "anchor";
export type GapAnchorType = "first" | "last" | "specific";

export interface Anchor {
  idx: number;
  time: string; // "HH:MM"
}

export interface Preset {
  name: string;
  meals: number;
  first: string; // "HH:MM"
  last: string; // "HH:MM"
  gap: number; // hours
  gapAnchor: GapAnchorType;
  gapAnchorIdx: number;
  gapAnchorTime: string; // "HH:MM"
  anchors: Anchor[];
  mode: ScheduleMode;
  round30: boolean;
  names: Record<number, string>;
  days: number[]; // 0=Sun … 6=Sat
}

export interface AppState {
  presets: Record<string, Preset>;
  currentPresetId: string;
  editing: Preset;
  notificationsEnabled: boolean;
  swipeEnabled: boolean;
  doneMeals: Record<string, number[]>; // "YYYY-MM-DD" -> meal numbers
  unsavedIds: string[]; // presets created this session and not yet saved
}
