import { loginUser, initializeUsers } from '@/lib/storage/user'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    initializeUsers()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호 필수' }, { status: 400 })
    }

    const user = loginUser(email, password)
    if (!user) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 잘못되었습니다' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (err) {
    const message = err instanceof Error ? err.message : '로그인 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
