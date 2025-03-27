import { routing } from "@/lib/routing";
import { redirect } from "next/navigation";

export default async function RootPage() {
  // Don't use Hrefs here, since they prepend basePath explicitly and redirect does that implicitly.
  redirect(`/${routing.defaultLocale}`);
}
