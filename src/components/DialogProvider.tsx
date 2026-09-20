import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Transition,
} from "@mantine/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

// ─── Confirm ──────────────────────────────────────────────────────────────────

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastOptions {
  message: string;
  color?: "red" | "yellow" | "green" | "blue";
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface DialogContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  toast: (opts: ToastOptions) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DialogProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setConfirmState({ ...opts, resolve })),
    []
  );

  const toast = useCallback((opts: ToastOptions) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    const id = Date.now();
    setToastState({ ...opts, id });
    toastTimer.current = window.setTimeout(
      () => setToastState((t) => (t?.id === id ? null : t)),
      opts.duration ?? 3500
    );
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    },
    []
  );

  const handle = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmState(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, toast }}>
      {children}

      <Modal
        opened={!!confirmState}
        onClose={() => handle(false)}
        title={confirmState?.title ?? "Confirm"}
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">{confirmState?.message}</Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => handle(false)}>
              {confirmState?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              color={confirmState?.danger ? "red" : undefined}
              onClick={() => handle(true)}
            >
              {confirmState?.confirmLabel ?? "Confirm"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        <Transition mounted={!!toastState} transition="slide-up" duration={200}>
          {(styles) => (
            <Alert
              color={toastState?.color ?? "blue"}
              variant="filled"
              style={{ ...styles, pointerEvents: "auto", maxWidth: 400 }}
              withCloseButton
              onClose={() => setToastState(null)}
            >
              {toastState?.message}
            </Alert>
          )}
        </Transition>
      </div>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
}
