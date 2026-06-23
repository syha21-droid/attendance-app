import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { determineStatus } from '@/lib/utils/attendance'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { period_id, session_id } = await req.json()
  if (!period_id || !session_id) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }

  // 교시 정보
  const { data: period } = await supabase
    .from('periods')
    .select('start_time')
    .eq('id', period_id)
    .single()
  if (!period) return NextResponse.json({ error: '교시 없음' }, { status: 404 })

  // 출결 설정
  const { data: student } = await supabase
    .from('students')
    .select('course_id')
    .eq('id', user.id)
    .single()

  const { data: settings } = student
    ? await supabase
        .from('attendance_settings')
        .select('*')
        .eq('course_id', student.course_id)
        .single()
    : { data: null }

  const s = settings ?? {
    late_threshold_minutes: 15,
    absent_threshold_minutes: 30,
    late_to_absent_ratio: 3,
    min_attendance_rate: 80,
    exit_threshold_minutes: 10,
    notify_late: true,
    notify_absent: true,
    notify_low_rate: true,
    notify_excuse_request: true,
    course_id: '',
  }

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const startTime = new Date(`${today}T${period.start_time}`)
  const status = determineStatus(now, startTime, s)
  const lateMinutes =
    status === 'late'
      ? Math.floor((now.getTime() - startTime.getTime()) / 60000)
      : null

  // upsert: 이미 있으면 업데이트 안 함 (first check-in 유지)
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', user.id)
    .eq('period_id', period_id)
    .single()

  if (existing) {
    return NextResponse.json({ message: '이미 체크인됨', status })
  }

  const { error } = await supabase.from('attendance').insert({
    student_id: user.id,
    period_id,
    session_id,
    status,
    check_in_time: now.toISOString(),
    late_minutes: lateMinutes,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ status, late_minutes: lateMinutes })
}
