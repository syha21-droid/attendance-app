import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { addMinutes, differenceInMinutes, format, parseISO } from 'date-fns'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const { token, userId } = await req.json()

    if (!token || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // QR 토큰 검증
    const { data: qrToken, error: qrError } = await supabase
      .from('qr_tokens')
      .select('*, class_periods(*)')
      .eq('token', token)
      .single()

    if (qrError || !qrToken) {
      return NextResponse.json({ error: '유효하지 않은 QR코드입니다', code: 'INVALID' }, { status: 400 })
    }

    // 만료 확인
    if (new Date() > new Date(qrToken.expires_at)) {
      return NextResponse.json({ error: 'QR코드가 만료되었습니다', code: 'EXPIRED' }, { status: 400 })
    }

    const period = qrToken.class_periods
    const today = format(new Date(), 'yyyy-MM-dd')

    // 중복 출석 확인
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('period_id', qrToken.period_id)
      .eq('date', today)
      .single()

    if (existing) {
      return NextResponse.json({
        error: '이미 출석하셨습니다',
        code: 'DUPLICATE',
        periodNumber: qrToken.period_number,
        checkedAt: format(new Date(existing.checked_at), 'HH:mm'),
      }, { status: 409 })
    }

    // 지각 판단
    const now = new Date()
    const periodStart = new Date(`${today}T${period.start_time}`)
    const lateDeadline = addMinutes(periodStart, period.late_threshold_minutes)

    let status = 'present'
    let lateMinutes = 0

    if (now > lateDeadline) {
      status = 'late'
      lateMinutes = differenceInMinutes(now, periodStart)
    }

    // 출석 기록
    const { error: insertError } = await supabase.from('attendance').insert({
      user_id: userId,
      period_id: qrToken.period_id,
      period_number: qrToken.period_number,
      checked_at: now.toISOString(),
      date: today,
      status,
      late_minutes: lateMinutes,
    })

    if (insertError) throw insertError

    // 지각 누적 횟수
    let lateCount = 0
    if (status === 'late') {
      const { count } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'late')
      lateCount = count || 0
    }

    return NextResponse.json({
      success: true,
      status,
      periodNumber: qrToken.period_number,
      checkedAt: format(now, 'HH:mm'),
      lateMinutes,
      lateCount,
    })
  } catch (error: unknown) {
    console.error('Attendance error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
