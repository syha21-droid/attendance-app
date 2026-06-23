'use client'

import { useState } from 'react'
import { Dropout, Student, Period, Session } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { format, differenceInMinutes } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AlertTriangle, LogOut } from 'lucide-react'

interface DropoutRow extends Dropout {
  student: Student
  period: Period
  session: Session
}

interface Props {
  dropouts: DropoutRow[]
}

export function DropoutManager({ dropouts }: Props) {
  const [selected, setSelected] = useState<Student | null>(null)

  const studentDropouts = selected
    ? dropouts.filter((d) => d.student_id === selected.id)
    : []

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <LogOut className="w-5 h-5 text-pink-500" />
        중간 이탈 관리
      </h2>

      <div className="space-y-3">
        {dropouts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">이탈 기록이 없습니다</p>
        ) : (
          dropouts.map((d) => {
            const duration = d.duration_minutes ??
              (d.return_time
                ? differenceInMinutes(new Date(d.return_time), new Date(d.exit_time))
                : differenceInMinutes(new Date(), new Date(d.exit_time)))
            const isLong = duration >= 30

            return (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <button
                    onClick={() => setSelected(d.student)}
                    className="font-medium text-sm text-indigo-600 hover:underline"
                  >
                    {d.student.name}
                  </button>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {d.session.session_number}회차 {d.period.period_number}교시 ·{' '}
                    이탈: {format(new Date(d.exit_time), 'HH:mm', { locale: ko })}
                    {d.return_time && ` · 복귀: ${format(new Date(d.return_time), 'HH:mm', { locale: ko })}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isLong && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <Badge variant={d.is_returned ? 'present' : 'exited'}>
                    {duration}분{d.is_returned ? ' (복귀)' : ''}
                  </Badge>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 상세 모달 */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`${selected?.name} — 이탈 이력`}
      >
        <div className="space-y-3">
          {studentDropouts.map((d) => {
            const duration = d.duration_minutes ??
              (d.return_time
                ? differenceInMinutes(new Date(d.return_time), new Date(d.exit_time))
                : differenceInMinutes(new Date(), new Date(d.exit_time)))
            return (
              <div key={d.id} className="border rounded p-3 space-y-1">
                <p className="text-sm font-medium">
                  {d.session.session_number}회차 {d.period.period_number}교시
                </p>
                <p className="text-xs text-gray-500">
                  이탈: {format(new Date(d.exit_time), 'M/d HH:mm')}
                  {d.return_time && ` → 복귀: ${format(new Date(d.return_time), 'M/d HH:mm')}`}
                </p>
                <p className="text-xs font-medium text-pink-600">{duration}분 이탈</p>
              </div>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
