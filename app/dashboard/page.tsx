'use client'

import { useRouter } from 'next/navigation'
import { getCurrentUser, logoutUser } from '@/lib/storage/user'
import { LogOut, Home } from 'lucide-react'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
  courseId?: string
  isAdmin: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>
  }

  if (!user) {
    return null
  }

  function handleLogout() {
    logoutUser()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">출석 관리 대시보드</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            반갑습니다, {user.name}님!
          </h2>
          <p className="text-gray-600 mb-6">이메일: {user.email}</p>

          {user.courseId && (
            <p className="text-gray-600 mb-6">사업단: {user.courseId}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">오늘의 출석</h3>
              <p className="text-3xl font-bold text-blue-600">미확인</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">총 출석</h3>
              <p className="text-3xl font-bold text-green-600">0회</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">지각</h3>
              <p className="text-3xl font-bold text-orange-600">0회</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">시스템 정보</h3>
            <p className="text-gray-700">
              출석 관리 시스템에 로그인 했습니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
