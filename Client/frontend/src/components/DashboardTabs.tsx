type DashboardView = 'attendance' | 'members'

interface DashboardTabsProps {
  activeView: DashboardView
  onChange: (view: DashboardView) => void
}

export function DashboardTabs({ activeView, onChange }: DashboardTabsProps) {
  return (
    <div className="grid w-full max-w-xl grid-cols-2 rounded-[1.4rem] border border-slate-200 bg-white p-1 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.35)] sm:inline-flex sm:w-auto sm:rounded-full">
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
            className={`rounded-[1.1rem] px-4 py-3 text-center text-sm font-semibold tracking-[0.12em] transition sm:rounded-full sm:px-5 sm:py-2.5 sm:tracking-[0.14em] ${
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
