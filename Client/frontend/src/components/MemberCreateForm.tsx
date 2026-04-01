import type { FormEvent } from 'react'

import type { DepartmentRecord } from '../types/dashboard'

interface MemberCreateFormProps {
  departments: DepartmentRecord[]
  form: {
    name: string
    phone: string
    email: string
    departmentId: string
  }
  isSubmitting: boolean
  onChange: (field: 'name' | 'phone' | 'email' | 'departmentId', value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function MemberCreateForm({
  departments,
  form,
  isSubmitting,
  onChange,
  onSubmit,
}: MemberCreateFormProps) {
  const hasDepartments = departments.length > 0

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          New Member
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
          Register a new member in the web app
        </h3>
        <p className="text-sm leading-6 text-slate-500">
          After creation, the member will appear in the list immediately and can then be
          enrolled in ScannerBridge. The system will also assign a simple church number
          like <span className="font-semibold text-slate-700">AAGC12</span>.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Full Name</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
            placeholder="Enter member's full name"
            disabled={isSubmitting}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
              value={form.phone}
              onChange={(event) => onChange('phone', event.target.value)}
              placeholder="08000000000"
              disabled={isSubmitting}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
              type="email"
              value={form.email}
              onChange={(event) => onChange('email', event.target.value)}
              placeholder="member@example.com"
              disabled={isSubmitting}
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Department</span>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            value={form.departmentId}
            onChange={(event) => onChange('departmentId', event.target.value)}
            disabled={isSubmitting || !hasDepartments}
          >
            <option value="">
              {hasDepartments ? 'Select a department' : 'Create a department first'}
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <button
          className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          type="submit"
          disabled={
            isSubmitting ||
            !form.name.trim() ||
            !form.phone.trim() ||
            !form.email.trim() ||
            !form.departmentId.trim()
          }
        >
          {isSubmitting ? 'CREATING MEMBER...' : 'CREATE MEMBER'}
        </button>
      </form>
    </section>
  )
}
