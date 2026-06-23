'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LateCategory } from '@/types'
import { LATE_CATEGORY_LABELS } from '@/lib/utils/attendance'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

interface Props {
  attendanceId: string
  studentId: string
  sessionNumber: number
  periodNumber: number
  lateMinutes: number
  onSubmitted: () => void
}

const CATEGORIES: LateCategory[] = [
  'traffic', 'health', 'family', 'work', 'parking', 'weather', 'other',
]

export function LateReasonForm({
  attendanceId,
  studentId,
  sessionNumber,
  periodNumber,
  lateMinutes,
  onSubmitted,
}: Props) {
  const [selected, setSelected] = useState<LateCategory[]>([])
  const [detail, setDetail] = useState('')
  const [agreeContact, setAgreeContact] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function toggleCategory(cat: LateCategory) {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.length === 0) {
      toast.error('사유 카테고리를 하나 이상 선택하세요')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('late_reasons').insert({
        attendance_id: attendanceId,
        student_id: studentId,
        categories: selected,
        detail_text: detail || null,
        agree_contact: agreeContact,
      })
      if (error) throw error
      toast.success('지각 사유가 제출되었습니다')
      onSubmitted()
    } catch {
      toast.error('제출에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">
            {sessionNumber}회차 {periodNumber}교시 {lateMinutes}분 지각
          </p>
          <p className="text-sm text-amber-700">지각 사유를 남겨주세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 카테고리 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">사유 선택 (복수 선택 가능)</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selected.includes(cat)
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
                }`}
              >
                {LATE_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* 상세 내용 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            상세 내용 <span className="text-gray-400 font-normal">(선택, 최대 200자)</span>
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="추가 설명을 입력하세요"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="text-right text-xs text-gray-400">{detail.length}/200</p>
        </div>

        {/* 동의 */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeContact}
            onChange={(e) => setAgreeContact(e.target.checked)}
            className="mt-0.5 accent-amber-500"
          />
          <span className="text-xs text-gray-600">
            동일 사유 반복 시 관리자에게 별도 연락할 것에 동의합니다
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 text-white py-2.5 rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading ? '제출 중...' : '사유 제출하기'}
        </button>
      </form>
    </div>
  )
}
