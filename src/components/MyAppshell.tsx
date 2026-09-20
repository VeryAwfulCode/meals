import { AppShell, Group, Text, useMantineColorScheme } from "@mantine/core";
import { Cog, Drumstick } from "lucide-react";
import type { ReactNode } from "react";
import { catppuccin } from "../catppuccin";

function Logo() {
  return (
    <Group gap={3} style={{ cursor: "default" }}>
      <Drumstick size={12} />
      <Text variant="wordmark">MEALS</Text>
    </Group>
  );
}

export function MyAppshell({ children }: { children: ReactNode }) {
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
          justify="space-between"
          style={{
            width: "90%",
            maxWidth: "900px",
            margin: "0 auto",
            height: "100%",
          }}
        >
          <Logo />
          <Cog size={20} style={{ cursor: "pointer" }} />
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
