import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const { email, password, name, role, branchId } = await req.json()

    if (!email || !password || !name || !role || !branchId) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요' }, { status: 400 })
    }

    // Supabase Auth에 유저 생성
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

    // profiles 테이블에 프로필 생성
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      branch_id: branchId,
      name,
      role,
    })

    if (profileError) throw profileError

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error: unknown) {
    console.error('Create user error:', error)
    const msg = error instanceof Error ? error.message : '유저 생성 실패'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get('branchId')

  if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*, branches(name, organizations(name))')
    .eq('branch_id', branchId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = createServiceClient()
  const { userId } = await req.json()

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
