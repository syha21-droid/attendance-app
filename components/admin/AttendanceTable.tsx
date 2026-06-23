'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Student, Attendance, Period, Session, AttendanceStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { STATUS_LABELS } from '@/lib/utils/attendance'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Download, Edit2 } from 'lucide-react'

interface Row {
  student: Student
  periods: Period[]
  attendanceMap: Record<string, Attendance>
}

interface Props {
  rows: Row[]
  session: Session | null
}

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'late', 'absent', 'excused', 'exited']
const statusVariant = (s: string): 'present' | 'late' | 'absent' | 'excused' | 'exited' | 'default' => {
  return (s as 'present') ?? 'default'
}

export function AttendanceTable({ rows, session }: Props) {
  const [editing, setEditing] = useState<{ attendanceId: string; status: AttendanceStatus } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function saveEdit() {
    if (!editing) return
    const { error } = await supabase
      .from('attendance')
      .update({ status: editing.status, updated_at: new Date().toISOString() })
      .eq('id', editing.attendanceId)
    if (error) {
      toast.error('수정 실패')
    } else {
      toast.success('출결 상태가 수정되었습니다')
      setEditing(null)
      router.refresh()
    }
  }

  async function convertExcused(attendanceId: string) {
    const { error } = await supabase
      .from('attendance')
      .update({ status: 'excused', updated_at: new Date().toISOString() })
      .eq('id', attendanceId)
    if (error) toast.error('처리 실패')
    else {
      toast.success('공결로 전환되었습니다')
      router.refresh()
    }
  }

  function downloadCSV() {
    const headers = ['이름', '이메일', '1교시', '2교시', '3교시']
    const csvRows = rows.map(({ student, periods, attendanceMap }) => {
      const cols = periods.map((p) => {
        const att = attendanceMap[p.id]
        return att ? STATUS_LABELS[att.status] : '—'
      })
      return [student.name, student.email, ...cols].join(',')
    })
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `출결_${session?.session_number ?? ''}회차.csv`
    a.click()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">출결 현황</h2>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border rounded-lg px-3 py-1.5"
        >
          <Download className="w-4 h-4" />
          CSV 다운로드
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4 font-medium">이름</th>
              <th className="pb-3 pr-4 font-medium">1교시</th>
              <th className="pb-3 pr-4 font-medium">2교시</th>
              <th className="pb-3 pr-4 font-medium">3교시</th>
              <th className="pb-3 font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ student, periods, attendanceMap }) => (
              <tr key={student.id}>
                <td className="py-3 pr-4">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-gray-400">{student.email}</p>
                </td>
                {[1, 2, 3].map((pNum) => {
                  const period = periods.find((p) => p.period_number === pNum)
                  const att = period ? attendanceMap[period.id] : null
                  return (
                    <td key={pNum} className="py-3 pr-4">
                      {att ? (
                        <div className="flex flex-col gap-0.5">
                          {editing?.attendanceId === att.id ? (
                            <select
                              value={editing.status}
                              onChange={(e) => setEditing({ ...editing, status: e.target.value as AttendanceStatus })}
                              className="border rounded px-1.5 py-1 text-xs"
                              autoFocus
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          ) : (
                            <Badge variant={statusVariant(att.status)}>
                              {STATUS_LABELS[att.status]}
                            </Badge>
                          )}
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
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {periods.map((period) => {
                      const att = attendanceMap[period.id]
                      if (!att) return null
                      return (
                        <div key={period.id} className="flex gap-1">
                          {editing?.attendanceId === att.id ? (
                            <button
                              onClick={saveEdit}
                              className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                            >
                              저장
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditing({ attendanceId: att.id, status: att.status })}
                              className="text-xs text-gray-500 hover:text-gray-700 border rounded p-1"
                              title={`${period.period_number}교시 수정`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {att.status === 'absent' && (
                            <button
                              onClick={() => convertExcused(att.id)}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              공결
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">데이터가 없습니다</p>
        )}
      </div>
    </div>
  )
}
