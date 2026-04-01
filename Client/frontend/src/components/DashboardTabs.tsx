type DashboardView = 'attendance' | 'members'

interface DashboardTabsProps {
  activeView: DashboardView
  onChange: (view: DashboardView) => void
}

export function DashboardTabs({ activeView, onChange }: DashboardTabsProps) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.35)]">
      {(
        [
          { id: 'attendance', label: 'Attendance Desk' },
          { id: 'members', label: 'Members' },
        ] as const
      ).map((tab) => {
        const isActive = activeView === tab.id

        return (
          <button
            key={tab.id}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold tracking-[0.14em] transition ${
              isActive
                ? 'bg-slate-950 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            type="button"
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
