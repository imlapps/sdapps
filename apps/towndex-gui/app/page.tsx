import { getHrefs } from "@/lib/getHrefs";
import { routing } from "@/lib/routing";
import { redirect } from "next/navigation";

export default async function RootPage() {
  redirect((await getHrefs({ locale: routing.defaultLocale })).locale);
}
