import { ChevronRightIcon } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import type { LucideProps } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

type LucideIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>
export function NavMain({
  items,
}: {
  items: Array<{
    title: string
    url?: string
    icon?: LucideIcon
    items?: Array<{
      title: string
      url: string
      icon?: LucideIcon
    }>
  }>
}) {
  const location = useLocation()

  const isActive = (url?: string) =>
    Boolean(
      url &&
        (location.pathname === url || location.pathname.startsWith(`${url}/`)),
    )

  return (
    <SidebarGroup className="px-3 py-3 group-data-[collapsible=icon]:px-2">
      <SidebarMenu className="gap-1.5">
        {items.map((item) =>
          item.items?.length ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                    className="h-11 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/78 hover:bg-sidebar-foreground/6 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_12px_30px_-14px_hsl(var(--sidebar-primary)/0.85)] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-sidebar-border/60 group-data-[collapsible=icon]:bg-sidebar/60 group-data-[collapsible=icon]:p-0!"
                  >
                    {item.icon ? <item.icon className="size-4" /> : null}
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mx-4 mt-1 border-sidebar-border/70 pl-3 group-data-[collapsible=icon]:hidden">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive(subItem.url)}
                          className="rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-foreground/6 hover:text-sidebar-foreground data-active:bg-sidebar-primary/18 data-active:text-sidebar-primary-foreground"
                        >
                          <Link to={subItem.url}>
                            {subItem.icon ? (
                              <subItem.icon className="size-4" />
                            ) : null}
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item.url)}
                className="h-11 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/78 hover:bg-sidebar-foreground/6 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_12px_30px_-14px_hsl(var(--sidebar-primary)/0.85)] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-sidebar-border/60 group-data-[collapsible=icon]:bg-sidebar/60 group-data-[collapsible=icon]:p-0!"
              >
                <Link to={item.url ?? '/'}>
                  {item.icon ? <item.icon className="size-4" /> : null}
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
