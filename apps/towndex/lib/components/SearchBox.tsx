import { Locale } from "@/lib/models/Locale";
import { Combobox, Loader, TextInput, useCombobox } from "@mantine/core";
import { SearchEngine, SearchResults } from "@sdapps/search";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";

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
        setValue(optionValue);
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
                  value={searchResult.label}
                >
                  {searchResult.label}
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
