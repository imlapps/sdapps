"use client";
import { useHrefs } from "@/lib/hooks/useHrefs";
import { Burger, Group } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import classes from "./Header.module.css";

export function Header({
  opened,
  toggle,
}: { opened: boolean; toggle: () => void }) {
  const hrefs = useHrefs();
  const links = [{ link: hrefs.people, label: "People" }];

  return (
    <header className={classes["header"]}>
      <div className={classes["inner"]}>
        <Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          <IconSearch size={28} stroke={1.5} />
        </Group>

        <Group>
          <Group ml={50} gap={5} className={classes["links"]} visibleFrom="sm">
            {links.map((link) => (
              <a key={link.label} href={link.link} className={classes["link"]}>
                {link.label}
              </a>
            ))}
          </Group>
        </Group>
      </div>
    </header>
  );
}
