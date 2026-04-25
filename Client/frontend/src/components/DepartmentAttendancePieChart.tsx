import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatTooltipCount } from '../lib/chartFormatting'

interface DepartmentAttendanceDatum {
  name: string
  value: number
  fill: string
}

interface DepartmentAttendancePieChartProps {
  data: DepartmentAttendanceDatum[]
}

export function DepartmentAttendancePieChart({
  data,
}: DepartmentAttendancePieChartProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Attendance Mix
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Department share of attendance
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          A pie chart showing which departments make up the recent attendance picture.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-12 text-center">
          <p className="text-lg font-semibold text-slate-900">No department mix yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Department attendance will appear here once check-ins are available.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    borderRadius: '1rem',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 22px 50px -32px rgba(15,23,42,0.45)',
                  }}
                  formatter={(value) => formatTooltipCount(value, 'check-ins')}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {data.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <p className="text-sm font-medium text-slate-800">{entry.name}</p>
                </div>
                <span className="text-sm font-semibold text-slate-950">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
