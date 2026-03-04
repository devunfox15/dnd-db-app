import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import type { Theme } from '@/components/theme-provider'
import { useTheme } from '@/components/theme-provider'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
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
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export function DmAppLayout({
  pageTitle,
  breadcrumbItems,
  children,
}: {
  pageTitle: string
  breadcrumbItems?: string[]
  children: React.ReactNode
}) {
  const items = breadcrumbItems && breadcrumbItems.length > 0 ? breadcrumbItems : [pageTitle]
  const lastIndex = items.length - 1

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Campaign Dashboard</BreadcrumbItem>
              {items.map((item, index) => (
                <div key={`${item}-${index}`} className="contents">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === lastIndex ? <BreadcrumbPage>{item}</BreadcrumbPage> : item}
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
    </SidebarProvider>
  )
}

function ThemeModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const Icon =
    theme === 'system' ? MonitorIcon : resolvedTheme === 'dark' ? MoonIcon : SunIcon

  const handleThemeChange = (value: string) => {
    if (value === 'light' || value === 'dark' || value === 'system') {
      setTheme(value)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Theme" className="gap-2">
          <Icon />
          <span className="hidden sm:inline">
            {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          <DropdownMenuRadioItem value={'light' satisfies Theme}>Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={'dark' satisfies Theme}>Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={'system' satisfies Theme}>System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
