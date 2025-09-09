import { Hrefs } from "@/lib/Hrefs";
import { routing } from "@/lib/routing";
import { redirect } from "next/navigation";

export default async function RootPage() {
  redirect(new Hrefs({ basePath: "", locale: routing.defaultLocale }).locale);
}
