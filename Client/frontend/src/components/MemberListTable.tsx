import type { FormEvent } from 'react'

import type { DepartmentRecord, MemberSummary } from '../types/dashboard'

interface MemberListTableProps {
  members: MemberSummary[]
  departments: DepartmentRecord[]
  selectedMemberId: string
  search: string
  departmentFilter: string
  isRefreshing: boolean
  onSearchChange: (value: string) => void
  onDepartmentFilterChange: (value: string) => void
  onSubmitSearch: (event: FormEvent<HTMLFormElement>) => void
  onRefresh: () => void
  onSelectMember: (memberId: string) => void
}

function biometricTone(status: string): string {
  return status === 'ENROLLED'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
}

export function MemberListTable({
  members,
  departments,
  selectedMemberId,
  search,
  departmentFilter,
  isRefreshing,
  onSearchChange,
  onDepartmentFilterChange,
  onSubmitSearch,
  onRefresh,
  onSelectMember,
}: MemberListTableProps) {
  return (
    <section className="min-w-0 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Member Registry
          </p>
          <h3 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950">
            Search and select newly created members
          </h3>
          <p className="mt-2 break-words text-sm text-slate-500">
            Select a member to review their biometric status and continue enrollment in
            ScannerBridge.
          </p>
        </div>
        <button
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Members'}
        </button>
      </div>

      <form
        className="mt-6 grid min-w-0 gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]"
        onSubmit={onSubmitSearch}
      >
        <input
          className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by AAGC number, name, email, or phone"
        />
        <select
          className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
          value={departmentFilter}
          onChange={(event) => onDepartmentFilterChange(event.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold tracking-[0.18em] text-white transition hover:bg-slate-800"
          type="submit"
        >
          SEARCH
        </button>
      </form>

      <div className="mt-6 md:hidden">
        {members.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-10 text-center text-slate-500">
            No members match this filter yet.
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const isSelected = member.id === selectedMemberId

              return (
                <article
                  key={member.id}
                  className={`rounded-[1.35rem] border p-4 ${
                    isSelected
                      ? 'border-amber-300 bg-amber-50/70'
                      : 'border-slate-200 bg-slate-50/80'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">
                        {member.aagcNumber}
                      </span>
                      <p className="mt-3 font-semibold text-slate-950">{member.name}</p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {member.email} | {member.phone}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${biometricTone(member.biometricStatus)}`}
                    >
                      {member.biometricStatus}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p>
                      <span className="font-medium text-slate-900">Department:</span>{' '}
                      {member.department?.name ?? 'No department'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Fingers:</span>{' '}
                      {member.enrolledFingerCount}
                    </p>
                  </div>

                  <button
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    type="button"
                    onClick={() => onSelectMember(member.id)}
                  >
                    {isSelected ? 'SELECTED MEMBER' : 'OPEN MEMBER'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </div>

        <div className="mt-6 hidden min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 md:block">
          <div className="min-w-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">AAGC Number</th>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Biometric Status</th>
                <th className="px-4 py-3 font-medium">Fingers</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                    No members match this filter yet.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isSelected = member.id === selectedMemberId

                  return (
                    <tr key={member.id} className={isSelected ? 'bg-amber-50/70' : 'bg-white'}>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">
                          {member.aagcNumber}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{member.name}</div>
                        <div className="mt-1 break-all text-xs text-slate-400">
                          {member.email} | {member.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {member.department?.name ?? 'No department'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${biometricTone(member.biometricStatus)}`}
                        >
                          {member.biometricStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {member.enrolledFingerCount}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          type="button"
                          onClick={() => onSelectMember(member.id)}
                        >
                          {isSelected ? 'SELECTED' : 'OPEN'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
