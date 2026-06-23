'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogOut } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<string[]>([])
  const [newCourse, setNewCourse] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('attendance_current_user')
    if (!userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (!parsedUser.isAdmin) {
        router.push('/student')
        return
      }
      setUser(parsedUser)

      const savedCourses = localStorage.getItem('admin_courses')
      if (savedCourses) {
        setCourses(JSON.parse(savedCourses))
      }
    } catch (e) {
      router.push('/login')
    }
  }, [router])

  const handleAddCourse = () => {
    if (!newCourse.trim()) {
      toast.error('강의명을 입력하세요')
      return
    }
    const updated = [...courses, newCourse]
    setCourses(updated)
    localStorage.setItem('admin_courses', JSON.stringify(updated))
    setNewCourse('')
    toast.success('✅ 강의가 추가되었습니다')
  }

  const handleDeleteCourse = (index: number) => {
    const updated = courses.filter((_, i) => i !== index)
    setCourses(updated)
    localStorage.setItem('admin_courses', JSON.stringify(updated))
    toast.success('✅ 강의가 삭제되었습니다')
  }

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    router.push('/login')
  }

  const handleStudentList = () => {
    toast.success('✅ 학생 목록 페이지로 이동합니다')
    setTimeout(() => router.push('/admin/students'), 500)
  }

  const handleAttendance = () => {
    toast.success('✅ 출석 현황 페이지로 이동합니다')
    setTimeout(() => router.push('/admin/attendance'), 500)
  }

  const handleLateReason = () => {
    toast.success('✅ 지각 관리 페이지로 이동합니다')
    setTimeout(() => router.push('/admin/late-reasons'), 500)
  }

  const handleDropout = () => {
    toast.success('✅ 중간이탈 관리 페이지로 이동합니다')
    setTimeout(() => router.push('/admin/dropouts'), 500)
  }

  const handleCourseAdd = () => {
    toast.success('✅ 사업단이 추가되었습니다')
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          <button onClick={handleLogout} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4 inline mr-2" />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">안녕하세요, {user.name}님!</h2>
          <p className="text-gray-600">관리자 권한으로 로그인했습니다</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📚 강의 관리</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              placeholder="강의명 입력 (예: 토요특강, Python 기초...)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCourse()}
            />
            <button
              onClick={handleAddCourse}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              + 추가
            </button>
          </div>
          {courses.length > 0 && (
            <div className="space-y-2">
              {courses.map((course, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-900">{course}</span>
                  <button
                    onClick={() => handleDeleteCourse(idx)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📊 사업단 관리</h3>
            <div className="space-y-2">
              <button onClick={handleCourseAdd} className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 font-medium">
                ➕ 사업단 추가
              </button>
              <button onClick={() => toast.info('준비 중입니다')} className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded text-green-700 font-medium">
                ✏️ 사업단 수정
              </button>
              <button onClick={() => toast.info('준비 중입니다')} className="w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 rounded text-red-700 font-medium">
                🗑️ 사업단 삭제
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">👥 학생 관리</h3>
            <div className="space-y-2">
              <button onClick={handleStudentList} className="w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded text-purple-700 font-medium">
                📋 학생 목록
              </button>
              <button onClick={handleAttendance} className="w-full text-left px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded text-orange-700 font-medium">
                📊 출석 현황
              </button>
              <button onClick={handleLateReason} className="w-full text-left px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded text-yellow-700 font-medium">
                ⏰ 지각 관리
              </button>
              <button onClick={handleDropout} className="w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 rounded text-red-700 font-medium">
                🚫 중간이탈 관리
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
