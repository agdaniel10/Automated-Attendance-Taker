export function ChurchLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-18 w-18 items-center justify-center overflow-hidden rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-amber-100 shadow-[0_14px_28px_-20px_rgba(161,98,7,0.65)]">
        <div className="absolute inset-3 rounded-[1.2rem] border border-amber-300/60" />
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[0.65rem] font-black tracking-[0.35em] text-white">
          AAGC
        </div>
        <div className="absolute top-3 h-8 w-[3px] rounded-full bg-amber-600" />
        <div className="absolute top-6 h-[3px] w-8 rounded-full bg-amber-600" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
          Apostolic Army
        </p>
        <h1 className="font-['Baskerville','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl leading-none font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Global Church
        </h1>
        <p className="text-sm text-slate-500">Attendance Command Center</p>
      </div>
    </div>
  )
}
