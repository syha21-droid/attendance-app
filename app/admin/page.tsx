export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'
import { Period } from '@/types'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // admin 확인
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!admin) redirect('/dashboard')

  // 강좌 목록
  const { data: courses } = await supabase.from('courses').select('*').order('created_at')

  // 회차 + 교시
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, periods(*)')
    .order('session_number')

  // 수강생 전체
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('name')

  // 오늘 출결 데이터
  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions?.find((s) => s.date === today)

  let todayAttendances: unknown[] = []
  if (todaySession) {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', todaySession.id)
    todayAttendances = data ?? []
  }

  // 지각 사유 목록
  const { data: lateReasons } = await supabase
    .from('late_reasons')
    .select('*, student:students(*), attendance:attendance(late_minutes, attendance_id:id, period:periods(period_number), session:sessions(session_number))')
    .order('submitted_at', { ascending: false })

  // 공결 신청
  const { data: absenceRequests } = await supabase
    .from('absence_requests')
    .select('*, student:students(*), session:sessions(*), period:periods(*)')
    .order('requested_at', { ascending: false })

  // 이탈 기록
  const { data: dropouts } = await supabase
    .from('dropouts')
    .select('*, student:students(*), period:periods(*), session:sessions(*)')
    .order('exit_time', { ascending: false })

  // 출결 설정 (첫 번째 강좌 기준)
  const firstCourse = courses?.[0]
  const { data: settingsRaw } = firstCourse
    ? await supabase.from('attendance_settings').select('*').eq('course_id', firstCourse.id).single()
    : { data: null }

  const settings = settingsRaw ?? {
    course_id: firstCourse?.id ?? '',
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

  // 학습 자료
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .order('uploaded_at', { ascending: false })

  // periodsMap
  const periodsMap: Record<string, Period[]> = {}
  sessions?.forEach((s) => {
    periodsMap[s.id] = (s.periods ?? []) as Period[]
  })

  // 오늘 출결 요약
  const counts = { present: 0, late: 0, absent: 0, excused: 0, exited: 0 }
  todayAttendances.forEach((a: unknown) => {
    const att = a as { status: string }
    if (att.status in counts) counts[att.status as keyof typeof counts]++
  })

  return (
    <AdminClient
      admin={admin}
      courses={courses ?? []}
      sessions={sessions ?? []}
      students={students ?? []}
      lateReasons={lateReasons ?? []}
      absenceRequests={absenceRequests ?? []}
      dropouts={dropouts ?? []}
      settings={settings}
      materials={materials ?? []}
      periodsMap={periodsMap}
      todayCounts={counts}
      todaySession={todaySession ?? null}
    />
  )
}
