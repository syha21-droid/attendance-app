'use client'

import { ClassPeriod } from '@/lib/supabase'

interface Props {
  period: ClassPeriod
  onToggle: (period: ClassPeriod) => void
  onEdit: (period: ClassPeriod) => void
  onDelete: (id: string) => void
}

export default function PeriodCard({ period, onToggle, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <span className="font-bold text-gray-800 mr-2">{period.period_number}교시</span>
        <span className="text-gray-600 mr-3">{period.name}</span>
        <span className="text-gray-500 text-sm">{period.start_time} ~ {period.end_time}</span>
        <span className="ml-3 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
          지각기준 {period.late_threshold_minutes}분
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(period)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${period.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${period.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className={`text-xs font-medium ${period.is_active ? 'text-blue-600' : 'text-gray-400'}`}>
          {period.is_active ? 'ON' : 'OFF'}
        </span>
        <button onClick={() => onEdit(period)} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">수정</button>
        <button onClick={() => onDelete(period.id)} className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-lg text-red-600">삭제</button>
      </div>
    </div>
  )
}
