import { getCurrentSession } from "@/lib/session";
import { env } from "@/lib/env";
import { SitesList } from "@/components/dashboard/sites-list";
import { Site } from "@/components/dashboard/sites-crud";

export default async function LogsSitesList() {
  const session = await getCurrentSession();
  const accessToken = session?.accessToken ?? "";
  let sites: Site[] = [];

  if (accessToken) {
    try {
      const response = await fetch(`${env.API_URL}/sites`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        sites = Array.isArray(data.sites) ? data.sites : [];
      }
    } catch {}
  }

  return <SitesList sites={sites} />;
}
