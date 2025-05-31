"use client";

import { Header } from "@/lib/components/Header";
import {
  Group,
  AppShell as MantineAppShell,
  Stack,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { SearchEngine } from "@sdapps/search";
import { PropsWithChildren } from "react";

export function AppShell({
  children,
  searchEngineJson,
  title,
}: PropsWithChildren<{ searchEngineJson: SearchEngine.Json; title: string }>) {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <MantineAppShell
      header={{ height: 60 }}
      // navbar={{
      //   width: 300,
      //   breakpoint: "sm",
      //   collapsed: { mobile: !opened },
      // }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Header
          opened={opened}
          searchEngineJson={searchEngineJson}
          toggle={toggle}
        />
      </MantineAppShell.Header>

      <MantineAppShell.Main>
        {title ? (
          <Stack>
            <Title size="lg" style={{ textAlign: "center" }}>
              {title}
            </Title>
            <Group mx="auto">{children}</Group>
          </Stack>
        ) : (
          <>{children}</>
        )}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
