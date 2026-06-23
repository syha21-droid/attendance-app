import { registerUser, userExists, initializeUsers } from '@/lib/storage/user'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    initializeUsers()
    const { email, password, name, courseId, isAdmin } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: '이메일, 비밀번호, 이름 필수' }, { status: 400 })
    }

    if (userExists(email)) {
      return NextResponse.json({ error: '이미 존재하는 이메일입니다' }, { status: 400 })
    }

    const user = registerUser({
      email,
      password,
      name,
      courseId: courseId || name,
      isAdmin: isAdmin || false,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : '가입 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
