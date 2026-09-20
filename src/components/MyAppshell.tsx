import {
  ActionIcon,
  AppShell,
  Group,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { Cog, Drumstick } from "lucide-react";
import type { ReactNode } from "react";
import { catppuccin } from "../catppuccin";
import { PresetsBar } from "./PresetsBar";

function Logo() {
  return (
    <Group gap={3} style={{ cursor: "default" }}>
      <Drumstick size={12} />
      <Text variant="wordmark">MEALS</Text>
    </Group>
  );
}

interface MyAppshellProps {
  children: ReactNode;
  onSettingsClick?: () => void;
}

export function MyAppshell({ children, onSettingsClick }: MyAppshellProps) {
  const { colorScheme } = useMantineColorScheme();
  const C = colorScheme === "light" ? catppuccin.latte : catppuccin.mocha;

  return (
    <AppShell
      header={{ height: 45 }}
      styles={{ header: { borderBottom: `1px solid ${C.surface1}` } }}
    >
      <AppShell.Header>
        <Group
          align="center"
          wrap="nowrap"
          gap="sm"
          style={{
            height: "100%",
            width: "90%",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <Logo />
          <PresetsBar />
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            onClick={onSettingsClick}
            aria-label="Settings"
            style={{ flexShrink: 0 }}
          >
            <Cog size={20} />
          </ActionIcon>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <div style={{ width: "90%", maxWidth: "900px", margin: "1rem auto" }}>
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
