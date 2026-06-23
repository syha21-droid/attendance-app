'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { GraduationCap, Lock, Mail, LogOut, BookOpen } from 'lucide-react'
import { initializeUsers, loginUser } from '@/lib/storage/user'
import { initializeCourses, getCourses } from '@/lib/storage/courses'

interface User {
  id: string
  email: string
  name: string
  courseId?: string
  isAdmin: boolean
}

export default function LoginPage() {
  // 출석체크 시스템 로그인 페이지
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [showEnrollForm, setShowEnrollForm] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeCourses()
      const courseList = getCourses()
      setCourses(courseList)

      const userData = localStorage.getItem('attendance_current_user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          setLoggedInUser(user)
          const enrolled = localStorage.getItem('enrolled_courses_' + user.id)
          if (enrolled) {
            setEnrolledCourses(JSON.parse(enrolled))
          }
        } catch (e) {}
      }
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      initializeUsers()
      const user = loginUser(email, password)
      if (!user) throw new Error('이메일 또는 비밀번호가 잘못되었습니다')
      localStorage.setItem('attendance_current_user', JSON.stringify(user))
      setLoggedInUser(user)
      toast.success('✅ 로그인 성공!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '로그인 실패')
    }
    setLoading(false)
  }

  const handleQuickTest = () => {
    const testUser = {
      id: 'test-user-1',
      email: 'test@test.com',
      name: '테스트 사용자',
      courseId: '1번 사업단',
      isAdmin: false,
    }
    localStorage.setItem('attendance_current_user', JSON.stringify(testUser))
    setLoggedInUser(testUser)
    toast.success('✅ 학생 대시보드로 이동합니다!')
  }

  const handleQuickAdminTest = () => {
    const testAdmin = {
      id: 'admin-test-1',
      email: 'admin@test.com',
      name: '테스트 관리자',
      isAdmin: true,
    }
    localStorage.setItem('attendance_current_user', JSON.stringify(testAdmin))
    setLoggedInUser(testAdmin)
    toast.success('✅ 관리자 대시보드로 이동합니다!')
  }

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    setLoggedInUser(null)
    setEnrolledCourses([])
  }

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
    localStorage.setItem('enrolled_courses_' + loggedInUser?.id, JSON.stringify(newEnrolled))
    toast.success('✅ 수강 등록 완료!')
    setSelectedCourse('')
    setShowEnrollForm(false)
  }

  // 학생 대시보드
  if (loggedInUser && !loggedInUser.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">학생 대시보드</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">반갑습니다, {loggedInUser.name}님!</h2>
            <p className="text-gray-600">📧 {loggedInUser.email}</p>
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
                      <option key={c.id} value={c.title}>{c.title}</option>
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
                    onClick={() => window.location.href = '/student/course?name=' + encodeURIComponent(course)}
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

  // 관리자 대시보드
  if (loggedInUser && loggedInUser.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">안녕하세요, {loggedInUser.name}님!</h2>
            <p className="text-gray-600">관리자 권한으로 로그인했습니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 사업단 관리</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 font-medium">
                  ➕ 사업단 추가
                </button>
                <button className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded text-green-700 font-medium">
                  ✏️ 사업단 수정
                </button>
                <button className="w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 rounded text-red-700 font-medium">
                  🗑️ 사업단 삭제
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">👥 학생 관리</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded text-purple-700 font-medium">
                  📋 학생 목록
                </button>
                <button className="w-full text-left px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded text-orange-700 font-medium">
                  📊 출석 현황
                </button>
                <button className="w-full text-left px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded text-yellow-700 font-medium">
                  ⏰ 지각 관리
                </button>
                <button className="w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 rounded text-red-700 font-medium">
                  🚫 중간이탈 관리
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 로그인 페이지
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">출석 관리 시스템</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center mb-3">테스트하기</p>
            <button
              type="button"
              onClick={handleQuickTest}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 text-sm"
            >
              학생 대시보드 테스트
            </button>
            <button
              type="button"
              onClick={handleQuickAdminTest}
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 text-sm mt-2"
            >
              관리자 대시보드 테스트
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">계정 관련 문의는 관리자에게 문의하세요</p>
      </div>
    </div>
  )
}
