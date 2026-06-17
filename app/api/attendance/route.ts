import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { addMinutes, differenceInMinutes, format } from 'date-fns'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const { token, userId } = await req.json()
    if (!token || !userId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    const { data: qrToken, error: qrError } = await supabase
      .from('qr_tokens')
      .select('*, class_periods(*)')
      .eq('token', token)
      .single()

    if (qrError || !qrToken) return NextResponse.json({ error: '유효하지 않은 QR코드입니다', code: 'INVALID' }, { status: 400 })
    if (new Date() > new Date(qrToken.expires_at)) return NextResponse.json({ error: 'QR코드가 만료되었습니다', code: 'EXPIRED' }, { status: 400 })

    const period = qrToken.class_periods
    const today = format(new Date(), 'yyyy-MM-dd')
    const qrType = qrToken.type || 'checkin'

    // ── 퇴실 처리 ──────────────────────────────────────
    if (qrType === 'checkout') {
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('period_id', qrToken.period_id)
        .eq('date', today)
        .single()

      if (!existing) return NextResponse.json({ error: '입실 체크인 후 퇴실 가능합니다', code: 'NO_CHECKIN' }, { status: 400 })
      if (existing.checkout_at) {
        return NextResponse.json({
          error: '이미 퇴실하셨습니다',
          code: 'DUPLICATE_CHECKOUT',
          checkoutAt: format(new Date(existing.checkout_at), 'HH:mm'),
        }, { status: 409 })
      }

      const now = new Date()
      const periodEnd = new Date(`${today}T${period.end_time}`)
      const earlyMinutes = differenceInMinutes(periodEnd, now)
      const isEarly = earlyMinutes > 0

      await supabase.from('attendance').update({ checkout_at: now.toISOString() }).eq('id', existing.id)

      return NextResponse.json({
        success: true,
        type: 'checkout',
        periodNumber: qrToken.period_number,
        checkoutAt: format(now, 'HH:mm'),
        isEarly,
        earlyMinutes: isEarly ? earlyMinutes : 0,
        message: isEarly
          ? `퇴실 완료 (종료 ${earlyMinutes}분 전 조기 퇴실)`
          : `퇴실 완료! ${period.name} 수업 수고했어요`,
      })
    }

    // ── 입실 처리 ──────────────────────────────────────
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

    const now = new Date()
    const periodStart = new Date(`${today}T${period.start_time}`)
    const lateDeadline = addMinutes(periodStart, period.late_threshold_minutes)
    const status = now > lateDeadline ? 'late' : 'present'
    const lateMinutes = status === 'late' ? differenceInMinutes(now, periodStart) : 0

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

    let lateCount = 0
    if (status === 'late') {
      const { count } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'late')
      lateCount = count || 0
    }

    return NextResponse.json({
      success: true,
      type: 'checkin',
      status,
      periodNumber: qrToken.period_number,
      checkedAt: format(now, 'HH:mm'),
      lateMinutes,
      lateCount,
      message: status === 'present' ? `출석 완료! ${period.name}` : `지각 처리 (${lateMinutes}분 늦음)`,
    })

  } catch (error: unknown) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
