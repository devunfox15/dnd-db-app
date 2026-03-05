import { useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import type { Theme } from '@/components/theme-provider'
import { useTheme } from '@/components/theme-provider'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { DiceTray } from '@/features/dice-roller/components/dice-tray'
import { DiceTrayTrigger } from '@/features/dice-roller/components/dice-tray-trigger'

type LayoutBreadcrumbItem = {
  label: string
  href?: string
}

export function DmAppLayout({
  pageTitle,
  breadcrumbItems,
  children,
}: {
  pageTitle: string
  breadcrumbItems?: Array<string | LayoutBreadcrumbItem>
  children: React.ReactNode
}) {
  const items: Array<LayoutBreadcrumbItem> = (
    breadcrumbItems && breadcrumbItems.length > 0
      ? breadcrumbItems
      : pageTitle === 'Home'
        ? []
        : [pageTitle]
  ).map((item) => (typeof item === 'string' ? { label: item } : item))
  const lastIndex = items.length - 1
  const location = useLocation()
  const [shouldRenderDiceUi, setShouldRenderDiceUi] = useState(false)
  const isCampaignRoute = location.pathname.startsWith('/campaigns')

  useEffect(() => {
    setShouldRenderDiceUi(true)
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {items.length === 0 ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {items.map((item, index) => (
                <div key={`${item.label}-${index}`} className="contents">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === lastIndex ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : item.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      item.label
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <ThemeModeToggle />
          </div>
        </header>

        <section className="flex flex-1 flex-col gap-4 p-4">{children}</section>
      </SidebarInset>
      {shouldRenderDiceUi && isCampaignRoute ? (
        <>
          <DiceTrayTrigger />
          <DiceTray />
        </>
      ) : null}
    </SidebarProvider>
  )
}

function ThemeModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const Icon =
    theme === 'system'
      ? MonitorIcon
      : resolvedTheme === 'dark'
        ? MoonIcon
        : SunIcon

  const handleThemeChange = (value: string) => {
    if (value === 'light' || value === 'dark' || value === 'system') {
      setTheme(value)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Theme"
          className="gap-2"
        >
          <Icon />
          <span className="hidden sm:inline">
            {theme === 'system'
              ? 'System'
              : theme === 'dark'
                ? 'Dark'
                : 'Light'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          <DropdownMenuRadioItem value={'light' satisfies Theme}>
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={'dark' satisfies Theme}>
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={'system' satisfies Theme}>
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
