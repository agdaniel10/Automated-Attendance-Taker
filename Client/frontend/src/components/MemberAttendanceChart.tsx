import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatTooltipCount } from '../lib/chartFormatting'

interface MemberAttendanceDatum {
  label: string
  attendanceCount: number
  fullName: string
  aagcNumber: string | null
}

interface MemberAttendanceChartProps {
  data: MemberAttendanceDatum[]
}

export function MemberAttendanceChart({ data }: MemberAttendanceChartProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Member Attendance
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Members appearing most often
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This graph highlights recurring attendance across the recent sessions already loaded into the dashboard.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-12 text-center">
          <p className="text-lg font-semibold text-slate-900">No member attendance to chart yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Once members start checking in, their attendance frequency will show here.
          </p>
        </div>
      ) : (
        <div className="mt-6 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '1rem',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 22px 50px -32px rgba(15,23,42,0.45)',
                }}
                formatter={(value) => formatTooltipCount(value, 'check-ins')}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload as MemberAttendanceDatum | undefined
                  if (!item) {
                    return String(label)
                  }

                  return item.aagcNumber
                    ? `${item.fullName} (${item.aagcNumber})`
                    : item.fullName
                }}
              />
              <Bar dataKey="attendanceCount" fill="#f59e0b" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
