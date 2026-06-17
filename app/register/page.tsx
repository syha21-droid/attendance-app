'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    branchName: '',
    cohort: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다')
      return
    }
    if (form.password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          branchName: form.branchName,
          cohort: form.cohort,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '가입 실패')
        return
      }
      toast.success('가입 완료! 로그인 해주세요')
      router.push('/')
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-800">수강생 가입</h1>
          <p className="text-gray-500 mt-1 text-sm">출석체크 시스템 회원가입</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="홍길동"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지점명</label>
            <input
              type="text"
              value={form.branchName}
              onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="예: 에임하이 강남점"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기수</label>
            <input
              type="text"
              value={form.cohort}
              onChange={e => setForm(f => ({ ...f, cohort: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="예: 10기"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="6자 이상"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={e => setForm(f => ({ ...f, passwordConfirm: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="비밀번호 재입력"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/" className="text-blue-600 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  )
}
