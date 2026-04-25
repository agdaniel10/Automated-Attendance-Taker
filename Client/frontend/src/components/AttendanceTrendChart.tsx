import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatTooltipCount } from '../lib/chartFormatting'

interface AttendanceTrendDatum {
  label: string
  attendance: number
  fullLabel: string
}

interface AttendanceTrendChartProps {
  data: AttendanceTrendDatum[]
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Attendance Trend
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Recent session attendance
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          A quick view of how church attendance has moved across the most recent service sessions.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-5 py-12 text-center">
          <p className="text-lg font-semibold text-slate-900">No session data yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Start and complete a few attendance sessions to see the trend line here.
          </p>
        </div>
      ) : (
        <div className="mt-6 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '1rem',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 22px 50px -32px rgba(15,23,42,0.45)',
                }}
                formatter={(value) => formatTooltipCount(value, 'attendees')}
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.fullLabel ?? String(label)
                }
              />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#0f172a"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
