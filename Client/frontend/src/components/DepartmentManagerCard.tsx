import type { FormEvent } from 'react'

import type { DepartmentRecord } from '../types/dashboard'

interface DepartmentManagerCardProps {
  departments: DepartmentRecord[]
  departmentName: string
  isSubmitting: boolean
  onDepartmentNameChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function DepartmentManagerCard({
  departments,
  departmentName,
  isSubmitting,
  onDepartmentNameChange,
  onSubmit,
}: DepartmentManagerCardProps) {
  return (
    <section className="min-w-0 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Department Setup
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
          Keep departments ready for registration
        </h3>
        <p className="text-sm leading-6 text-slate-500">
          Members must belong to a department before they can be created and enrolled.
        </p>
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
        <input
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
          value={departmentName}
          onChange={(event) => onDepartmentNameChange(event.target.value)}
          placeholder="Add a department, for example Choir"
        />
        <button
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          type="submit"
          disabled={isSubmitting || !departmentName.trim()}
        >
          {isSubmitting ? 'ADDING...' : 'ADD DEPARTMENT'}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {departments.length === 0 ? (
          <span className="rounded-full border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
            No departments yet
          </span>
        ) : (
          departments.map((department) => (
            <span
              key={department.id}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            >
              {department.name}
              <span className="ml-2 text-slate-400">
                {department._count?.members ?? 0}
              </span>
            </span>
          ))
        )}
      </div>
    </section>
  )
}
