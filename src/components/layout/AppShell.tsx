import { useEffect, useState, type ReactNode } from 'react'

import { Navbar } from '../navigation/Navbar'
import { Sidebar } from '../navigation/Sidebar'
import { type NavigationItem } from '../navigation/navigation.types'

interface AppShellProps {
  activePage: NavigationItem
  children: ReactNode
  navigation: readonly NavigationItem[]
  onNavigate: (page: NavigationItem) => void
}

const SIDEBAR_PREFERENCE_KEY = 'aii-sidebar-collapsed'
const SIDEBAR_WIDE_VIEWPORT = 1280

function getInitialSidebarState(): { collapsed: boolean; manual: boolean } {
  if (typeof window === 'undefined') return { collapsed: true, manual: false }

  try {
    const preference = window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY)
    if (preference === 'true' || preference === 'false') {
      return { collapsed: preference === 'true', manual: true }
    }
  } catch {
    // Storage may be unavailable; use the responsive default for this session.
  }

  return {
    collapsed: window.innerWidth < SIDEBAR_WIDE_VIEWPORT,
    manual: false,
  }
}

export function AppShell({
  activePage,
  children,
  navigation,
  onNavigate,
}: AppShellProps) {
  const [sidebar, setSidebar] = useState(getInitialSidebarState)

  useEffect(() => {
    const updateResponsiveState = () => {
      setSidebar((current) =>
        current.manual
          ? current
          : { collapsed: window.innerWidth < SIDEBAR_WIDE_VIEWPORT, manual: false },
      )
    }

    window.addEventListener('resize', updateResponsiveState)
    return () => window.removeEventListener('resize', updateResponsiveState)
  }, [])

  const toggleSidebar = () => {
    setSidebar((current) => {
      const collapsed = !current.collapsed
      try {
        window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(collapsed))
      } catch {
        // The preference remains active for this session if storage is unavailable.
      }
      return { collapsed, manual: true }
    })
  }

  return (
    <div className="min-h-screen bg-warm-50 text-slate-800">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-md"
        href="#main-content"
      >
        Skip to main content
      </a>
      <Navbar />

      <Sidebar
        activePage={activePage}
        collapsed={sidebar.collapsed}
        items={navigation}
        onNavigate={onNavigate}
        onToggle={toggleSidebar}
      />

      <div
        className={`min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-4.25rem)] ${sidebar.collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}
      >
        <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1580px] px-4 py-6 sm:px-7 sm:py-8 lg:min-h-[calc(100vh-4.25rem)] lg:px-9 lg:py-9 xl:px-11">
          <main id="main-content" className="mx-auto min-w-0 max-w-[1440px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
