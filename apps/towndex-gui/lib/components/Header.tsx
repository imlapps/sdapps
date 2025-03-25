"use client";
import { useHrefs } from "@/lib/hooks/useHrefs";
import { Burger, Group } from "@mantine/core";
import { IconBinaryTree2Filled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import classes from "./Header.module.css";

export function Header({
  opened,
  toggle,
}: { opened: boolean; toggle: () => void }) {
  const hrefs = useHrefs();
  const translations = useTranslations("Header");
  const links = [
    { link: hrefs.organizations, label: translations("Organizations") },
    { link: hrefs.people, label: translations("People") },
  ];

  return (
    <header className={classes["header"]}>
      <div className={classes["inner"]}>
        <Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          <IconBinaryTree2Filled size={28} stroke={1.5} />
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
