export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 수강생 정보
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!student) redirect('/login')

  // 강좌
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', student.course_id)
    .single()
  if (!course) redirect('/login')

  // 출결 설정
  const { data: settingsRaw } = await supabase
    .from('attendance_settings')
    .select('*')
    .eq('course_id', course.id)
    .single()

  const settings = settingsRaw ?? {
    course_id: course.id,
    late_threshold_minutes: 15,
    absent_threshold_minutes: 30,
    late_to_absent_ratio: 3,
    min_attendance_rate: 80,
    exit_threshold_minutes: 10,
    notify_late: true,
    notify_absent: true,
    notify_low_rate: true,
    notify_excuse_request: true,
  }

  // 모든 회차 + 교시
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, periods(*)')
    .eq('course_id', course.id)
    .order('session_number')

  // 출석 기록 (period_number 포함 위해 join)
  const { data: attendances } = await supabase
    .from('attendance')
    .select('*, period:periods(period_number)')
    .eq('student_id', student.id)

  // 지각 사유 (attendance 상세 포함)
  const { data: lateReasons } = await supabase
    .from('late_reasons')
    .select('*, attendance:attendance(late_minutes, period:periods(period_number), session:sessions(session_number))')
    .eq('student_id', student.id)
    .order('submitted_at', { ascending: false })

  // 공결 신청 이력
  const { data: absenceRequests } = await supabase
    .from('absence_requests')
    .select('*')
    .eq('student_id', student.id)
    .order('requested_at', { ascending: false })

  // 학습 자료
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('course_id', course.id)
    .eq('is_public', true)
    .order('uploaded_at', { ascending: false })

  return (
    <DashboardClient
      student={student}
      course={course}
      settings={settings}
      sessions={sessions ?? []}
      attendances={attendances ?? []}
      lateReasons={lateReasons ?? []}
      absenceRequests={absenceRequests ?? []}
      materials={materials ?? []}
    />
  )
}
