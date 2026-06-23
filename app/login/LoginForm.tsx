'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { GraduationCap, Lock, Mail, LogOut } from 'lucide-react'
import { initializeUsers, loginUser, registerUser, userExists } from '@/lib/storage/user'
import { initializeCourses, getCourses } from '@/lib/storage/courses'

interface User {
  id: string
  email: string
  name: string
  courseId?: string
  isAdmin: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup' | 'admin_signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [classNumber, setClassNumber] = useState('')
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeCourses()
      const courseList = getCourses()
      setCourses(courseList)
    }
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      initializeUsers()
      const user = loginUser(email, password)
      if (!user) {
        throw new Error('이메일 또는 비밀번호가 잘못되었습니다')
      }

      localStorage.setItem('attendance_current_user', JSON.stringify(user))
      toast.success('로그인 성공!')

      setTimeout(() => {
        if (user.isAdmin) {
          window.location.href = '/admin'
        } else {
          window.location.href = '/student'
        }
      }, 500)
      setLoading(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '로그인 실패'
      toast.error(message)
      setLoading(false)
    }
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId) {
      toast.error('사업단을 입력해주세요')
      return
    }
    setLoading(true)
    try {
      if (typeof window === 'undefined') throw new Error('클라이언트에서만 실행 가능')

      initializeUsers()
      if (userExists(email)) {
        throw new Error('이미 존재하는 이메일입니다')
      }

      const newUser = registerUser({
        email,
        password,
        name,
        courseId,
        isAdmin: false,
      })

      localStorage.setItem('attendance_current_user', JSON.stringify(newUser))
      toast.success('✅ 가입 완료! 학생 대시보드로 이동합니다.')
      setTimeout(() => {
        window.location.href = '/student'
      }, 500)
      setLoading(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '가입 실패'
      toast.error(message)
      setLoading(false)
    }
  }

  function handleAdminSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (typeof window === 'undefined') throw new Error('클라이언트에서만 실행 가능')

      initializeUsers()
      if (userExists(email)) {
        throw new Error('이미 존재하는 이메일입니다')
      }

      const newAdmin = registerUser({
        email,
        password,
        name,
        isAdmin: true,
      })

      localStorage.setItem('attendance_current_user', JSON.stringify(newAdmin))
      toast.success('✅ 관리자 가입 완료! 관리자 대시보드로 이동합니다.')
      setTimeout(() => {
        window.location.href = '/admin'
      }, 500)
      setLoading(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '관리자 가입 실패'
      toast.error(message)
      setLoading(false)
    }
  }

  function handleQuickTest() {
    const testUser = {
      id: 'test-user-1',
      email: 'test@test.com',
      password: 'test1234',
      name: '테스트 사용자',
      courseId: '1번 사업단',
      isAdmin: false,
    }
    localStorage.setItem('attendance_current_user', JSON.stringify(testUser))
    toast.success('✅ 학생 대시보드로 이동합니다!')
    setTimeout(() => {
      window.location.href = '/student'
    }, 500)
  }

  function handleQuickAdminTest() {
    const testAdmin = {
      id: 'admin-test-1',
      email: 'admin@test.com',
      password: 'test1234',
      name: '테스트 관리자',
      isAdmin: true,
    }
    localStorage.setItem('attendance_current_user', JSON.stringify(testAdmin))
    toast.success('✅ 관리자 대시보드로 이동합니다!')
    setTimeout(() => {
      window.location.href = '/admin'
    }, 500)
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">출석 관리 시스템</h1>
        </div>

        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            회원가입
          </button>
          <button
            onClick={() => setMode('admin_signup')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'admin_signup'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            관리자
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center mb-3">테스트하기</p>
              <button
                type="button"
                onClick={handleQuickTest}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
              >
                학생 대시보드 테스트
              </button>
              <button
                type="button"
                onClick={handleQuickAdminTest}
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm mt-2"
              >
                관리자 대시보드 테스트
              </button>
            </div>
          </form>
        ) : mode === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업단
              </label>
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                placeholder="예: 1번 사업단"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기수
              </label>
              <input
                type="text"
                value={classNumber}
                onChange={(e) => setClassNumber(e.target.value)}
                placeholder="예: 10기"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '관리자 등록 중...' : '관리자 등록'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          계정 관련 문의는 관리자에게 문의하세요
        </p>
      </div>
    </div>
  )
}
