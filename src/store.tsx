import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AppState, Preset } from "./types";
import {
  clone,
  compute,
  currentNextIdx,
  downloadFile,
  fingerprint,
  fmtTime,
  generateICS,
  isActiveToday,
  loadInitialState,
  migratePreset,
  pinnedSet,
  presetDefaults,
  presetDays,
  saveState,
  tagFor,
  todayKey,
  uid,
} from "./utils";

// ─── Context type ─────────────────────────────────────────────────────────────

interface StoreContextValue {
  // State
  preset: Preset;
  presets: Record<string, Preset>;
  currentPresetId: string;
  isDirty: boolean;
  doneMeals: Record<string, number[]>;
  notificationsEnabled: boolean;
  swipeEnabled: boolean;

  // Computed
  times: string[]; // "HH:MM" — empty if compute error
  rawTimes: number[]; // minutes since midnight
  computeError: string | null;
  nextIdx: number; // -1 if none

  // Preset field setters
  setMeals: (n: number) => void;
  setMode: (mode: Preset["mode"]) => void;
  setFirst: (time: string) => void;
  setLast: (time: string) => void;
  setGap: (hours: number) => void;
  setGapAnchor: (anchor: Preset["gapAnchor"]) => void;
  setGapAnchorIdx: (n: number) => void;
  setGapAnchorTime: (time: string) => void;
  setRound30: (v: boolean) => void;
  setPresetName: (name: string) => void;
  setMealName: (num: number, name: string) => void;
  toggleDay: (day: number) => void;
  addAnchor: () => void;
  removeAnchor: (i: number) => void;
  updateAnchorIdx: (i: number, idx: number) => void;
  updateAnchorTime: (i: number, time: string) => void;

  // Preset management
  savePreset: () => void;
  discardChanges: () => void;
  switchPreset: (id: string) => void;
  createPreset: () => string;
  duplicatePreset: () => void;
  deletePreset: () => boolean;
  reorderPresets: (orderedIds: string[]) => void;

  // Done meals
  toggleDone: (mealNum: number) => void;
  isDone: (mealNum: number) => boolean;

  // Preferences
  setNotificationsEnabled: (v: boolean) => Promise<void>;
  setSwipeEnabled: (v: boolean) => void;

  // Export / import
  exportIcs: () => void;
  exportJson: () => void;
  importPreset: (file: File) => Promise<void>;

  // Utilities exposed for UI
  fmtTime: (mins: number) => string;
  presetDays: (p: Preset) => number[];
  isActiveToday: (p: Preset) => boolean;
  pinnedSet: (p: Preset) => Set<number>;
  tagFor: (mealNum: number, p: Preset) => string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext<StoreContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(loadInitialState);

  const setState = useCallback((updater: (s: AppState) => AppState) => {
    setStateRaw((s) => {
      const next = updater(s);
      saveState(next);
      return next;
    });
  }, []);

  const updateEditing = useCallback(
    (fn: (p: Preset) => void) => {
      setState((s) => {
        const next = clone(s.editing);
        fn(next);
        return { ...s, editing: next };
      });
    },
    [setState]
  );

