'use client'

import * as React from 'react'
import { Link } from '@tanstack/react-router'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Compass, House, LucideProps, Notebook } from 'lucide-react'
export type LucideIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: House,
    },
    {
      title: 'RPGs',
      url: '/rpgs',
      icon: Compass,
    },
    {
      title: 'Campaigns',
      url: '/campaigns',
      icon: Notebook,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border/70 bg-sidebar/95 supports-[backdrop-filter]:bg-sidebar/90"
      {...props}
    >
      <SidebarHeader className="h-16 justify-center border-b p-0">
        <Link
          to="/"
          className="flex h-full w-full items-center gap-3 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl border border-sidebar-border/70 bg-sidebar-primary/18 shadow-[inset_0_1px_0_hsl(var(--sidebar-foreground)/0.08)]">
            <img
              src="/logo.png"
              alt="DND DB logo"
              className="size-8 rounded-lg object-contain"
            />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold tracking-[0.01em]">
              Dream ToolKit
            </span>
            <span className="block truncate text-[11px] text-sidebar-foreground/50">
              RPG Campaign
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
