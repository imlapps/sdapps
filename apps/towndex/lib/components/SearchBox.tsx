import { Hrefs } from "@/lib/Hrefs";
import { Locale } from "@/lib/models/Locale";
import { Combobox, Loader, TextInput, useCombobox } from "@mantine/core";
import { Identifier } from "@sdapps/models";
import { SearchEngine, SearchResults } from "@sdapps/search";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { invariant } from "ts-invariant";

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
  const router = useRouter();
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
        const identifier = Identifier.fromString(searchResult.identifier);
        const hrefs = new Hrefs({ basePath: "", locale });
        let href: string;
        switch (searchResult.type) {
          case "Event":
            href = hrefs.event({ identifier });
            break;
          case "Organization":
            href = hrefs.organization({ identifier });
            break;
          case "Person":
            href = hrefs.person({ identifier });
            break;
        }
        router.push(href);
        setValue(searchResult.label);
        combobox.closeDropdown();
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
                  {searchResult.type}: {searchResult.label}
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
