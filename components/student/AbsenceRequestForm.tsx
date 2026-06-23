'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, Period } from '@/types'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'

interface Props {
  studentId: string
  sessions: Session[]
  periodsMap: Record<string, Period[]>
  onSubmitted: () => void
}

export function AbsenceRequestForm({ studentId, sessions, periodsMap, onSubmitted }: Props) {
  const [sessionId, setSessionId] = useState('')
  const [periodId, setPeriodId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const availablePeriods = sessionId ? (periodsMap[sessionId] ?? []) : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sessionId || !periodId || !reason.trim()) {
      toast.error('모든 항목을 입력해 주세요')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('absence_requests').insert({
        student_id: studentId,
        session_id: sessionId,
        period_id: periodId,
        reason: reason.trim(),
      })
      if (error) throw error
      toast.success('공결 신청이 접수되었습니다')
      setSessionId('')
      setPeriodId('')
      setReason('')
      onSubmitted()
    } catch {
      toast.error('신청에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-blue-500" />
        공결 신청
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">회차</label>
            <select
              value={sessionId}
              onChange={(e) => { setSessionId(e.target.value); setPeriodId('') }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">선택</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_number}회차{s.title ? ` — ${s.title}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">교시</label>
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              disabled={!sessionId}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
            >
              <option value="">선택</option>
              {availablePeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.period_number}교시{p.title ? ` — ${p.title}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">공결 사유</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="공결 사유를 상세히 입력해 주세요"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? '신청 중...' : '공결 신청하기'}
        </button>
      </form>
    </div>
  )
}
