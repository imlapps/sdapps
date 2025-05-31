import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "@/lib/logger";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { LunrSearchEngine, SearchEngine } from "@sdapps/search";
import { getLocale } from "next-intl/server";

async function getLunrSearchEngineJson({
  locale,
}: {
  locale: Locale;
}): Promise<SearchEngine.Json> {
  const searchEngineJsonDirPath = path.join(
    serverConfiguration.cachesDirectoryPath,
    "search-engines",
  );

  const searchEngineJsonFilePath = path.join(
    searchEngineJsonDirPath,
    `${locale}.json`,
  );

  let searchEngineJsonFileContents: Buffer | undefined;
  try {
    searchEngineJsonFileContents = await fs.readFile(searchEngineJsonFilePath);
  } catch {
    /* empty */
  }

  let searchEngineJson: SearchEngine.Json;
  if (searchEngineJsonFileContents) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    searchEngineJson = JSON.parse(searchEngineJsonFileContents.toString());
  } else {
    logger.info(`creating ${locale} search engine`);
    const searchEngine = await LunrSearchEngine.create({
      languageTag: locale,
      modelSet,
    });
    logger.info(`created ${locale} search engine`);

    const searchEngineJsonString = JSON.stringify(searchEngine.toJson());
    searchEngineJson = JSON.parse(searchEngineJsonString);

    logger.info(
      `writing ${locale} search engine JSON to ${searchEngineJsonFilePath}`,
    );
    await fs.mkdir(searchEngineJsonDirPath, { recursive: true });
    await fs.writeFile(searchEngineJsonFilePath, searchEngineJsonString);
    logger.info(
      `wrote ${locale} search engine JSON to ${searchEngineJsonFilePath}`,
    );
  }

  return searchEngineJson;
}

export async function getSearchEngineJson(): Promise<SearchEngine.Json> {
  const locale = (await getLocale()) as Locale;
  return getLunrSearchEngineJson({ locale });
}
