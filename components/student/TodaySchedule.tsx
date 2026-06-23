import { Attendance, Period } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { STATUS_LABELS } from '@/lib/utils/attendance'
import { Clock } from 'lucide-react'

interface PeriodAttendance {
  period: Period
  attendance: Attendance | null
}

interface Props {
  items: PeriodAttendance[]
}

const statusVariant = (status: string): 'present' | 'late' | 'absent' | 'excused' | 'exited' | 'default' => {
  const map: Record<string, 'present' | 'late' | 'absent' | 'excused' | 'exited'> = {
    present: 'present', late: 'late', absent: 'absent', excused: 'excused', exited: 'exited',
  }
  return map[status] ?? 'default'
}

export function TodaySchedule({ items }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-500" />
        오늘 교시별 현황
      </h2>
      <div className="space-y-3">
        {items.map(({ period, attendance }) => (
          <div
            key={period.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium text-sm text-gray-900">
                {period.period_number}교시
                {period.title ? ` — ${period.title}` : ''}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {period.start_time.slice(0, 5)} ~ {period.end_time.slice(0, 5)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {attendance ? (
                <>
                  <Badge variant={statusVariant(attendance.status)}>
                    {STATUS_LABELS[attendance.status]}
                  </Badge>
                  {attendance.status === 'late' && attendance.late_minutes && (
                    <span className="text-xs text-amber-600 font-medium">
                      {attendance.late_minutes}분 지각
                    </span>
                  )}
                </>
              ) : (
                <Badge variant="default">미기록</Badge>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-gray-400 py-4 text-sm">오늘 교시 정보가 없습니다</p>
        )}
      </div>
    </div>
  )
}
