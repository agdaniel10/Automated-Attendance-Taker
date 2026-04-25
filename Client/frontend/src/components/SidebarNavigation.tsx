import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { ChurchLogo } from './ChurchLogo'

export interface SidebarNavigationItem {
  to: string
  label: string
  description: string
  icon: ReactNode
  badge?: string | number | null
}

interface SidebarNavigationProps {
  items: SidebarNavigationItem[]
  operatorName: string
  activeSessionLabel: string
  pendingReviewCount: number
  onLogout: () => void
}

export function SidebarNavigation({
  items,
  operatorName,
  activeSessionLabel,
  pendingReviewCount,
  onLogout,
}: SidebarNavigationProps) {
  return (
    <aside className="min-w-0 overflow-hidden rounded-[2rem] border border-white/80 bg-white p-4 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.45)] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:p-4">
      <div className="flex min-h-0 min-w-0 flex-col lg:h-full">
        <div className="shrink-0 border-b border-slate-100 pb-4">
          <ChurchLogo />
          <div className="mt-4 min-w-0 rounded-[1.35rem] border border-amber-100 bg-amber-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Signed In
            </p>
            <p className="mt-1.5 break-words text-sm font-semibold text-slate-900">
              {operatorName}
            </p>
            <p className="mt-1.5 break-words text-sm leading-5 text-slate-600">
              Active service:
              <span className="ml-2 font-medium text-slate-900">{activeSessionLabel}</span>
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Pending reviews:
              <span className="ml-2 font-medium text-slate-900">{pendingReviewCount}</span>
            </p>
          </div>
        </div>

        <nav className="mt-4 min-h-0 min-w-0 flex-1 lg:overflow-y-auto lg:pr-1">
          <div className="grid gap-1.5">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group rounded-[1.25rem] border px-3 py-3 transition ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-[0_24px_45px_-28px_rgba(15,23,42,0.65)]'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-amber-200 hover:bg-amber-50/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isActive
                          ? 'bg-white/14 text-white'
                          : 'bg-white text-slate-700 ring-1 ring-slate-200'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p
                          className={`break-words text-[13px] font-semibold tracking-[0.06em] ${
                            isActive ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.label}
                        </p>
                        {item.badge ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${
                              isActive
                                ? 'bg-white/14 text-white'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`mt-1 break-words text-xs leading-5 ${
                          isActive ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="mt-4 shrink-0 border-t border-slate-100 pt-4">
          <button
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-white transition hover:bg-slate-800"
            type="button"
            onClick={onLogout}
          >
            SIGN OUT
          </button>
        </div>
      </div>
    </aside>
  )
}
