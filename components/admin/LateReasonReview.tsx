'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LateReason, Student } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { LATE_CATEGORY_LABELS } from '@/lib/utils/attendance'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MessageSquare } from 'lucide-react'

interface LateReasonRow extends LateReason {
  student: Student
  attendance: {
    late_minutes: number | null
    period: { period_number: number }
    session: { session_number: number }
  }
}

interface Props {
  reasons: LateReasonRow[]
}

const STATUS_MAP = {
  pending: { label: '검토중', variant: 'pending' as const },
  reviewed: { label: '확인완료', variant: 'reviewed' as const },
  converted_excused: { label: '공결전환', variant: 'converted' as const },
}

export function LateReasonReview({ reasons }: Props) {
  const [memoId, setMemoId] = useState<string | null>(null)
  const [memoText, setMemoText] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(id: string, status: LateReason['status'], attendanceId?: string) {
    const updates: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
    }
    if (memoId === id && memoText.trim()) updates.admin_memo = memoText.trim()

    const { error } = await supabase.from('late_reasons').update(updates).eq('id', id)
    if (error) { toast.error('처리 실패'); return }

    if (status === 'converted_excused' && attendanceId) {
      await supabase
        .from('attendance')
        .update({ status: 'excused', updated_at: new Date().toISOString() })
        .eq('id', attendanceId)
    }
    toast.success('처리 완료')
    setMemoId(null)
    setMemoText('')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-amber-500" />
        지각 사유 검토 목록
      </h2>
      {reasons.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">검토할 지각 사유가 없습니다</p>
      ) : (
        <div className="space-y-4">
          {reasons.map((r) => {
            const { label, variant } = STATUS_MAP[r.status]
            return (
              <div key={r.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium text-sm">{r.student.name}</p>
                    <p className="text-xs text-gray-500">
                      {r.attendance.session.session_number}회차{' '}
                      {r.attendance.period.period_number}교시
                      {r.attendance.late_minutes && ` · ${r.attendance.late_minutes}분 지각`}
                    </p>
                  </div>
                  <Badge variant={variant}>{label}</Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {r.categories.map((cat) => (
                    <span key={cat} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                      {LATE_CATEGORY_LABELS[cat]}
                    </span>
                  ))}
                </div>

                {r.detail_text && (
                  <p className="text-xs bg-gray-50 rounded p-2 text-gray-700">{r.detail_text}</p>
                )}

                {r.admin_memo && (
                  <p className="text-xs bg-blue-50 text-blue-700 rounded p-2">
                    메모: {r.admin_memo}
                  </p>
                )}

                <p className="text-xs text-gray-400">
                  제출: {format(new Date(r.submitted_at), 'M/d HH:mm')}
                </p>

                {/* 메모 입력 */}
                {memoId === r.id && (
                  <textarea
                    value={memoText}
                    onChange={(e) => setMemoText(e.target.value)}
                    placeholder="관리자 메모 입력"
                    rows={2}
                    className="w-full border rounded px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                )}

                {r.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMemoId(memoId === r.id ? null : r.id)}
                      className="text-xs border rounded px-3 py-1.5 hover:bg-gray-50"
                    >
                      {memoId === r.id ? '메모 취소' : '메모 남기기'}
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, 'reviewed')}
                      className="text-xs bg-gray-100 text-gray-700 rounded px-3 py-1.5 hover:bg-gray-200"
                    >
                      확인 완료
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, 'converted_excused', r.attendance_id)}
                      className="text-xs bg-blue-100 text-blue-700 rounded px-3 py-1.5 hover:bg-blue-200"
                    >
                      공결 전환
                    </button>
                    {memoId === r.id && (
                      <button
                        onClick={() => updateStatus(r.id, 'reviewed')}
                        className="text-xs bg-indigo-600 text-white rounded px-3 py-1.5"
                      >
                        메모 저장
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
