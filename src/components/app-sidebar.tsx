'use client'

import * as React from 'react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Compass, LucideProps, Notebook } from 'lucide-react'
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <a href="/" className="flex items-center gap-2 px-2 py-1.5">
          <img
            src="/logo.png"
            alt="DND DB logo"
            className="size-10 rounded-md object-contain"
          />
          <span className="truncate font-semibold">DND DB</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
