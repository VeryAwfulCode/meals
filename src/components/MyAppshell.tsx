import { AppShell, Group, Text } from "@mantine/core";
import { Cog, Drumstick } from "lucide-react";
import type { ReactNode } from "react";

function Logo() {
  return (
    <Group gap={3} style={{ cursor: "default" }}>
      <Drumstick size={12} />
      <Text variant="wordmark">MEALS</Text>
    </Group>
  );
}

export function MyAppshell({ children }: { children: ReactNode }) {
  return (
    <AppShell header={{ height: 45 }}>
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
          <Cog size={18} />
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
