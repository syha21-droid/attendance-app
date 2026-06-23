'use client'

import { Student, Course, Session, Period, Attendance, AttendanceSettings } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { STATUS_LABELS } from '@/lib/utils/attendance'
import { GraduationCap, BookOpen, Calendar } from 'lucide-react'

interface Props {
  student: Student
  course: Course
  currentSession: Session | null
  currentPeriod: Period | null
  currentAttendance: Attendance | null
  completedSessions: number
  effectiveRate: number
  settings: AttendanceSettings
}

const statusVariant: Record<string, 'present' | 'late' | 'absent' | 'excused' | 'exited' | 'default'> = {
  present: 'present',
  late: 'late',
  absent: 'absent',
  excused: 'excused',
  exited: 'exited',
}

export function DashboardHeader({
  student,
  course,
  currentSession,
  currentPeriod,
  currentAttendance,
  completedSessions,
  effectiveRate,
  settings,
}: Props) {
  const progressPct = Math.round((completedSessions / course.total_sessions) * 100)
  const isLowRate = effectiveRate < settings.min_attendance_rate

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      {/* 기본 정보 */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span className="text-sm text-gray-500">수강생</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{course.title}</p>
        </div>
        {currentAttendance && (
          <Badge variant={statusVariant[currentAttendance.status] ?? 'default'} className="text-sm px-3 py-1">
            현재: {STATUS_LABELS[currentAttendance.status]}
          </Badge>
        )}
      </div>

      {/* 수강 진행률 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-600">
            <Calendar className="w-4 h-4" />
            수강 진행률 — {completedSessions} / {course.total_sessions}회차
          </span>
          <span className="font-semibold text-indigo-600">{progressPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 실질 출석률 */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
        <span className="flex items-center gap-1.5 text-sm text-gray-600">
          <BookOpen className="w-4 h-4" />
          실질 출석률 (지각 환산 반영)
        </span>
        <span
          className={`font-bold text-lg ${
            isLowRate ? 'text-red-600' : 'text-emerald-600'
          }`}
        >
          {effectiveRate}%
        </span>
      </div>

      {/* 현재 회차/교시 */}
      {currentSession && (
        <div className="flex gap-3 text-sm text-gray-500">
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
            {currentSession.session_number}회차
          </span>
          {currentPeriod && (
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
              {currentPeriod.period_number}교시 진행중
            </span>
          )}
        </div>
      )}
    </div>
  )
}
