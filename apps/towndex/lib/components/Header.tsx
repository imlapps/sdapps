"use client";
import { SearchBox } from "@/lib/components/SearchBox";
import { useClientConfiguration } from "@/lib/hooks/useClientConfiguration";
import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor, Burger, Group, Text } from "@mantine/core";
import { SearchEngine } from "@sdapps/search";
import {
  IconBinaryTree2Filled,
  IconBuilding,
  IconCalendar,
  IconUser,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import classes from "./Header.module.css";

export function Header({
  opened,
  searchEngineJson,
  toggle,
}: {
  opened: boolean;
  searchEngineJson: SearchEngine.Json;
  toggle: () => void;
}) {
  const configuration = useClientConfiguration();
  const hrefs = useHrefs();
  const translations = useTranslations("Header");
  const links = [
    {
      icon: <IconCalendar />,
      link: hrefs.events,
      label: translations("Events"),
    },
    {
      icon: <IconBuilding />,
      link: hrefs.organizations,
      label: translations("Organizations"),
    },
    { icon: <IconUser />, link: hrefs.people, label: translations("People") },
  ];

  return (
    <header className={classes["header"]}>
      <div className={classes["inner"]}>
        <Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          <Anchor href={hrefs.locale}>
            <Group gap="sm">
              <IconBinaryTree2Filled size={28} stroke={1.5} />
              <Text>Towndex: {configuration.siteTitle}</Text>
            </Group>
          </Anchor>
        </Group>

        <Group>
          <SearchBox searchEngineJson={searchEngineJson} />
          <Group ml={50} gap={5} className={classes["links"]} visibleFrom="sm">
            {links.map((link) => (
              <a key={link.label} href={link.link} className={classes["link"]}>
                <Group gap={2}>
                  {link.icon}
                  <Text>{link.label}</Text>
                </Group>
              </a>
            ))}
          </Group>
        </Group>
      </div>
    </header>
  );
}
