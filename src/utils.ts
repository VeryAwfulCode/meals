import type { Preset, AppState, GapAnchorType, ScheduleMode, Anchor } from "./types";

// ─── IDs & cloning ────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

export function fingerprint(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(fingerprint).join(",") + "]";
  const keys = Object.keys(obj as object).sort();
  return (
    "{" +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ":" +
          fingerprint((obj as Record<string, unknown>)[k])
      )
      .join(",") +
    "}"
  );
}

// ─── Preset defaults & migration ─────────────────────────────────────────────

export function presetDefaults(): Preset {
  return {
    name: "Default",
    meals: 5,
    first: "08:00",
    last: "22:00",
    gap: 3.5,
    gapAnchor: "last" as GapAnchorType,
    gapAnchorIdx: 3,
    gapAnchorTime: "14:00",
    anchors: [{ idx: 3, time: "14:00" }],
    mode: "spread" as ScheduleMode,
    round30: false,
    names: {},
    days: [0, 1, 2, 3, 4, 5, 6],
  };
}

export function migratePreset(p: Record<string, unknown>): Preset {
  if (!p.anchors) {
    p.anchors = p.anchorIdx
      ? [{ idx: p.anchorIdx, time: p.anchorTime ?? "14:00" }]
      : [{ idx: 3, time: "14:00" }];
  }
  delete p.anchorIdx;
  delete p.anchorTime;
  if (!Array.isArray(p.days) || (p.days as number[]).length === 0)
    p.days = [0, 1, 2, 3, 4, 5, 6];
  return p as unknown as Preset;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "mealtimer.v2";

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadInitialState(): AppState {
  try {
    const v2 = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (v2?.presets && v2?.currentPresetId) {
      v2.swipeEnabled ??= false;
      Object.values(v2.presets).forEach((p) =>
        migratePreset(p as Record<string, unknown>)
      );
      if (!v2.editing)
        v2.editing = clone(v2.presets[v2.currentPresetId]);
      else migratePreset(v2.editing);
      return v2 as AppState;
    }
  } catch {}
  try {
    const v1 = JSON.parse(localStorage.getItem("mealtimer.v1") ?? "null");
    if (v1) {
      const id = uid();
      const p: Preset = { ...presetDefaults(), ...v1, name: "Default", names: {} };
      return makeInitialState(id, p);
    }
  } catch {}
  const id = uid();
  return makeInitialState(id, presetDefaults());
}

function makeInitialState(id: string, p: Preset): AppState {
  return {
    presets: { [id]: p },
    currentPresetId: id,
    editing: clone(p),
    notificationsEnabled: false,
    swipeEnabled: false,
    doneMeals: {},
  };
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function parseTime(s: string): number {
  if (!s || !/^\d{1,2}:\d{2}$/.test(s)) return NaN;
  const [h, m] = s.split(":").map(Number);
  if (h > 23 || m > 59) return NaN;
  return h * 60 + m;
}

export function fmtTime(mins: number): string {
  mins = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

export function fmtHours(mins: number): string {
  const h = Math.abs(mins) / 60;
  return (Math.round(h * 100) / 100).toString() + "h";
}

export function fmtCountdown(mins: number): string {
  const total = Math.max(0, Math.floor(mins));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function todayKey(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// ─── Schedule computation ─────────────────────────────────────────────────────

export type ComputeResult =
  | { times: number[]; error?: never }
  | { error: string; times?: never };

export function compute(p: Preset): ComputeResult {
  const N = p.meals;

  if (p.mode === "spread") {
    const first = parseTime(p.first);
    let last = parseTime(p.last);
    if (isNaN(first)) return { error: "Invalid first meal time" };
    if (isNaN(last)) return { error: "Invalid last meal time" };
    if (last === first) return { error: "First and last meal cannot be identical" };
    if (last < first) last += 1440;
    const step = (last - first) / (N - 1);
    return { times: Array.from({ length: N }, (_, i) => first + step * i) };
  }

  if (p.mode === "gap") {
    const g = p.gap * 60;
    if (!(g > 0)) return { error: "Gap must be positive" };
    let refIdx: number, refTime: number;
    if (p.gapAnchor === "first") {
      refIdx = 1;
      refTime = parseTime(p.first);
    } else if (p.gapAnchor === "last") {
      refIdx = N;
      refTime = parseTime(p.last);
    } else {
      refIdx = p.gapAnchorIdx;
      refTime = parseTime(p.gapAnchorTime);
    }
    if (isNaN(refTime)) return { error: "Invalid anchor time" };
    if (p.gapAnchor === "specific" && (refIdx < 1 || refIdx > N))
      return { error: "Anchor meal out of range" };
    return {
      times: Array.from({ length: N }, (_, i) => refTime + g * (i + 1 - refIdx)),
    };
  }

  if (p.mode === "anchor") {
    if (N < 3) return { error: "Anchor mode needs at least 3 meals" };
    const first = parseTime(p.first);
    let last = parseTime(p.last);
    if (isNaN(first) || isNaN(last))
      return { error: "Invalid first or last meal time" };
    const anchors = (p.anchors ?? []).slice().sort((a, b) => a.idx - b.idx);
    const points: { idx: number; time: number }[] = [{ idx: 1, time: first }];
    for (const a of anchors) {
      if (a.idx < 2 || a.idx > N - 1)
        return { error: `Anchor meal # must be 2 to ${N - 1}` };
      if (a.idx <= points[points.length - 1].idx)
        return { error: "Anchor meal numbers must be unique and ordered" };
      let t = parseTime(a.time);
      if (isNaN(t)) return { error: "Invalid anchor time" };
      const prevT = points[points.length - 1].time;
      if (t < prevT) t += 1440;
      if (t <= prevT) return { error: "Anchor times must increase" };
      points.push({ idx: a.idx, time: t });
    }
    const prevT = points[points.length - 1].time;
    if (last < prevT) last += 1440;
    if (last <= prevT) return { error: "Last meal must be after previous anchor" };
    points.push({ idx: N, time: last });
    const times = new Array<number>(N);
    for (let s = 0; s < points.length - 1; s++) {
      const from = points[s],
        to = points[s + 1];
      const step = (to.time - from.time) / (to.idx - from.idx);
      for (let k = from.idx; k < to.idx; k++)
        times[k - 1] = from.time + step * (k - from.idx);
    }
    times[N - 1] = last;
    return { times };
  }

  return { error: "Unknown mode" };
}

// ─── Meal helpers ─────────────────────────────────────────────────────────────

export function presetDays(p: Preset): number[] {
  return Array.isArray(p.days) && p.days.length ? p.days : [0, 1, 2, 3, 4, 5, 6];
}

export function isActiveToday(p: Preset): boolean {
  return presetDays(p).includes(new Date().getDay());
}

export function currentNextIdx(
  times: number[],
  doneMeals: Record<string, number[]>
): number {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const done = doneMeals[todayKey()] ?? [];
  for (let i = 0; i < times.length; i++) {
    if (times[i] > nowMins && !done.includes(i + 1)) return i;
  }
  return -1;
}

export function pinnedSet(p: Preset): Set<number> {
  const s = new Set<number>();
  if (p.mode === "spread") {
    s.add(1);
    s.add(p.meals);
  } else if (p.mode === "anchor") {
    s.add(1);
    s.add(p.meals);
    (p.anchors ?? []).forEach((a) => s.add(a.idx));
  } else if (p.mode === "gap") {
    if (p.gapAnchor === "first") s.add(1);
    else if (p.gapAnchor === "last") s.add(p.meals);
    else s.add(p.gapAnchorIdx);
  }
  return s;
}

export function tagFor(mealNum: number, p: Preset): string {
  const pinned = pinnedSet(p);
  if (!pinned.has(mealNum)) return "";
  if (
    p.mode === "anchor" &&
    (p.anchors ?? []).some((a: Anchor) => a.idx === mealNum)
  )
    return "anchor";
  if (
    p.mode === "gap" &&
    p.gapAnchor === "specific" &&
    mealNum === p.gapAnchorIdx
  )
    return "anchor";
  if (mealNum === 1) return "first";
  if (mealNum === p.meals) return "last";
  return "anchor";
}

// ─── Export ───────────────────────────────────────────────────────────────────

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function icsEscape(s: string): string {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDT(d: Date, utc: boolean): string {
  const p = (n: number) => String(n).padStart(2, "0");
  if (utc)
    return (
      d.getUTCFullYear() +
      p(d.getUTCMonth() + 1) +
      p(d.getUTCDate()) +
      "T" +
      p(d.getUTCHours()) +
      p(d.getUTCMinutes()) +
      p(d.getUTCSeconds()) +
      "Z"
    );
  return (
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    "T" +
    p(d.getHours()) +
    p(d.getMinutes()) +
    "00"
  );
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function generateICS(preset: Preset, times: number[], presetId: string): string {
  const now = new Date();
  const days = presetDays(preset);
  const rrule =
    days.length === 7
      ? "RRULE:FREQ=DAILY"
      : `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => DAY_CODES[d]).join(",")}`;
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < 7; i++) {
    if (days.includes(base.getDay())) break;
    base.setDate(base.getDate() + 1);
  }
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meal Timer//EN",
    "CALSCALE:GREGORIAN",
  ];
  times.forEach((mins, i) => {
    const start = new Date(base.getTime() + mins * 60000);
    const end = new Date(start.getTime() + 15 * 60000);
    const name = preset.names[i + 1] || `Meal ${i + 1}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:mealtimer-${presetId}-${i + 1}-${Date.now()}@local`,
      `DTSTAMP:${toIcsDT(now, true)}`,
      `DTSTART:${toIcsDT(start, false)}`,
      `DTEND:${toIcsDT(end, false)}`,
      `SUMMARY:${icsEscape(name)}`,
      `DESCRIPTION:${icsEscape(preset.name)} — meal ${i + 1}`,
      rrule,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(name)}`,
      "TRIGGER:-PT0M",
      "END:VALARM",
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
