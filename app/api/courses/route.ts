import { getCourses, addCourse, updateCourse, deleteCourse, initializeCourses } from '@/lib/storage/courses'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    initializeCourses()
    const courses = getCourses()
    return NextResponse.json(courses)
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, total_sessions } = await request.json()

    if (!title) {
      return NextResponse.json({ error: '강의명 필수' }, { status: 400 })
    }

    const course = addCourse(title, description, total_sessions)
    return NextResponse.json(course, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : '추가 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, title, description, total_sessions } = await request.json()

    if (!id || !title) {
      return NextResponse.json({ error: 'ID와 강의명 필수' }, { status: 400 })
    }

    const course = updateCourse(id, title, description, total_sessions)
    if (!course) {
      return NextResponse.json({ error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }
    return NextResponse.json(course)
  } catch (err) {
    const message = err instanceof Error ? err.message : '수정 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID 필수' }, { status: 400 })
    }

    const success = deleteCourse(id)
    if (!success) {
      return NextResponse.json({ error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '삭제 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
