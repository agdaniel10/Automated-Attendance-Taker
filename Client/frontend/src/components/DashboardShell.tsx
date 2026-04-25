import type { ReactNode } from 'react'

import {
  SidebarNavigation,
  type SidebarNavigationItem,
} from './SidebarNavigation'

interface DashboardShellProps {
  navigationItems: SidebarNavigationItem[]
  operatorName: string
  activeSessionLabel: string
  pendingReviewCount: number
  pageTitle: string
  pageDescription: string
  lastUpdatedAt: string | null
  isRefreshing: boolean
  onRefresh: () => void
  onboardingActionLabel?: string
  onOnboardingAction?: () => void
  onLogout: () => void
  children: ReactNode
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'Waiting for first sync'
  }

  return new Date(value).toLocaleString()
}

export function DashboardShell({
  navigationItems,
  operatorName,
  activeSessionLabel,
  pendingReviewCount,
  pageTitle,
  pageDescription,
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
  onboardingActionLabel,
  onOnboardingAction,
  onLogout,
  children,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,248,232,0.85),_rgba(255,255,255,0.96)_42%),linear-gradient(180deg,_#fffdf8_0%,_#ffffff_100%)] px-3 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] min-w-0 gap-5 lg:grid-cols-[minmax(260px,280px)_minmax(0,1fr)] lg:items-start xl:grid-cols-[300px_minmax(0,1fr)]">
        <SidebarNavigation
          items={navigationItems}
          operatorName={operatorName}
          activeSessionLabel={activeSessionLabel}
          pendingReviewCount={pendingReviewCount}
          onLogout={onLogout}
        />

        <div className="min-w-0 space-y-5">
          <header className="overflow-hidden rounded-[2rem] border border-white/80 bg-white px-5 py-5 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.45)] sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
                  Apostolic Army Global Church
                </p>
                <div className="min-w-0">
                  <h2 className="break-words font-['Baskerville','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-3xl leading-tight tracking-tight text-slate-950 sm:text-4xl">
                    {pageTitle}
                  </h2>
                  <p className="mt-3 max-w-3xl break-words text-sm leading-7 text-slate-600">
                    {pageDescription}
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-[280px]">
                <div className="min-w-0 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                    Last Sync
                  </p>
                  <p className="mt-2 break-words text-sm font-medium text-slate-900">
                    {formatTimestamp(lastUpdatedAt)}
                  </p>
                </div>
                <button
                  className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>
                {onOnboardingAction && onboardingActionLabel ? (
                  <button
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100 sm:col-span-2"
                    type="button"
                    onClick={onOnboardingAction}
                  >
                    {onboardingActionLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </header>

          {children}
        </div>
      </div>
    </main>
  )
}
