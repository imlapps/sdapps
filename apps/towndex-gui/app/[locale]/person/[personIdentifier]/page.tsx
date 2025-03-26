import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { MainSectionShell } from "@/lib/components/MainSectionShell";
import { getHrefs } from "@/lib/getHrefs";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { routing } from "@/lib/routing";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Identifier, Person, PersonStub } from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface PersonPageParams {
  locale: Locale;
  personIdentifier: string;
}

export default async function PersonPage({
  params,
}: {
  params: Promise<PersonPageParams>;
}) {
  const { locale, personIdentifier } = await params;
  setRequestLocale(locale);

  const person = (
    await modelSet.model<Person>({
      identifier: Identifier.fromString(decodeFileName(personIdentifier)),
      type: "Person",
    })
  )
    .toMaybe()
    .extractNullable();
  if (!person) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("PersonPage");

  return (
    <MainSectionShell
      title={`${translations("Person")}: ${person.name.orDefault(personIdentifier)}`}
    >
      <div />
    </MainSectionShell>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PersonPageParams>;
}): Promise<Metadata> {
  const { locale, personIdentifier } = await params;

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await modelSet.model<PersonStub>({
      identifier: Identifier.fromString(decodeFileName(personIdentifier)),
      type: "PersonStub",
    })
  )
    .map((person) => pageMetadata.person(person))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<PersonPageParams[]> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: PersonPageParams[] = [];

  for (const locale of routing.locales) {
    for (const concept of (
      await (
        await project.modelSet({ locale })
      ).conceptStubs({
        limit: null,
        offset: 0,
        query: { type: "All" },
      })
    ).unsafeCoerce()) {
      staticParams.push({
        personIdentifier: encodeFileName(
          Identifier.toString(concept.identifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
