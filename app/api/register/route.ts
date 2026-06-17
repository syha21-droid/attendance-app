import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const { email, password, name, branchId, cohort } = await req.json()

    if (!email || !password || !name || !branchId || !cohort) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: '이미 등록된 이메일입니다' }, { status: 400 })
      }
      throw authError
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      branch_id: branchId,
      name,
      role: 'student',
      cohort,
    })

    if (profileError) throw profileError

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '가입 실패'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
