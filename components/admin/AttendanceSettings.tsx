'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AttendanceSettings as Settings, Course } from '@/types'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Settings2 } from 'lucide-react'

interface Props {
  settings: Settings
  courses: Course[]
}

export function AttendanceSettingsPanel({ settings: initial, courses }: Props) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase
      .from('attendance_settings')
      .upsert(form, { onConflict: 'course_id' })
    if (error) toast.error('저장 실패')
    else {
      toast.success('설정이 저장되었습니다')
      router.refresh()
    }
    setLoading(false)
  }

  const courseName = courses.find((c) => c.id === form.course_id)?.title ?? '—'

  const numField = (
    label: string,
    key: keyof Settings,
    suffix: string
  ) => (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={form[key] as number}
          onChange={(e) => update(key, Number(e.target.value) as Settings[typeof key])}
          min={1}
          className="w-20 border rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <span className="text-sm text-gray-500">{suffix}</span>
      </div>
    </div>
  )

  const toggle = (label: string, key: keyof Settings) => (
    <label key={key} className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type="checkbox"
        checked={form[key] as boolean}
        onChange={(e) => update(key, e.target.checked as Settings[typeof key])}
        className="w-4 h-4 accent-indigo-600"
      />
    </label>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-indigo-500" />
        출결 설정
      </h2>
      <p className="text-xs text-gray-400 mb-4">강좌: {courseName}</p>

      <form onSubmit={save} className="space-y-1 divide-y">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">지각·결석 기준</p>
          {numField('지각 인정 시간 (수업 시작 후)', 'late_threshold_minutes', '분까지')}
          {numField('결석 전환 시간 (수업 시작 후)', 'absent_threshold_minutes', '분 초과')}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">환산 기준</p>
          {numField('지각 N회 = 결석 1회', 'late_to_absent_ratio', '회')}
          {numField('최소 출석률 기준', 'min_attendance_rate', '%')}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">이탈 기준</p>
          {numField('heartbeat 미수신 이탈 처리', 'exit_threshold_minutes', '분 초과')}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">알림 설정</p>
          {toggle('지각 발생 시 관리자 알림', 'notify_late')}
          {toggle('결석 발생 시 관리자 알림', 'notify_absent')}
          {toggle('지각 사유 제출 시 관리자 알림', 'notify_excuse_request')}
          {toggle('출석률 기준 미달 시 수강생 경고 배너', 'notify_low_rate')}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
