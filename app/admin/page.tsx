export const dynamic = 'force-dynamic'

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
    } catch (e) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    router.push('/login')
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
