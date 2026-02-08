"use client"

import * as React from "react"
import {
  IconActivity,
  IconBug,
  IconChartBar,
  IconDashboard,
  IconFileShredder,
  IconFolder,
  IconHelp,
  IconHistory,
  IconSettings,
  IconShieldCheck,
  IconShieldLock,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/settings-dialog"

const data = {
  user: {
    name: "System Admin",
    email: "local@host",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#scan-zone",
      icon: IconDashboard,
      isActive: true,
    },
    {
      title: "Scan History",
      url: "#history",
      icon: IconHistory,
    },
    {
      title: "Quarantine",
      url: "#quarantine",
      icon: IconBug,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
      action: "settings"
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-sidebar-primary-foreground">
                  <IconShieldCheck className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SecureScan Pro</span>
                  <span className="truncate text-xs">v2.0 Enterprise</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          {/* Custom rendering for secondary to handle actions */}
          <SidebarMenu>
            {data.navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm">
                  {item.action === 'settings' ? (
                    <button onClick={() => setSettingsOpen(true)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  ) : (
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
