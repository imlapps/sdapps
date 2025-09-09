import { OrganizationIcon } from "@/lib/components/OrganizationIcon";
import { PersonIcon } from "@/lib/components/PersonIcon";
import { Locale } from "@/lib/models/Locale";
import {
  Combobox,
  Group,
  Loader,
  Text,
  TextInput,
  useCombobox,
} from "@mantine/core";
import { SearchEngine, SearchResult, SearchResults } from "@sdapps/search";
import { useLocale, useTranslations } from "next-intl";
import { ReactElement, useCallback, useMemo, useRef, useState } from "react";
import { invariant } from "ts-invariant";

function searchResultIcon(searchResult: SearchResult): ReactElement {
  switch (searchResult.type) {
    case "Event":
      throw new Error("not implemented");
    case "Organization":
      return <OrganizationIcon />;
    case "Person":
      return <PersonIcon />;
  }
}

/**
 * Search box adapted from https://mantine.dev/combobox/?e=AsyncAutocomplete
 */
export function SearchBox({
  searchEngineJson,
}: { searchEngineJson: SearchEngine.Json }) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const locale = useLocale() as Locale;
  const [loading, setLoading] = useState(false);
  // const router = useRouter();
  const searchEngine = useMemo(
    () => SearchEngine.fromJson(searchEngineJson),
    [searchEngineJson],
  );
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const translations = useTranslations("SearchBox");
  const [value, setValue] = useState("");
  const abortController = useRef<AbortController | null | undefined>(null);

  const fetchOptions = useCallback(
    (query: string) => {
      abortController.current?.abort();
      abortController.current = new AbortController();
      setLoading(true);

      // getAsyncData(query, abortController.current.signal)
      searchEngine
        .search({
          languageTag: locale,
          limit: 5,
          offset: 0,
          query,
        })
        .then((results) => {
          setLoading(false);
          setSearchResults(results);
          abortController.current = undefined;
        })
        .catch(() => {});
    },
    [locale, searchEngine],
  );

  return (
    <Combobox
      onOptionSubmit={(optionValue) => {
        invariant(searchResults !== null);
        const searchResult = searchResults.page.find(
          (searchResult) => searchResult.identifier === optionValue,
        );
        invariant(searchResult);
        // const identifier = Identifier.fromString(searchResult.identifier);
        // const hrefs = new Hrefs({ basePath: "", locale });
        // switch (searchResult.type) {
        //   case "Event":
        //     throw new Error("not implemented");
        //   case "Organization":
        //     href = hrefs.organization({ identifier });
        //     break;
        //   case "Person":
        //     href = hrefs.person({ identifier });
        //     break;
        // }
        throw new Error("not implemented");
        // router.push(href);
        // setValue(searchResult.label);
        // combobox.closeDropdown();
      }}
      store={combobox}
      withinPortal={false}
    >
      <Combobox.Target>
        <TextInput
          //   label="Pick value or type anything"
          placeholder={translations("Search")}
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            fetchOptions(event.currentTarget.value);
            combobox.resetSelectedOption();
            combobox.openDropdown();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => {
            combobox.openDropdown();
            if (searchResults === null) {
              fetchOptions(value);
            }
          }}
          onBlur={() => combobox.closeDropdown()}
          rightSection={loading && <Loader size={18} />}
          style={{ width: "24rem" }}
        />
      </Combobox.Target>

      <Combobox.Dropdown hidden={searchResults === null}>
        <Combobox.Options>
          {searchResults
            ? searchResults.page.map((searchResult) => (
                <Combobox.Option
                  key={searchResult.identifier}
                  value={searchResult.identifier}
                >
                  <Group gap={2}>
                    {searchResultIcon(searchResult)}
                    <Text>{searchResult.label}</Text>
                  </Group>
                </Combobox.Option>
              ))
            : null}
          {searchResults && searchResults.total === 0 ? (
            <Combobox.Empty>{translations("No results")}</Combobox.Empty>
          ) : null}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
