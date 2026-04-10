import {
  SitesPageClient,
  type Site,
} from "@/components/dashboard/sites_page_client";
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
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept-Encoding": "identity",
      };

      const sitesResponse = await fetch(
        `${env.API_URL}/sites?uptime_days=90&page_size=100`,
        {
          method: "GET",
          cache: "no-store",
          headers,
        },
      );

      if (!sitesResponse.ok) {
        const body = await sitesResponse.text().catch(() => "");
        throw new Error(
          `Failed to fetch sites: ${sitesResponse.status} ${sitesResponse.statusText}${body ? ` - ${body}` : ""}`,
        );
      }

      const sitesData = (await sitesResponse.json()) as { sites?: Site[] };
      sites = Array.isArray(sitesData.sites) ? sitesData.sites : [];
    } catch (error) {
      initialError =
        error instanceof Error ? error.message : "Unable to load sites.";
    }
  }

  return (
    <SitesPageClient
      initialSites={sites}
      accessToken={accessToken}
      initialError={initialError}
    />
  );
}
