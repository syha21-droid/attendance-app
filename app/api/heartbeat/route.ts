import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { period_id } = await req.json()
  if (!period_id) return NextResponse.json({ error: 'period_id 필요' }, { status: 400 })

  // heartbeat 기록
  await supabase.from('heartbeats').insert({
    student_id: user.id,
    period_id,
  })

  // 마지막 heartbeat 시간 확인 후 이탈 여부 업데이트
  const { data: student } = await supabase
    .from('students')
    .select('course_id')
    .eq('id', user.id)
    .single()

  if (student) {
    const { data: settingsData } = await supabase
      .from('attendance_settings')
      .select('exit_threshold_minutes')
      .eq('course_id', student.course_id)
      .single()

    const thresholdMin = settingsData?.exit_threshold_minutes ?? 10
    const thresholdMs = thresholdMin * 60 * 1000
    const cutoff = new Date(Date.now() - thresholdMs).toISOString()

    // 이탈 기록 중 미복귀 상태인 것 복귀 처리
    const { data: openDropouts } = await supabase
      .from('dropouts')
      .select('id')
      .eq('student_id', user.id)
      .eq('period_id', period_id)
      .eq('is_returned', false)

    if (openDropouts && openDropouts.length > 0) {
      const now = new Date().toISOString()
      await Promise.all(
        openDropouts.map((d) =>
          supabase.from('dropouts').update({
            return_time: now,
            is_returned: true,
          }).eq('id', d.id)
        )
      )
    }

    // 마지막 heartbeat 확인
    const { data: lastHb } = await supabase
      .from('heartbeats')
      .select('received_at')
      .eq('student_id', user.id)
      .eq('period_id', period_id)
      .order('received_at', { ascending: false })
      .limit(2)

    // 이전 heartbeat와 현재의 간격이 threshold 초과 시 이탈 기록
    if (lastHb && lastHb.length >= 2) {
      const prev = new Date(lastHb[1].received_at)
      if (prev.toISOString() < cutoff) {
        await supabase.from('dropouts').insert({
          student_id: user.id,
          period_id,
          exit_time: prev.toISOString(),
        })

        // 출결 상태 이탈로 업데이트
        await supabase
          .from('attendance')
          .update({ status: 'exited', updated_at: new Date().toISOString() })
          .eq('student_id', user.id)
          .eq('period_id', period_id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
