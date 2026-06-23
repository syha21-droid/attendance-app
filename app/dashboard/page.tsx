'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [data, setData] = useState({ name: '로딩 중', email: '', courseId: '' })

  useEffect(() => {
    const d = localStorage.getItem('attendance_current_user')
    if (d) {
      setData(JSON.parse(d))
    }
  }, [])

  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded p-8 shadow">
          <h1 className="text-4xl font-bold mb-6">반갑습니다, {data.name}님!</h1>

          <div className="mb-8">
            <p className="text-lg mb-2">📧 이메일: {data.email}</p>
            <p className="text-lg">🏢 사업단: {data.courseId || '없음'}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-6 rounded border-2 border-blue-200">
              <p className="text-sm text-gray-600">오늘의 출석</p>
              <p className="text-3xl font-bold text-blue-600">미확인</p>
            </div>
            <div className="bg-green-50 p-6 rounded border-2 border-green-200">
              <p className="text-sm text-gray-600">총 출석</p>
              <p className="text-3xl font-bold text-green-600">0회</p>
            </div>
            <div className="bg-orange-50 p-6 rounded border-2 border-orange-200">
              <p className="text-sm text-gray-600">지각</p>
              <p className="text-3xl font-bold text-orange-600">0회</p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.clear()
              window.location.href = '/login'
            }}
            className="bg-red-500 text-white px-6 py-3 rounded font-bold"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
