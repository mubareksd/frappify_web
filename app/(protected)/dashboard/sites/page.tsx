import { SitesCrud, type Site } from "@/components/dashboard/sites-crud";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";

export default async function SitesPage() {
  const session = await getCurrentSession();
  const accessToken = session?.accessToken ?? "";

  let sites: Site[] = [];
  let initialError: string | null = null;

  if (!accessToken) {
    initialError = "You need an active session to manage sites.";
  } else {
    try {
      const response = await fetch(`${env.API_URL}/sites`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Encoding": "identity",
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `Failed to fetch sites: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`,
        );
      }

      const data = (await response.json()) as { sites?: Site[] };
      sites = Array.isArray(data.sites) ? data.sites : [];
    } catch (error) {
      initialError = error instanceof Error ? error.message : "Unable to load sites.";
    }
  }

  return <SitesCrud initialSites={sites} accessToken={accessToken} initialError={initialError} />;
}