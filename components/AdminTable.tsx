'use client'

import { format } from 'date-fns'
import { Attendance, Profile, ClassPeriod } from '@/lib/supabase'

interface Row extends Attendance {
  profiles: Profile & { branches: { name: string; organizations: { name: string } } }
  class_periods: ClassPeriod
}

interface Props {
  rows: Row[]
  onChangeStatus: (id: string, status: 'present' | 'late' | 'absent') => void
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'present') return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ 출석</span>
  if (status === 'late') return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">🟡 지각</span>
  return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">❌ 결석</span>
}

export default function AdminTable({ rows, onChangeStatus }: Props) {
  return (
    <div className="bg-white rounded-xl shadow border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-3 text-left text-gray-600 font-medium">이름</th>
            <th className="px-4 py-3 text-left text-gray-600 font-medium hidden md:table-cell">사업단</th>
            <th className="px-4 py-3 text-left text-gray-600 font-medium hidden md:table-cell">지점</th>
            <th className="px-4 py-3 text-left text-gray-600 font-medium">교시</th>
            <th className="px-4 py-3 text-left text-gray-600 font-medium">입실시각</th>
            <th className="px-4 py-3 text-left text-gray-600 font-medium">상태</th>
            <th className="px-4 py-3 text-left text-gray-600 font-medium hidden md:table-cell">지각시간</th>
            <th className="px-4 py-3 text-left text-gray-600 font-medium">변경</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-12 text-gray-400">출석 기록이 없습니다</td></tr>
          ) : rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{row.profiles?.name || '-'}</td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{row.profiles?.branches?.organizations?.name || '-'}</td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{row.profiles?.branches?.name || '-'}</td>
              <td className="px-4 py-3 text-gray-600">{row.period_number}교시</td>
              <td className="px-4 py-3 text-gray-600 font-mono">
                {row.checked_at ? format(new Date(row.checked_at), 'HH:mm:ss') : '-'}
              </td>
              <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                {row.status === 'late' && row.late_minutes ? `+${row.late_minutes}분` : '-'}
              </td>
              <td className="px-4 py-3">
                <select
                  value={row.status}
                  onChange={(e) => onChangeStatus(row.id, e.target.value as 'present' | 'late' | 'absent')}
                  className="text-xs border rounded px-2 py-1 bg-white text-gray-700"
                >
                  <option value="present">출석</option>
                  <option value="late">지각</option>
                  <option value="absent">결석</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
