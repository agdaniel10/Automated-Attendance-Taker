import type { FormEvent } from 'react'

import { DepartmentManagerCard } from '../components/DepartmentManagerCard'
import { EnrollmentGuideCard } from '../components/EnrollmentGuideCard'
import { MemberCreateForm } from '../components/MemberCreateForm'
import { MemberListTable } from '../components/MemberListTable'
import { MetricCard } from '../components/MetricCard'
import type {
  DepartmentRecord,
  MemberBiometrics,
  MemberSummary,
} from '../types/dashboard'

interface MembersPageProps {
  departments: DepartmentRecord[]
  members: MemberSummary[]
  selectedMemberId: string
  selectedMemberBiometrics: MemberBiometrics | null
  isRefreshingMembers: boolean
  isRefreshingBiometrics: boolean
  isCreatingDepartment: boolean
  isCreatingMember: boolean
  departmentForm: {
    name: string
  }
  memberForm: {
    name: string
    phone: string
    email: string
    departmentId: string
  }
  memberFilters: {
    search: string
    departmentId: string
  }
  enrolledMembersCount: number
  pendingMembersCount: number
  onDepartmentNameChange: (value: string) => void
  onMemberFormChange: (
    field: 'name' | 'phone' | 'email' | 'departmentId',
    value: string,
  ) => void
  onSearchChange: (value: string) => void
  onDepartmentFilterChange: (value: string) => void
  onCreateDepartment: (event: FormEvent<HTMLFormElement>) => void
  onCreateMember: (event: FormEvent<HTMLFormElement>) => void
  onSubmitSearch: (event: FormEvent<HTMLFormElement>) => void
  onRefreshMembers: () => void
  onSelectMember: (memberId: string) => void
  onRefreshBiometrics: () => void
  onCopyMemberId: () => void
}

export function MembersPage({
  departments,
  members,
  selectedMemberId,
  selectedMemberBiometrics,
  isRefreshingMembers,
  isRefreshingBiometrics,
  isCreatingDepartment,
  isCreatingMember,
  departmentForm,
  memberForm,
  memberFilters,
  enrolledMembersCount,
  pendingMembersCount,
  onDepartmentNameChange,
  onMemberFormChange,
  onSearchChange,
  onDepartmentFilterChange,
  onCreateDepartment,
  onCreateMember,
  onSubmitSearch,
  onRefreshMembers,
  onSelectMember,
  onRefreshBiometrics,
  onCopyMemberId,
}: MembersPageProps) {
  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ?? null

  return (
    <div className="min-w-0 space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Departments"
          value={String(departments.length)}
          hint="Available groups for registration"
        />
        <MetricCard
          label="Visible Members"
          value={String(members.length)}
          hint="Current registry after filters"
        />
        <MetricCard
          label="Biometric Ready"
          value={String(enrolledMembersCount)}
          hint="Members with full fingerprint enrollment"
        />
        <MetricCard
          label="Pending Enrollment"
          value={String(pendingMembersCount)}
          hint="Members still waiting for one or more prints"
        />
      </section>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <aside className="min-w-0 space-y-6">
          <DepartmentManagerCard
            departments={departments}
            departmentName={departmentForm.name}
            isSubmitting={isCreatingDepartment}
            onDepartmentNameChange={onDepartmentNameChange}
            onSubmit={onCreateDepartment}
          />

          <MemberCreateForm
            departments={departments}
            form={memberForm}
            isSubmitting={isCreatingMember}
            onChange={onMemberFormChange}
            onSubmit={onCreateMember}
          />
        </aside>

        <div className="min-w-0 space-y-6">
          <MemberListTable
            members={members}
            departments={departments}
            selectedMemberId={selectedMemberId}
            search={memberFilters.search}
            departmentFilter={memberFilters.departmentId}
            isRefreshing={isRefreshingMembers}
            onSearchChange={onSearchChange}
            onDepartmentFilterChange={onDepartmentFilterChange}
            onSubmitSearch={onSubmitSearch}
            onRefresh={onRefreshMembers}
            onSelectMember={onSelectMember}
          />

          <EnrollmentGuideCard
            member={selectedMember}
            biometrics={selectedMemberBiometrics}
            isRefreshing={isRefreshingBiometrics}
            onRefresh={onRefreshBiometrics}
            onCopyMemberId={onCopyMemberId}
          />
        </div>
      </div>
    </div>
  )
}
