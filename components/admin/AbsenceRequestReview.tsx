'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AbsenceRequest, Student, Session, Period } from '@/types'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ShieldCheck } from 'lucide-react'

interface Row extends AbsenceRequest {
  student: Student
  session: Session
  period: Period
}

interface Props {
  requests: Row[]
}

export function AbsenceRequestReview({ requests }: Props) {
  const [memo, setMemo] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  async function handle(r: Row, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('absence_requests')
      .update({
        status,
        admin_memo: memo[r.id] ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', r.id)
    if (error) { toast.error('처리 실패'); return }

    if (status === 'approved') {
      // 해당 출결 레코드를 공결로 변경
      await supabase
        .from('attendance')
        .update({ status: 'excused', updated_at: new Date().toISOString() })
        .eq('student_id', r.student_id)
        .eq('period_id', r.period_id)
    }
    toast.success(status === 'approved' ? '공결 승인 완료' : '반려 처리 완료')
    router.refresh()
  }

  const statusVariant = {
    pending: 'pending' as const,
    approved: 'approved' as const,
    rejected: 'rejected' as const,
  }
  const statusLabel = { pending: '검토중', approved: '승인', rejected: '반려' }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-blue-500" />
        공결 신청 대기 목록
      </h2>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">공결 신청이 없습니다</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{r.student.name}</p>
                  <p className="text-xs text-gray-500">
                    {r.session.session_number}회차 {r.period.period_number}교시
                    · {format(new Date(r.requested_at), 'M/d HH:mm')}
                  </p>
                </div>
                <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
              </div>

              <p className="text-sm bg-gray-50 rounded p-2">{r.reason}</p>

              {r.admin_memo && (
                <p className="text-xs text-blue-700 bg-blue-50 rounded p-2">메모: {r.admin_memo}</p>
              )}

              {r.status === 'pending' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="반려 메모 (선택)"
                    value={memo[r.id] ?? ''}
                    onChange={(e) => setMemo((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="w-full border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handle(r, 'approved')}
                      className="flex-1 bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handle(r, 'rejected')}
                      className="flex-1 bg-gray-100 text-gray-700 text-xs py-2 rounded hover:bg-gray-200"
                    >
                      반려
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
