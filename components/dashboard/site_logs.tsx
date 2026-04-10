"use client";

import { useEffect, useState } from "react";
import { env } from "@/lib/env";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SiteLog = {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  ip_address: string;
  response_status: number;
  user_id?: number;
};

type LogsMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export function SiteLogs({ siteId, accessToken }: { siteId: string; accessToken: string }) {
  const [logs, setLogs] = useState<SiteLog[]>([]);
  const [meta, setMeta] = useState<LogsMeta>({ page: 1, page_size: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    if (!siteId || !accessToken) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      search,
      sort_by: sortBy,
      sort_dir: sortDir,
    });

    if (method !== "all") {
      params.set("method", method);
    }
    if (status.trim()) {
      params.set("status", status.trim());
    }

    fetch(`${env.NEXT_PUBLIC_API_URL}/sites/${siteId}/logs?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setMeta({
          page: data?.meta?.page ?? 1,
          page_size: data?.meta?.page_size ?? pageSize,
          total: data?.meta?.total ?? 0,
          total_pages: data?.meta?.total_pages ?? 1,
        });
      })
      .catch((err) => setError(err.message || "Failed to load logs"))
      .finally(() => setLoading(false));
  }, [siteId, accessToken, page, pageSize, search, method, status, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, method, status, sortBy, sortDir, pageSize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <Input
            placeholder="Search path, method, IP"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:col-span-2"
          />
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Status (e.g. 200)"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          />
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Time</SelectItem>
                <SelectItem value="method">Method</SelectItem>
                <SelectItem value="path">Path</SelectItem>
                <SelectItem value="response_status">Status</SelectItem>
                <SelectItem value="ip_address">IP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={setSortDir}>
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p>Loading logs...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : logs.length === 0 ? (
          <p>No logs found for this site.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.method}</TableCell>
                  <TableCell className="max-w-[16rem] truncate">{log.path}</TableCell>
                  <TableCell>{log.response_status}</TableCell>
                  <TableCell>{log.ip_address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing page {meta.page} of {meta.total_pages} ({meta.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((current) => Math.min(meta.total_pages, current + 1))}
              disabled={loading || page >= meta.total_pages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
