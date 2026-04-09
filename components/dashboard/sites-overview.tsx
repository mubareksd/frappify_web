"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Globe, HelpCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { env } from "@/lib/env";

export type OverviewSite = {
  id: number;
  site_id: string;
  base_url: string;
  current_status: "up" | "down" | "unknown";
  uptime_percentage: number | null;
  checks: number;
  last_checked_at: string | null;
};

export type SitesOverview = {
  window_days: number;
  total_sites: number;
  up_sites: number;
  down_sites: number;
  unknown_sites: number;
  checked_sites: number;
  average_uptime_percentage: number | null;
  sites: OverviewSite[];
};

type SitesOverviewResponse = {
  overview?: SitesOverview;
};

type SitesOverviewProps = {
  initialOverview: SitesOverview | null;
  accessToken: string;
  initialError?: string | null;
};

const statusChartConfig = {
  sites: {
    label: "Sites",
  },
  up: {
    label: "Up",
    color: "#16a34a",
  },
  down: {
    label: "Down",
    color: "#dc2626",
  },
  unknown: {
    label: "Unknown",
    color: "#64748b",
  },
} satisfies ChartConfig;

const uptimeChartConfig = {
  uptime: {
    label: "90D uptime",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export function SitesOverviewPanel({
  initialOverview,
  accessToken,
  initialError = null,
}: SitesOverviewProps) {
  const [overview, setOverview] = useState<SitesOverview | null>(
    initialOverview,
  );
  const [error, setError] = useState<string | null>(initialError);

  const hasAccessToken = accessToken.trim().length > 0;

  async function refreshOverview({
    silent = false,
  }: { silent?: boolean } = {}) {
    if (!hasAccessToken) {
      return;
    }

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/sites/overview?uptime_days=90`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          body ||
            `Request failed with ${response.status} ${response.statusText}`,
        );
      }

      const payload = (await response.json()) as SitesOverviewResponse;
      setOverview(payload.overview ?? null);
      setError(null);
    } catch (refreshError) {
      if (silent) {
        return;
      }

      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to load site overview.",
      );
    }
  }

  useEffect(() => {
    if (!hasAccessToken) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshOverview({ silent: true });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [hasAccessToken]);

  const statusChartData = useMemo(
    () => [
      {
        status: "up",
        value: overview?.up_sites ?? 0,
        fill: "var(--color-up)",
      },
      {
        status: "down",
        value: overview?.down_sites ?? 0,
        fill: "var(--color-down)",
      },
      {
        status: "unknown",
        value: overview?.unknown_sites ?? 0,
        fill: "var(--color-unknown)",
      },
    ],
    [overview],
  );

  const uptimeChartData = useMemo(() => {
    return [...(overview?.sites ?? [])]
      .filter((site) => site.uptime_percentage !== null)
      .sort(
        (left, right) =>
          (right.uptime_percentage ?? 0) - (left.uptime_percentage ?? 0),
      )
      .slice(0, 8)
      .map((site) => ({
        site_id: site.site_id,
        uptime: Number((site.uptime_percentage ?? 0).toFixed(2)),
      }));
  }, [overview]);

  const latestCheckedAt = useMemo(() => {
    const timestamps = (overview?.sites ?? [])
      .map((site) => site.last_checked_at)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((left, right) => right.getTime() - left.getTime());

    if (!timestamps.length) {
      return "No automatic checks recorded yet";
    }

    return timestamps[0].toLocaleString();
  }, [overview]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Site health checks run automatically in the backend and this overview
          refreshes periodically.
        </p>
        <p className="text-xs text-muted-foreground">
          Latest automatic check: {latestCheckedAt}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {overview?.total_sites ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Monitored properties in this account.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Up</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-green-600">
              {overview?.up_sites ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Healthy at the latest automatic check.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Down</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-destructive">
              {overview?.down_sites ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Returned failures or timed out most recently.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unknown</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {overview?.unknown_sites ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Sites with no checks in the 90-day window.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top 90-Day Uptime</CardTitle>
            <CardDescription>
              Highest uptime percentages across monitored sites.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uptimeChartData.length ? (
              <ChartContainer
                config={uptimeChartConfig}
                className="min-h-72 w-full"
              >
                <BarChart accessibilityLayer data={uptimeChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="site_id"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="uptime" fill="var(--color-uptime)" radius={8} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
                Uptime data will appear after automatic checks are recorded.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Latest status snapshot across all sites.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.some((item) => item.value > 0) ? (
              <ChartContainer
                config={statusChartConfig}
                className="min-h-72 w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="status" hideLabel />}
                  />
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="status"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
                No status distribution is available yet.
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">Up</div>
                <div className="text-lg font-semibold text-green-600">
                  {overview?.up_sites ?? 0}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">Down</div>
                <div className="text-lg font-semibold text-destructive">
                  {overview?.down_sites ?? 0}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">Average uptime</div>
                <div className="text-lg font-semibold">
                  {overview?.average_uptime_percentage !== null &&
                  overview?.average_uptime_percentage !== undefined
                    ? `${overview.average_uptime_percentage.toFixed(2)}%`
                    : "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
