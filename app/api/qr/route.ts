import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const { periodId, periodNumber, branchId, createdBy } = await req.json()

    // 기존 토큰 삭제
    await supabase.from('qr_tokens').delete().eq('period_id', periodId)

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { error } = await supabase.from('qr_tokens').insert({
      branch_id: branchId,
      period_id: periodId,
      period_number: periodNumber,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: createdBy,
    })

    if (error) throw error

    return NextResponse.json({ token, expiresAt: expiresAt.toISOString() })
  } catch (error: unknown) {
    console.error('QR error:', error)
    return NextResponse.json({ error: 'QR 생성 실패' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const { data, error } = await supabase
    .from('qr_tokens')
    .select('*, class_periods(*)')
    .eq('token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: '유효하지 않은 토큰' }, { status: 404 })

  const expired = new Date() > new Date(data.expires_at)
  return NextResponse.json({ ...data, expired })
}
