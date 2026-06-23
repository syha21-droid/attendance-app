'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeft } from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  enrolledAt: string
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: '김학생', email: 'kim@example.com', enrolledAt: '2024-01-15' },
    { id: '2', name: '이학생', email: 'lee@example.com', enrolledAt: '2024-01-20' },
    { id: '3', name: '박학생', email: 'park@example.com', enrolledAt: '2024-02-01' },
  ])

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-indigo-600 font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">📋 학생 목록</h1>
          <button onClick={handleLogout} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4 inline mr-2" />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">이름</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">이메일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">수강 시작일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">작업</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.enrolledAt}</td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">수정</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
