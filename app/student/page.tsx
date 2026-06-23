export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogOut, BookOpen } from 'lucide-react'
import { getCourses } from '@/lib/storage/courses'

interface User {
  id: string
  email: string
  name: string
  courseId?: string
  isAdmin: boolean
}

export default function StudentPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [showEnrollForm, setShowEnrollForm] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('attendance_current_user')
    if (!userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      const courseList = getCourses()
      setCourses(courseList)

      const enrolled = localStorage.getItem('enrolled_courses_' + parsedUser.id)
      if (enrolled) {
        setEnrolledCourses(JSON.parse(enrolled))
      }
    } catch (e) {
      router.push('/login')
    }
  }, [router])

  const handleEnrollCourse = () => {
    if (!selectedCourse) {
      toast.error('강의를 선택하세요')
      return
    }

    if (enrolledCourses.includes(selectedCourse)) {
      toast.error('이미 수강 중입니다')
      return
    }

    const newEnrolled = [...enrolledCourses, selectedCourse]
    setEnrolledCourses(newEnrolled)
    localStorage.setItem('enrolled_courses_' + user?.id, JSON.stringify(newEnrolled))
    toast.success('✅ 수강 등록 완료!')
    setSelectedCourse('')
    setShowEnrollForm(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    router.push('/login')
  }

  const handleCourseClick = (courseName: string) => {
    window.location.href = '/student/course?name=' + encodeURIComponent(courseName)
  }

  const handleWithdraw = (course: string) => {
    const newEnrolled = enrolledCourses.filter(c => c !== course)
    setEnrolledCourses(newEnrolled)
    localStorage.setItem('enrolled_courses_' + user?.id, JSON.stringify(newEnrolled))
    toast.success('✅ 수강 취소 완료!')
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">학생 대시보드</h1>
          <button onClick={handleLogout} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4 inline mr-2" />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">반갑습니다, {user.name}님!</h2>
          <p className="text-gray-600">📧 {user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <p className="text-gray-600 text-sm">오늘 출석</p>
            <p className="text-3xl font-bold text-blue-600">0회</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <p className="text-gray-600 text-sm">총 출석</p>
            <p className="text-3xl font-bold text-green-600">0회</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <p className="text-gray-600 text-sm">수강 강의</p>
            <p className="text-3xl font-bold text-purple-600">{enrolledCourses.length}개</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              <BookOpen className="w-6 h-6 inline mr-2" />
              수강 강의
            </h3>
            <button
              onClick={() => setShowEnrollForm(!showEnrollForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              + 수강 등록
            </button>
          </div>

          {showEnrollForm && (
            <div className="bg-indigo-50 p-6 rounded-lg mb-6 border border-indigo-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">강의 선택</label>
              <div className="flex gap-2">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">-- 강의를 선택하세요 --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleEnrollCourse}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  등록
                </button>
              </div>
            </div>
          )}

          {enrolledCourses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">수강 강의가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map((course) => (
                <button
                  key={course}
                  onClick={() => handleCourseClick(course)}
                  className="w-full text-left flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200 hover:shadow-lg transition-all"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{course}</p>
                    <p className="text-sm text-gray-600">✅ 수강 중</p>
                  </div>
                  <span className="text-indigo-600">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📋 출석 기록</h3>
          <p className="text-gray-500 text-center py-8">출석 기록이 없습니다</p>
        </div>
      </main>
    </div>
  )
}
