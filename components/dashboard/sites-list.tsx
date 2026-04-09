"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Site } from "./sites-crud";

export function SitesList({ sites }: { sites: Site[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("site_id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAndSorted = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = sites.filter((site) => {
      if (!normalizedSearch) {
        return true;
      }
      const haystack = `${site.site_id ?? ""} ${site.base_url ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    return [...filtered].sort((left, right) => {
      const leftValue = sortBy === "base_url" ? left.base_url ?? "" : left.site_id ?? "";
      const rightValue = sortBy === "base_url" ? right.base_url ?? "" : right.site_id ?? "";
      const comparison = leftValue.localeCompare(rightValue);
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [sites, search, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const pagedSites = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Sites</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Search site ID or URL"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="md:col-span-2"
          />
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="site_id">Site ID</SelectItem>
              <SelectItem value="base_url">Base URL</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortDir}
            onValueChange={(value) => {
              setSortDir(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ul className="space-y-2">
          {pagedSites.length === 0 ? (
            <li>No sites found.</li>
          ) : (
            pagedSites.map((site) => (
              <li key={site.site_id} className="flex items-center gap-2">
                <span className="font-mono text-sm">{site.site_id}</span>
                <span className="truncate max-w-xs">{site.base_url}</span>
                <Link href={`/dashboard/logs?site=${site.site_id}`}>
                  <Button size="sm" variant="outline">
                    View Logs
                  </Button>
                </Link>
              </li>
            ))
          )}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({filteredAndSorted.length} matched)
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
