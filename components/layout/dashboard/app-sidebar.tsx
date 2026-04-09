"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export default function AppSidebar() {
  const pathname = usePathname();

  const hrefFor = (name: string) => `/dashboard/${encodeURIComponent(name)}`;
  const isActivePath = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/app" || pathname === "/"}
            >
              <Link href="/app">
                <span>Frappify</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="dashboard">
                <SidebarMenuButton
                  asChild
                  isActive={isActivePath("/dashboard")}
                >
                  <Link href={hrefFor("dashboard")}>
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key="sites">
                <SidebarMenuButton
                  asChild
                  isActive={isActivePath("/dashboard/sites")}
                >
                  <Link href={hrefFor("sites")}>
                    <span>Sites</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key="logs">
                <SidebarMenuButton
                  asChild
                  isActive={isActivePath("/dashboard/logs")}
                >
                  <Link href={hrefFor("logs")}>
                    <span>Logs</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActivePath("/dashboard/logs")}
                    >
                      <Link href={hrefFor("logs")}>Site traffic</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/" || pathname.startsWith("/app/")}
            >
              <Link href="/">
                <span>Back to Apps</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
