"use client";

import { Header } from "@/lib/components/Header";
import { AppShell as MantineAppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Header opened={opened} toggle={toggle} />
      </MantineAppShell.Header>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
