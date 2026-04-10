import { getCurrentSession } from "@/lib/session";
import { env } from "@/lib/env";
import { SiteLogs } from "../../../../components/dashboard/site_logs";
import LogsSitesList from "../../../../components/dashboard/logs_sites_list";

export default async function LogsPage({ searchParams }: { searchParams?: { site?: string } }) {
  const session = await getCurrentSession();
  const accessToken = session?.accessToken ?? "";
  const siteId = searchParams?.site || "";

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Site Logs</h1>
      {siteId ? (
        <SiteLogs siteId={siteId} accessToken={accessToken} />
      ) : (
        <div>
          <p className="mb-4">Select a site to view its logs:</p>
          <LogsSitesList />
        </div>
      )}
    </div>
  );
}
