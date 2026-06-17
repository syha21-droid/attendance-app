import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const branchId = req.nextUrl.searchParams.get('branchId')
  if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('dropouts')
    .select('*, profiles(id, name, cohort), class_periods(name, period_number, course_type)')
    .eq('branch_id', branchId)
    .order('dropout_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, branchId, cohort, periodId, courseType, dropoutDate, reason, reasonDetail } = body

  if (!userId || !branchId || !dropoutDate || !reason) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin.from('dropouts').insert({
    user_id: userId,
    branch_id: branchId,
    cohort: cohort || null,
    period_id: periodId || null,
    course_type: courseType || null,
    dropout_date: dropoutDate,
    reason,
    reason_detail: reasonDetail || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createServiceClient()
  const { error } = await admin.from('dropouts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
