import aagcLogo from "../assets/aagc.png";

export function ChurchLogo() {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border border-amber-200 bg-white shadow-[0_14px_28px_-20px_rgba(161,98,7,0.65)]">
        <img
          src={aagcLogo}
          alt="AAGC logo"
          className="h-full w-full object-contain p-2"
        />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="break-words text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 sm:tracking-[0.35em]">
          Apostolic Army
        </p>
        <h1 className="break-words font-['Baskerville','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl leading-none font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Global Church
        </h1>
        <p className="break-words text-sm text-slate-500">Attendance Command Center</p>
      </div>
    </div>
  )
}
