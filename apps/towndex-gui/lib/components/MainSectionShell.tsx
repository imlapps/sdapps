import { Group, Stack, Title } from "@mantine/core";
import { PropsWithChildren } from "react";

export function MainSectionShell({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  return (
    <Stack>
      <Title size="lg" style={{ textAlign: "center" }}>
        {title}
      </Title>
      <Group mx="auto">{children}</Group>
    </Stack>
  );
}
