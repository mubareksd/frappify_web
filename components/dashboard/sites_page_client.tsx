"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { env } from "@/lib/env";

type SiteHealth = {
  window_days: number;
  checks: number;
  up_checks: number;
  uptime_percentage: number | null;
  current_status: "up" | "down" | "unknown";
  last_checked_at: string | null;
  last_status_code: number | null;
  last_response_time_ms: number | null;
  last_error: string | null;
};

export type Site = {
  id: number;
  site_id?: string;
  base_url?: string;
  user_id?: string | number;
  enable_ip_filter?: boolean;
  ip_filter_mode?: string;
  ip_filters?: string[];
  created_at?: string;
  updated_at?: string;
  health?: SiteHealth;
};

type SiteResponse = {
  site: Site;
};

type SitesResponse = {
  sites?: Site[];
};

type SitesPageClientProps = {
  initialSites: Site[];
  accessToken: string;
  initialError?: string | null;
};

function validateBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Base URL is required.";
  }

  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "Base URL must start with http:// or https://.";
    }
  } catch {
    return "Base URL must be a valid absolute URL.";
  }

  return null;
}

function sortSites(nextSites: Site[]) {
  return [...nextSites].sort((left, right) => left.id - right.id);
}

export function SitesPageClient({
  initialSites,
  accessToken,
  initialError = null,
}: SitesPageClientProps) {
  const [sites, setSites] = useState(() => sortSites(initialSites));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [enableIpFilter, setEnableIpFilter] = useState(false);
  const [ipFilterMode, setIpFilterMode] = useState("whitelist");
  const [ipFiltersInput, setIpFiltersInput] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");
  const [editEnableIpFilter, setEditEnableIpFilter] = useState(false);
  const [editIpFilterMode, setEditIpFilterMode] = useState("whitelist");
  const [editIpFiltersInput, setEditIpFiltersInput] = useState("");
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [sitePendingDelete, setSitePendingDelete] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [ipFilterState, setIpFilterState] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const hasAccessToken = useMemo(
    () => accessToken.trim().length > 0,
    [accessToken],
  );

  const filteredAndSortedSites = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = sites.filter((site) => {
      if (ipFilterState === "enabled" && !site.enable_ip_filter) {
        return false;
      }
      if (ipFilterState === "disabled" && site.enable_ip_filter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      const haystack =
        `${site.site_id ?? ""} ${site.base_url ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    const sorted = [...filtered].sort((left, right) => {
      const leftValue =
        sortBy === "site_id"
          ? (left.site_id ?? "")
          : sortBy === "base_url"
            ? (left.base_url ?? "")
            : left.id;

      const rightValue =
        sortBy === "site_id"
          ? (right.site_id ?? "")
          : sortBy === "base_url"
            ? (right.base_url ?? "")
            : right.id;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortDir === "asc"
          ? leftValue - rightValue
          : rightValue - leftValue;
      }

      const comparison = String(leftValue).localeCompare(String(rightValue));
      return sortDir === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [sites, search, ipFilterState, sortBy, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedSites.length / pageSize),
  );
  const pagedSites = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedSites.slice(start, start + pageSize);
  }, [filteredAndSortedSites, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function request<T>(path: string, init: RequestInit) {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        body || `Request failed with ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as T;
  }

  async function refreshSitesData({
    silent = false,
  }: { silent?: boolean } = {}) {
    if (!hasAccessToken) {
      return;
    }

    try {
      const sitesResponse = await request<SitesResponse>(
        "/sites?uptime_days=90&page_size=100",
        {
          method: "GET",
        },
      );

      setSites(
        sortSites(
          Array.isArray(sitesResponse.sites) ? sitesResponse.sites : [],
        ),
      );
    } catch (refreshError) {
      if (!silent) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to refresh sites.",
        );
        return;
      }

      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh sites.",
      );
    }
  }

  useEffect(() => {
    if (!hasAccessToken) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshSitesData({ silent: true });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [hasAccessToken]);

  async function handleCreateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasAccessToken) {
      setError("You need an active session to manage sites.");
      return;
    }

    const validationError = validateBaseUrl(baseUrl);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsCreating(true);
    setError(null);
    setFormError(null);

    try {
      const ipFilters = ipFiltersInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await request<SiteResponse>("/sites", {
        method: "POST",
        body: JSON.stringify({
          base_url: baseUrl.trim(),
          enable_ip_filter: enableIpFilter,
          ip_filter_mode: ipFilterMode,
          ip_filters: ipFilters,
        }),
      });

      setSites((current) => sortSites([...current, response.site]));
      setBaseUrl("");
      setEnableIpFilter(false);
      setIpFilterMode("whitelist");
      setIpFiltersInput("");
      setIsCreateDialogOpen(false);
      void refreshSitesData({ silent: true });
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create site.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function openFormDialog(site?: Site) {
    setEditingSite(site ?? null);
    setEditBaseUrl(site?.base_url ?? "");
    setEditEnableIpFilter(site?.enable_ip_filter ?? false);
    setEditIpFilterMode(site?.ip_filter_mode ?? "whitelist");
    setEditIpFiltersInput(site?.ip_filters?.join(", ") ?? "");
    setError(null);
    setFormError(null);
  }

  function closeFormDialog() {
    setEditingSite(null);
    setEditBaseUrl("");
    setEditEnableIpFilter(false);
    setEditIpFilterMode("whitelist");
    setEditIpFiltersInput("");
    setFormError(null);
  }

  async function handleUpdateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingSite?.site_id) {
      return;
    }

    const validationError = validateBaseUrl(editBaseUrl);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsUpdating(true);
    setError(null);
    setFormError(null);

    try {
      const editIpFilters = editIpFiltersInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await request<SiteResponse>(
        `/sites/${editingSite.site_id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            base_url: editBaseUrl.trim(),
            enable_ip_filter: editEnableIpFilter,
            ip_filter_mode: editIpFilterMode,
            ip_filters: editIpFilters,
          }),
        },
      );

      setSites((current) =>
        sortSites(
          current.map((site) =>
            site.id === response.site.id ? response.site : site,
          ),
        ),
      );
      closeFormDialog();
      void refreshSitesData({ silent: true });
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update site.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteSite() {
    if (!sitePendingDelete?.site_id) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await request<{ message: string }>(
        `/sites/${sitePendingDelete.site_id}`,
        {
          method: "DELETE",
        },
      );

      setSites((current) =>
        current.filter((site) => site.site_id !== sitePendingDelete.site_id),
      );

      if (editingSite?.site_id === sitePendingDelete.site_id) {
        closeFormDialog();
      }

      setSitePendingDelete(null);
      void refreshSitesData({ silent: true });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete site.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function formatUptime(site: Site) {
    const value = site.health?.uptime_percentage;
    if (value === null || value === undefined) {
      return "N/A";
    }
    return `${value.toFixed(2)}%`;
  }

  function formatLastCheck(site: Site) {
    const value = site.health?.last_checked_at;
    if (!value) {
      return "Never";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Never";
    }

    return parsed.toLocaleString();
  }

  function statusTone(site: Site) {
    const status = site.health?.current_status ?? "unknown";
    if (status === "up") {
      return "text-green-600";
    }
    if (status === "down") {
      return "text-destructive";
    }
    return "text-muted-foreground";
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
        <p className="text-sm text-muted-foreground">
          Create, update, and remove connected sites.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!hasAccessToken}
          onClick={() => {
            setFormError(null);
            setIsCreateDialogOpen(true);
          }}
        >
          Add site
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isCreating) {
            setIsCreateDialogOpen(false);
            setBaseUrl("");
            setEnableIpFilter(false);
            setIpFilterMode("whitelist");
            setIpFiltersInput("");
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add site</DialogTitle>
            <DialogDescription>
              Enter the site base URL. The backend will generate the site ID for
              you.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateSite}>
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input
                id="base-url"
                type="url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://example.frappe.cloud"
                disabled={isCreating}
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="enable-ip-filter"
                checked={enableIpFilter}
                onCheckedChange={setEnableIpFilter}
                disabled={isCreating}
              />
              <Label htmlFor="enable-ip-filter">Enable IP filter</Label>
            </div>

            {enableIpFilter && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ip-filter-mode">Filter mode</Label>
                  <Select
                    value={ipFilterMode}
                    onValueChange={setIpFilterMode}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="ip-filter-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whitelist">Whitelist</SelectItem>
                      <SelectItem value="blacklist">Blacklist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip-filters">
                    IP patterns (comma-separated)
                  </Label>
                  <Input
                    id="ip-filters"
                    value={ipFiltersInput}
                    onChange={(event) => setIpFiltersInput(event.target.value)}
                    placeholder="192.168.*.*, 10.0.*.*"
                    disabled={isCreating}
                  />
                </div>
              </div>
            )}

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setBaseUrl("");
                  setEnableIpFilter(false);
                  setIpFilterMode("whitelist");
                  setIpFiltersInput("");
                  setFormError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create site"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Your sites</CardTitle>
          <CardDescription>
            Manage the sites available to your current account and review 90-day
            uptime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-5">
            <Input
              placeholder="Search site ID or base URL"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="md:col-span-2"
            />
            <Select
              value={ipFilterState}
              onValueChange={(value) => {
                setIpFilterState(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="IP filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="enabled">IP filter enabled</SelectItem>
                <SelectItem value="disabled">IP filter disabled</SelectItem>
              </SelectContent>
            </Select>
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

          <Table>
            <TableCaption>
              {filteredAndSortedSites.length
                ? `${filteredAndSortedSites.length} site${filteredAndSortedSites.length === 1 ? "" : "s"} matched.`
                : "No sites yet. Create your first site above."}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Site ID</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>90D Uptime</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSites.length ? (
                pagedSites.map((site, idx) => (
                  <TableRow key={site.id}>
                    <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell>{site.site_id ?? "N/A"}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {site.base_url ?? "N/A"}
                    </TableCell>
                    <TableCell>{formatUptime(site)}</TableCell>
                    <TableCell className={statusTone(site)}>
                      {(site.health?.current_status ?? "unknown").toUpperCase()}
                    </TableCell>
                    <TableCell
                      className="max-w-56 truncate"
                      title={formatLastCheck(site)}
                    >
                      {formatLastCheck(site)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openFormDialog(site)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setSitePendingDelete(site)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No sites found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-28">
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
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingSite)}
        onOpenChange={(open) => !open && closeFormDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit site</DialogTitle>
            <DialogDescription>
              Update the base URL for {editingSite?.site_id ?? "this site"}.
              Site IDs are read-only.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUpdateSite}>
            <div className="space-y-2">
              <Label htmlFor="edit-site-id">Site ID</Label>
              <Input
                id="edit-site-id"
                value={editingSite?.site_id ?? ""}
                disabled
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-base-url">Base URL</Label>
              <Input
                id="edit-base-url"
                type="url"
                value={editBaseUrl}
                onChange={(event) => setEditBaseUrl(event.target.value)}
                placeholder="https://example.frappe.cloud"
                disabled={isUpdating}
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="edit-enable-ip-filter"
                checked={editEnableIpFilter}
                onCheckedChange={setEditEnableIpFilter}
                disabled={isUpdating}
              />
              <Label htmlFor="edit-enable-ip-filter">Enable IP filter</Label>
            </div>

            {editEnableIpFilter && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-ip-filter-mode">Filter mode</Label>
                  <Select
                    value={editIpFilterMode}
                    onValueChange={setEditIpFilterMode}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="edit-ip-filter-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whitelist">Whitelist</SelectItem>
                      <SelectItem value="blacklist">Blacklist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ip-filters">
                    IP patterns (comma-separated)
                  </Label>
                  <Input
                    id="edit-ip-filters"
                    value={editIpFiltersInput}
                    onChange={(event) =>
                      setEditIpFiltersInput(event.target.value)
                    }
                    placeholder="192.168.*.*, 10.0.*.*"
                    disabled={isUpdating}
                  />
                </div>
              </div>
            )}

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(sitePendingDelete)}
        onOpenChange={(open) =>
          !open && !isDeleting && setSitePendingDelete(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete site?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              {sitePendingDelete?.site_id ?? "this site"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteSite}
            >
              {isDeleting ? "Deleting..." : "Delete site"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
