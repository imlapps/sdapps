import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";

export default function LocaleLayout({ children }: { children: any }) {
  return (
    <ClientProvidersServer>
      <AppShell>{children}</AppShell>
    </ClientProvidersServer>
  );
}
