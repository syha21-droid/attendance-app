'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { GraduationCap, Lock, Mail, BookOpen, Shield } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'admin_signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [classNumber, setClassNumber] = useState('')
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const ADMIN_CODE = '1234'

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses')
        if (!res.ok) throw new Error('사업단 로드 실패')
        const data = await res.json()
        console.log('Courses fetch result:', { data })
        setCourses(data)
      } catch (err) {
        console.error('Courses fetch error:', err)
      }
    }
    fetchCourses()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (admin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '로그인 실패'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId) {
      toast.error('사업단을 선택해주세요')
      return
    }
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError

      await supabase.from('students').insert({
        id: authData.user?.id,
        name,
        email,
        course_id: courseId,
      })

      toast.success('가입 완료! 로그인해주세요')
      setMode('login')
      setEmail('')
      setPassword('')
      setName('')
      setCourseId('')
      setClassNumber('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '가입 실패'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdminSignup(e: React.FormEvent) {
    e.preventDefault()
    if (adminCode !== ADMIN_CODE) {
      toast.error('관리자 코드가 올바르지 않습니다')
      return
    }
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError

      await supabase.from('admins').insert({
        id: authData.user?.id,
        name,
        email,
      })

      toast.success('관리자 가입 완료! 로그인해주세요')
      setMode('login')
      setEmail('')
      setPassword('')
      setName('')
      setAdminCode('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '관리자 가입 실패'
      toast.error(message)
    } finally {
      setLoading(false)
    }
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
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Shield className="w-4 h-4" />
                관리자 코드
              </label>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
                placeholder="관리자 코드 입력"
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