  // Auto-switch to a preset active today on mount
  useEffect(() => {
    setState((s) => {
      if (fingerprint(s.editing) !== fingerprint(s.presets[s.currentPresetId]))
        return s;
      const today = new Date().getDay();
      if (presetDays(s.presets[s.currentPresetId]).includes(today)) return s;
      for (const id of Object.keys(s.presets)) {
        if (presetDays(s.presets[id]).includes(today)) {
          return { ...s, currentPresetId: id, editing: clone(s.presets[id]) };
        }
      }
      return s;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ──────────────────────────────────────────────────────────

  const computeResult = useMemo(() => compute(state.editing), [state.editing]);

  const rawTimes = useMemo(() => {
    if (computeResult.error) return [];
    return state.editing.round30
      ? computeResult.times.map((t) => Math.round(t / 30) * 30)
      : computeResult.times;
  }, [computeResult, state.editing.round30]);

  const times = useMemo(() => rawTimes.map(fmtTime), [rawTimes]);

  const computeError = useMemo(
    () => computeResult.error ?? null,
    [computeResult]
  );

  const nextIdx = useMemo(
    () => currentNextIdx(rawTimes, state.doneMeals),
    [rawTimes, state.doneMeals]
  );

  const isDirty = useMemo(() => {
    const saved = state.presets[state.currentPresetId];
    if (!saved) return false;
    return fingerprint(state.editing) !== fingerprint(saved);
  }, [state.editing, state.presets, state.currentPresetId]);

  // ── Notification scheduling ─────────────────────────────────────────────────

  const notifTimers = useRef<number[]>([]);

  useEffect(() => {
    notifTimers.current.forEach(clearTimeout);
    notifTimers.current = [];
    if (!state.notificationsEnabled || !rawTimes.length) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!isActiveToday(state.editing)) return;

    const preset = state.editing;
    const today0 = new Date();
    today0.setHours(0, 0, 0, 0);
    const now = Date.now();

    rawTimes.forEach((mins, i) => {
      const fireAt = today0.getTime() + mins * 60000;
      const delay = fireAt - now;
      if (delay > 500 && delay < 26 * 3600 * 1000) {
        const id = window.setTimeout(() => {
          try {
            new Notification(preset.names[i + 1] || `Meal ${i + 1}`, {
              body: `Time: ${fmtTime(mins)}`,
              icon: "icon.svg",
              tag: `meal-${state.currentPresetId}-${i + 1}`,
            });
          } catch {}
        }, delay);
        notifTimers.current.push(id);
      }
    });

    return () => {
      notifTimers.current.forEach(clearTimeout);
      notifTimers.current = [];
    };
  }, [rawTimes, state.notificationsEnabled, state.editing, state.currentPresetId]);

  // ── Preset field setters ────────────────────────────────────────────────────

  const setMeals = useCallback(
    (n: number) =>
      updateEditing((p) => {
        p.meals = n;
        if (p.gapAnchorIdx > n) p.gapAnchorIdx = n;
        p.anchors = (p.anchors ?? []).filter((a) => a.idx <= n - 1);
        Object.keys(p.names).forEach((k) => {
          if (Number(k) > n) delete p.names[Number(k)];
        });
      }),
    [updateEditing]
  );

  const setMode = useCallback(
    (mode: Preset["mode"]) => updateEditing((p) => { p.mode = mode; }),
    [updateEditing]
  );

  const setFirst = useCallback(
    (time: string) => updateEditing((p) => { p.first = time; }),
    [updateEditing]
  );

  const setLast = useCallback(
    (time: string) => updateEditing((p) => { p.last = time; }),
    [updateEditing]
  );

  const setGap = useCallback(
    (hours: number) => updateEditing((p) => { p.gap = hours; }),
    [updateEditing]
  );

  const setGapAnchor = useCallback(
    (anchor: Preset["gapAnchor"]) => updateEditing((p) => { p.gapAnchor = anchor; }),
    [updateEditing]
  );

  const setGapAnchorIdx = useCallback(
    (n: number) => updateEditing((p) => { p.gapAnchorIdx = n; }),
    [updateEditing]
  );

  const setGapAnchorTime = useCallback(
    (time: string) => updateEditing((p) => { p.gapAnchorTime = time; }),
    [updateEditing]
  );

  const setRound30 = useCallback(
    (v: boolean) => updateEditing((p) => { p.round30 = v; }),
    [updateEditing]
  );

  const setPresetName = useCallback(
    (name: string) => updateEditing((p) => { p.name = name; }),
    [updateEditing]
  );

  const setMealName = useCallback(
    (num: number, name: string) =>
      updateEditing((p) => {
        if (name.trim()) p.names[num] = name.trim();
        else delete p.names[num];
      }),
    [updateEditing]
  );

  const toggleDay = useCallback(
    (day: number) =>
      updateEditing((p) => {
        if (!Array.isArray(p.days)) p.days = [0, 1, 2, 3, 4, 5, 6];
        const i = p.days.indexOf(day);
        if (i >= 0) {
          if (p.days.length > 1) p.days.splice(i, 1);
        } else {
          p.days.push(day);
          p.days.sort((a, b) => a - b);
        }
      }),
    [updateEditing]
  );

  const addAnchor = useCallback(
    () =>
      updateEditing((p) => {
        const used = new Set((p.anchors ?? []).map((a) => a.idx));
        let idx = 2;
        while (used.has(idx) && idx <= p.meals - 1) idx++;
        if (idx > p.meals - 1) return;
        p.anchors = [...(p.anchors ?? []), { idx, time: "14:00" }];
      }),
    [updateEditing]
  );

  const removeAnchor = useCallback(
    (i: number) =>
      updateEditing((p) => {
        p.anchors = (p.anchors ?? []).filter((_, j) => j !== i);
      }),
    [updateEditing]
  );

  const updateAnchorIdx = useCallback(
    (i: number, idx: number) =>
      updateEditing((p) => {
        if (p.anchors?.[i]) p.anchors[i].idx = idx;
      }),
    [updateEditing]
  );

  const updateAnchorTime = useCallback(
    (i: number, time: string) =>
      updateEditing((p) => {
        if (p.anchors?.[i]) p.anchors[i].time = time;
      }),
    [updateEditing]
  );

  // ── Preset management ───────────────────────────────────────────────────────

  const savePreset = useCallback(
    () =>
      setState((s) => ({
        ...s,
        presets: { ...s.presets, [s.currentPresetId]: clone(s.editing) },
      })),
    [setState]
  );

  const discardChanges = useCallback(
    () =>
      setState((s) => ({
        ...s,
        editing: clone(s.presets[s.currentPresetId]),
      })),
    [setState]
  );

  const switchPreset = useCallback(
    (id: string) =>
      setState((s) => {
        if (id === s.currentPresetId || !s.presets[id]) return s;
        return { ...s, currentPresetId: id, editing: clone(s.presets[id]) };
      }),
    [setState]
  );

  const createPreset = useCallback(() => {
    const id = uid();
    const p: Preset = { ...presetDefaults(), name: "New preset" };
    setState((s) => ({
      ...s,
      presets: { ...s.presets, [id]: p },
      currentPresetId: id,
      editing: clone(p),
    }));
    return id;
  }, [setState]);

  const duplicatePreset = useCallback(
    () =>
      setState((s) => {
        const id = uid();
        const p: Preset = clone({
          ...s.editing,
          name: (s.editing.name || "Preset") + " copy",
        });
        return {
          ...s,
          presets: { ...s.presets, [id]: p },
          currentPresetId: id,
          editing: clone(p),
        };
      }),
    [setState]
  );

  const deletePreset = useCallback((): boolean => {
    let deleted = false;
    setState((s) => {
      if (Object.keys(s.presets).length <= 1) return s;
      deleted = true;
      const next = { ...s.presets };
      delete next[s.currentPresetId];
      const newId = Object.keys(next)[0];
      return { ...s, presets: next, currentPresetId: newId, editing: clone(next[newId]) };
    });
    return deleted;
  }, [setState]);

  const reorderPresets = useCallback(
    (orderedIds: string[]) =>
      setState((s) => {
        const next: Record<string, Preset> = {};
        orderedIds.forEach((id) => { if (s.presets[id]) next[id] = s.presets[id]; });
        Object.keys(s.presets).forEach((id) => { if (!next[id]) next[id] = s.presets[id]; });
        return { ...s, presets: next };
      }),
    [setState]
  );

  // ── Done meals ──────────────────────────────────────────────────────────────

  const toggleDone = useCallback(
    (mealNum: number) =>
      setState((s) => {
        const key = todayKey();
        const today = [...(s.doneMeals[key] ?? [])];
        const i = today.indexOf(mealNum);
        if (i >= 0) today.splice(i, 1);
        else today.push(mealNum);
        const cleaned: Record<string, number[]> = { [key]: today };
        return { ...s, doneMeals: cleaned };
      }),
    [setState]
  );

  const isDone = useCallback(
    (mealNum: number): boolean =>
      (state.doneMeals[todayKey()] ?? []).includes(mealNum),
    [state.doneMeals]
  );

  // ── Preferences ─────────────────────────────────────────────────────────────

  const setNotificationsEnabled = useCallback(
    async (v: boolean): Promise<void> => {
      if (v) {
        if (!("Notification" in window)) return;
        let perm = Notification.permission;
        if (perm === "default") perm = await Notification.requestPermission();
        if (perm !== "granted") return;
      }
      setState((s) => ({ ...s, notificationsEnabled: v }));
    },
    [setState]
  );

  const setSwipeEnabled = useCallback(
    (v: boolean) => setState((s) => ({ ...s, swipeEnabled: v })),
    [setState]
  );

  // ── Export / import ─────────────────────────────────────────────────────────

  const exportIcs = useCallback(() => {
    if (!rawTimes.length) return;
    const ics = generateICS(state.editing, rawTimes, state.currentPresetId);
    downloadFile(`${state.editing.name || "meals"}.ics`, ics, "text/calendar");
  }, [rawTimes, state.editing, state.currentPresetId]);

  const exportJson = useCallback(() => {
    downloadFile(
      `${state.editing.name || "preset"}.json`,
      JSON.stringify(state.editing, null, 2),
      "application/json"
    );
  }, [state.editing]);

  const importPreset = useCallback(
    async (file: File): Promise<void> => {
      const text = await file.text();
      const data = JSON.parse(text);
      const cleaned: Preset = migratePreset({
        ...presetDefaults(),
        ...data,
        names: data.names ?? {},
      } as Record<string, unknown>);
      const id = uid();
      setState((s) => ({
        ...s,
        presets: { ...s.presets, [id]: cleaned },
        currentPresetId: id,
        editing: clone(cleaned),
      }));
    },
    [setState]
  );

  // ── Context value ───────────────────────────────────────────────────────────

  const value: StoreContextValue = {
    preset: state.editing,
    presets: state.presets,
    currentPresetId: state.currentPresetId,
    isDirty,
    doneMeals: state.doneMeals,
    notificationsEnabled: state.notificationsEnabled,
    swipeEnabled: state.swipeEnabled,
    times,
    rawTimes,
    computeError,
    nextIdx,
    setMeals,
    setMode,
    setFirst,
    setLast,
    setGap,
    setGapAnchor,
    setGapAnchorIdx,
    setGapAnchorTime,
    setRound30,
    setPresetName,
    setMealName,
    toggleDay,
    addAnchor,
    removeAnchor,
    updateAnchorIdx,
    updateAnchorTime,
    savePreset,
    discardChanges,
    switchPreset,
    createPreset,
    duplicatePreset,
    deletePreset,
    reorderPresets,
    toggleDone,
    isDone,
    setNotificationsEnabled,
    setSwipeEnabled,
    exportIcs,
    exportJson,
    importPreset,
    fmtTime,
    presetDays,
    isActiveToday,
    pinnedSet,
    tagFor,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
