import {
  SitesOverviewPanel,
  type SitesOverview,
} from "@/components/dashboard/sites-overview";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const accessToken = session?.accessToken ?? "";

  let overview: SitesOverview | null = null;
  let initialError: string | null = null;

  if (!accessToken) {
    initialError = "You need an active session to view dashboard statistics.";
  } else {
    try {
      const response = await fetch(
        `${env.API_URL}/sites/overview?uptime_days=90`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Accept-Encoding": "identity",
          },
        },
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `Failed to fetch site overview: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`,
        );
      }

      const payload = (await response.json()) as { overview?: SitesOverview };
      overview = payload.overview ?? null;
    } catch (error) {
      initialError =
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data.";
    }
  }

  return (
    <SitesOverviewPanel
      initialOverview={overview}
      accessToken={accessToken}
      initialError={initialError}
    />
  );
}
