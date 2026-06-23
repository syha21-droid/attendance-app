import { LateReason } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { LATE_CATEGORY_LABELS } from '@/lib/utils/attendance'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { History } from 'lucide-react'

interface Props {
  reasons: (LateReason & {
    attendance: {
      late_minutes: number | null
      period: { period_number: number }
      session: { session_number: number }
    }
  })[]
}

const STATUS_MAP = {
  pending: { label: '검토중', variant: 'pending' as const },
  reviewed: { label: '확인 완료', variant: 'reviewed' as const },
  converted_excused: { label: '공결 전환', variant: 'converted' as const },
}

export function LateReasonHistory({ reasons }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-amber-500" />
        지각 사유 제출 이력
      </h2>

      {reasons.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">제출한 지각 사유가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {reasons.map((r) => {
            const { label, variant } = STATUS_MAP[r.status]
            return (
              <div key={r.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm font-medium">
                    {r.attendance.session.session_number}회차{' '}
                    {r.attendance.period.period_number}교시
                    {r.attendance.late_minutes && (
                      <span className="ml-1 text-amber-600">({r.attendance.late_minutes}분 지각)</span>
                    )}
                  </div>
                  <Badge variant={variant}>{label}</Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {r.categories.map((cat) => (
                    <span
                      key={cat}
                      className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full"
                    >
                      {LATE_CATEGORY_LABELS[cat]}
                    </span>
                  ))}
                </div>

                {r.detail_text && (
                  <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{r.detail_text}</p>
                )}

                {r.admin_memo && (
                  <div className="text-xs bg-blue-50 text-blue-700 rounded p-2">
                    <span className="font-medium">관리자 메모:</span> {r.admin_memo}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>제출: {format(new Date(r.submitted_at), 'M/d HH:mm', { locale: ko })}</span>
                  {r.reviewed_at && (
                    <span>검토: {format(new Date(r.reviewed_at), 'M/d HH:mm', { locale: ko })}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
