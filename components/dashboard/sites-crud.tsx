"use client";

import { FormEvent, useMemo, useState } from "react";

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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { env } from "@/lib/env";

export type Site = {
  id: number;
  site_id?: string;
  base_url?: string;
  user_id?: string | number;
  created_at?: string;
  updated_at?: string;
};

type SiteResponse = {
  site: Site;
};

type SitesResponse = {
  sites?: Site[];
};

type SitesCrudProps = {
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

export function SitesCrud({ initialSites, accessToken, initialError = null }: SitesCrudProps) {
  const [sites, setSites] = useState(() => sortSites(initialSites));
  const [baseUrl, setBaseUrl] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [sitePendingDelete, setSitePendingDelete] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasAccessToken = useMemo(() => accessToken.trim().length > 0, [accessToken]);

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
      throw new Error(body || `Request failed with ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

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
      const response = await request<SiteResponse>("/sites", {
        method: "POST",
        body: JSON.stringify({ base_url: baseUrl.trim() }),
      });

      setSites((current) => sortSites([...current, response.site]));
      setBaseUrl("");
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : "Unable to create site.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function openEditDialog(site: Site) {
    setEditingSite(site);
    setEditBaseUrl(site.base_url ?? "");
    setError(null);
    setFormError(null);
  }

  function closeEditDialog() {
    setEditingSite(null);
    setEditBaseUrl("");
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
      const response = await request<SiteResponse>(`/sites/${editingSite.site_id}`, {
        method: "PUT",
        body: JSON.stringify({ base_url: editBaseUrl.trim() }),
      });

      setSites((current) =>
        sortSites(
          current.map((site) => (site.id === response.site.id ? response.site : site)),
        ),
      );
      closeEditDialog();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : "Unable to update site.",
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
      await request<{ message: string }>(`/sites/${sitePendingDelete.site_id}`, {
        method: "DELETE",
      });

      setSites((current) =>
        current.filter((site) => site.site_id !== sitePendingDelete.site_id),
      );

      if (editingSite?.site_id === sitePendingDelete.site_id) {
        closeEditDialog();
      }

      setSitePendingDelete(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete site.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
        <p className="text-sm text-muted-foreground">
          Create, update, and remove connected sites. Site IDs are assigned automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add site</CardTitle>
          <CardDescription>
            Enter the site base URL. The backend will generate the site ID for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateSite}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="base-url">Base URL</Label>
                <Input
                  id="base-url"
                  type="url"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://example.frappe.cloud"
                  disabled={!hasAccessToken || isCreating}
                  required
                />
              </div>
              <Button type="submit" disabled={!hasAccessToken || isCreating}>
                {isCreating ? "Creating..." : "Create site"}
              </Button>
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your sites</CardTitle>
          <CardDescription>
            Manage the sites available to your current account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              {sites.length
                ? `${sites.length} site${sites.length === 1 ? "" : "s"} connected.`
                : "No sites yet. Create your first site above."}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Site ID</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length ? (
                sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>{site.id}</TableCell>
                    <TableCell>{site.site_id ?? "N/A"}</TableCell>
                    <TableCell className="max-w-[28rem] truncate">{site.base_url ?? "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openEditDialog(site)}
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
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No sites found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingSite)} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit site</DialogTitle>
            <DialogDescription>
              Update the base URL for {editingSite?.site_id ?? "this site"}. Site IDs are read-only.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUpdateSite}>
            <div className="space-y-2">
              <Label htmlFor="edit-site-id">Site ID</Label>
              <Input id="edit-site-id" value={editingSite?.site_id ?? ""} disabled readOnly />
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

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
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
        onOpenChange={(open) => !open && !isDeleting && setSitePendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete site?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {sitePendingDelete?.site_id ?? "this site"}.
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