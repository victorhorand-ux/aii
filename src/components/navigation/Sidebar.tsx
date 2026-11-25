import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSearch,
  Map,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { SidebarNavItem } from './SidebarNavItem'
import type { NavigationItem } from './navigation.types'

interface SidebarProps {
  activePage: NavigationItem
  collapsed: boolean
  items: readonly NavigationItem[]
  onNavigate: (page: NavigationItem) => void
  onToggle: () => void
}

const navigationIcons: Record<NavigationItem, LucideIcon> = {
  Overview: BarChart3,
  'District Profile': Map,
  'Investigation Brief': ClipboardList,
  Evidence: FileSearch,
  'Data & Methodology': BookOpenText,
}

export function Sidebar({
  activePage,
  collapsed,
  items,
  onNavigate,
  onToggle,
}: SidebarProps) {
  return (
    <aside
      className={`border-b border-slate-200 bg-white lg:fixed lg:left-0 lg:top-[4.25rem] lg:h-[calc(100vh-4.25rem)] lg:border-b-0 lg:border-r ${collapsed ? 'lg:w-16' : 'lg:w-60'}`}
    >
      <nav
        aria-label="Primary"
        className={`overflow-x-auto px-3 py-2 sm:px-6 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:py-6 ${collapsed ? 'lg:px-2' : 'lg:px-4'}`}
      >
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="mb-3 hidden min-h-10 items-center justify-center gap-2 self-end rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-sage-50 hover:text-forest-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-700 focus-visible:ring-offset-2 lg:inline-flex"
          onClick={onToggle}
          type="button"
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" className="size-4" />
          ) : (
            <ChevronLeft aria-hidden="true" className="size-4" />
          )}
          <span className={collapsed ? 'sr-only' : ''}>
            {collapsed ? 'Expand' : 'Collapse'}
          </span>
        </button>
        <div className="flex min-w-max gap-1.5 lg:min-w-0 lg:flex-col lg:gap-1.5">
          {items.map((item) => (
            <SidebarNavItem
              active={activePage === item}
              collapsed={collapsed}
              icon={navigationIcons[item]}
              key={item}
              label={item}
              onClick={() => onNavigate(item)}
            />
          ))}
        </div>

        <div className={`hidden border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 lg:mt-auto lg:block ${collapsed ? 'lg:hidden' : ''}`}>
          <img
            alt="National Institute of Statistics of Rwanda (NISR) logo"
            className="mt-2 h-18 w-auto max-w-full object-contain "
            src="/logo-rwanda-nisr-transparent_0.png"
          />
          <p className="mt-1">SAS 2024 · SAS 2025 · AHS 2024</p>
          <p>Published observations with source links</p>
        </div>
      </nav>
    </aside>
  )
}
