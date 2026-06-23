'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Student, Course, Session, Period, Attendance, AttendanceSettings, Material, LateReason, AbsenceRequest } from '@/types'
import { calcAttendanceStats } from '@/lib/utils/attendance'
import { useHeartbeat } from '@/lib/hooks/useHeartbeat'
import { DashboardHeader } from '@/components/student/DashboardHeader'
import { AttendanceSummaryCards } from '@/components/student/AttendanceSummaryCards'
import { TodaySchedule } from '@/components/student/TodaySchedule'
import { MaterialsList } from '@/components/student/MaterialsList'
import { LateReasonForm } from '@/components/student/LateReasonForm'
import { LateReasonHistory } from '@/components/student/LateReasonHistory'
import { AbsenceRequestForm } from '@/components/student/AbsenceRequestForm'
import { AttendanceHistory } from '@/components/student/AttendanceHistory'
import { AttendanceWarning } from '@/components/student/AttendanceWarning'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface SessionWithPeriods extends Session {
  periods: Period[]
}

interface Props {
  student: Student
  course: Course
  settings: AttendanceSettings
  sessions: SessionWithPeriods[]
  attendances: (Attendance & { period: { period_number: number } })[]
  lateReasons: (LateReason & {
    attendance: {
      late_minutes: number | null
      period: { period_number: number }
      session: { session_number: number }
    }
  })[]
  absenceRequests: AbsenceRequest[]
  materials: Material[]
}

export function DashboardClient({
  student,
  course,
  settings,
  sessions,
  attendances,
  lateReasons,
  absenceRequests: initialAbsenceRequests,
  materials,
}: Props) {
  const router = useRouter()

  const today = format(new Date(), 'yyyy-MM-dd')
  const todaySession = sessions.find((s) => s.date === today) ?? null
  const currentPeriod = todaySession?.periods.find((p) => {
    const now = new Date()
    const start = new Date(`${today}T${p.start_time}`)
    const end = new Date(`${today}T${p.end_time}`)
    return now >= start && now <= end
  }) ?? null

  // 오늘 출석 데이터
  const todayAttMap: Record<string, Attendance & { period: { period_number: number } }> = {}
  attendances
    .filter((a) => a.session_id === todaySession?.id)
    .forEach((a) => { todayAttMap[a.period_id] = a })

  // 지각이면서 사유 미제출인 항목
  const pendingLate = todaySession
    ? attendances.filter(
        (a) =>
          a.session_id === todaySession.id &&
          a.status === 'late' &&
          !lateReasons.some((r) => r.attendance_id === a.id)
      )
    : []

  // heartbeat
  useHeartbeat(student.id, currentPeriod?.id ?? null)

  // 출결 통계
  const counts = { present: 0, late: 0, absent: 0, excused: 0, exited: 0 }
  attendances.forEach((a) => {
    if (a.status in counts) counts[a.status as keyof typeof counts]++
  })
  const totalPeriods = sessions.reduce((sum, s) => sum + s.periods.length, 0)
  const stats = calcAttendanceStats(
    counts.present,
    counts.late,
    counts.absent,
    counts.excused,
    counts.exited,
    totalPeriods,
    settings
  )

  const completedSessions = sessions.filter((s) => s.date < today).length

  // 현재 회차 자료
  const currentMaterials = todaySession
    ? materials.filter((m) => m.session_id === todaySession.id)
    : []

  // 이전 회차 자료
  const pastSessionMaterials = sessions
    .filter((s) => s.date < today)
    .map((s) => ({
      session: s,
      materials: materials.filter((m) => m.session_id === s.id),
    }))
    .filter((x) => x.materials.length > 0)

  // 회차별 이력
  const historyRows = sessions.map((s) => {
    const attMap: Record<string, Attendance & { period_number: number }> = {}
    attendances
      .filter((a) => a.session_id === s.id)
      .forEach((a) => {
        attMap[a.period_id] = { ...a, period_number: a.period.period_number }
      })
    return { session: s, periods: s.periods, attendanceMap: attMap }
  })

  // 공결 신청용 periods map
  const periodsMap: Record<string, Period[]> = {}
  sessions.forEach((s) => { periodsMap[s.id] = s.periods })

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('로그아웃 되었습니다')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-indigo-700">출석 관리 시스템</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* A9. 출석률 경고 */}
        <AttendanceWarning
          currentRate={stats.effectiveAttendanceRate}
          minRate={settings.min_attendance_rate}
        />

        {/* A1. 대시보드 헤더 */}
        <DashboardHeader
          student={student}
          course={course}
          currentSession={todaySession}
          currentPeriod={currentPeriod}
          currentAttendance={
            currentPeriod ? (todayAttMap[currentPeriod.id] ?? null) : null
          }
          completedSessions={completedSessions}
          effectiveRate={stats.effectiveAttendanceRate}
          settings={settings}
        />

        {/* A2. 출결 요약 */}
        <AttendanceSummaryCards
          present={stats.present}
          late={stats.late}
          absent={stats.absent}
          excused={stats.excused}
        />

        {/* A5. 지각 사유 입력 (지각 감지 시) */}
        {pendingLate.map((att) => (
          <LateReasonForm
            key={att.id}
            attendanceId={att.id}
            studentId={student.id}
            sessionNumber={todaySession!.session_number}
            periodNumber={att.period.period_number}
            lateMinutes={att.late_minutes ?? 0}
            onSubmitted={() => router.refresh()}
          />
        ))}

        {/* A3. 오늘 교시별 현황 */}
        {todaySession && (
          <TodaySchedule
            items={todaySession.periods.map((p) => ({
              period: p,
              attendance: todayAttMap[p.id] ?? null,
            }))}
          />
        )}

        {/* A4. 학습 자료 */}
        <MaterialsList
          currentMaterials={currentMaterials}
          pastSessions={pastSessionMaterials}
        />

        {/* A7. 공결 신청 */}
        <AbsenceRequestForm
          studentId={student.id}
          sessions={sessions}
          periodsMap={periodsMap}
          onSubmitted={() => router.refresh()}
        />

        {/* A6. 지각 사유 이력 */}
        <LateReasonHistory reasons={lateReasons} />

        {/* A8. 전체 출결 이력 */}
        <AttendanceHistory rows={historyRows} />
      </main>
    </div>
  )
}
