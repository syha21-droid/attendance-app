import { Attendance, Period, Session } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { STATUS_LABELS } from '@/lib/utils/attendance'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TableIcon } from 'lucide-react'

interface SessionRow {
  session: Session
  periods: Period[]
  attendanceMap: Record<string, Attendance>
}

interface Props {
  rows: SessionRow[]
}

const statusVariant = (status: string): 'present' | 'late' | 'absent' | 'excused' | 'exited' | 'default' => {
  const map: Record<string, 'present' | 'late' | 'absent' | 'excused' | 'exited'> = {
    present: 'present', late: 'late', absent: 'absent', excused: 'excused', exited: 'exited',
  }
  return map[status] ?? 'default'
}

export function AttendanceHistory({ rows }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <TableIcon className="w-5 h-5 text-indigo-500" />
        회차별 출결 이력
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4 font-medium">회차</th>
              <th className="pb-3 pr-4 font-medium">날짜</th>
              <th className="pb-3 pr-4 font-medium text-center">1교시</th>
              <th className="pb-3 pr-4 font-medium text-center">2교시</th>
              <th className="pb-3 font-medium text-center">3교시</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ session, attendanceMap }) => (
              <tr key={session.id}>
                <td className="py-3 pr-4 font-medium">{session.session_number}회차</td>
                <td className="py-3 pr-4 text-gray-500">
                  {format(new Date(session.date), 'M/d(EEE)', { locale: ko })}
                </td>
                {[1, 2, 3].map((pNum) => {
                  const att = Object.values(attendanceMap).find((a) => {
                    // period_number 매핑은 period join에서 처리
                    return (a as unknown as { period_number: number }).period_number === pNum
                  })
                  return (
                    <td key={pNum} className="py-3 pr-4 text-center">
                      {att ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <Badge variant={statusVariant(att.status)}>
                            {STATUS_LABELS[att.status]}
                          </Badge>
                          {att.status === 'late' && att.late_minutes && (
                            <span className="text-xs text-amber-600">{att.late_minutes}분</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">출결 이력이 없습니다</p>
        )}
      </div>
    </div>
  )
}
