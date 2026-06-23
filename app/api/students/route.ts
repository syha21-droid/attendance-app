import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).single()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { name, email, password, course_id } = await req.json()
  if (!name || !email || !password || !course_id) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }

  // Service Role 키로 사용자 생성
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })

  const { error: insertError } = await adminSupabase.from('students').insert({
    id: newUser.user.id,
    name,
    email,
    course_id,
  })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  return NextResponse.json({ success: true, id: newUser.user.id })
}
