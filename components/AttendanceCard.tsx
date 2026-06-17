'use client'

import { Attendance, ClassPeriod } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'

interface Props {
  period: ClassPeriod
  record: Attendance | null
}

export default function AttendanceCard({ period, record }: Props) {
  if (!record && !period.is_active) {
    return (
      <div className="flex flex-col items-center gap-1 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm font-bold text-gray-500">{period.period_number}교시</p>
        <p className="text-xs text-gray-400">{period.start_time}~{period.end_time}</p>
        <span className="text-2xl">⏳</span>
        <p className="text-xs text-gray-400">대기중</p>
      </div>
    )
  }

  if (!record && period.is_active) {
    return (
      <Link href="/student/scan" className="flex flex-col items-center gap-1 p-4 bg-blue-50 rounded-xl border-2 border-blue-300 hover:bg-blue-100 transition-colors">
        <p className="text-sm font-bold text-blue-700">{period.period_number}교시</p>
        <p className="text-xs text-blue-500">{period.start_time}~{period.end_time}</p>
        <span className="text-2xl">📷</span>
        <p className="text-xs text-blue-600 font-medium">스캔하기</p>
      </Link>
    )
  }

  const colors = record?.status === 'present'
    ? 'bg-green-50 border-green-200'
    : record?.status === 'late'
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200'

  return (
    <div className={`flex flex-col items-center gap-1 p-4 rounded-xl border ${colors}`}>
      <p className="text-sm font-bold text-gray-700">{period.period_number}교시</p>
      <p className="text-xs text-gray-500">{period.start_time}~{period.end_time}</p>
      <span className="text-2xl">
        {record?.status === 'present' ? '✅' : record?.status === 'late' ? '🟡' : '❌'}
      </span>
      {record && record.status !== 'absent' && (
        <p className="text-xs text-gray-600 font-mono">{format(new Date(record.checked_at), 'HH:mm')}</p>
      )}
      <p className="text-xs text-gray-500">
        {record?.status === 'present' ? '출석' : record?.status === 'late' ? `지각(+${record.late_minutes}분)` : '결석'}
      </p>
    </div>
  )
}
