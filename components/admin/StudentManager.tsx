'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Student, Course } from '@/types'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Users, Plus, Edit2, UserX } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  students: Student[]
  courses: Course[]
}

export function StudentManager({ students, courses }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState({ name: '', email: '', course_id: '', password: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.course_id || !form.password) {
      toast.error('모든 항목을 입력해 주세요')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('수강생이 등록되었습니다')
      setShowAdd(false)
      setForm({ name: '', email: '', course_id: '', password: '' })
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '등록 실패')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(student: Student) {
    const { error } = await supabase
      .from('students')
      .update({ is_active: !student.is_active })
      .eq('id', student.id)
    if (error) toast.error('변경 실패')
    else {
      toast.success(student.is_active ? '비활성화되었습니다' : '활성화되었습니다')
      router.refresh()
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const { error } = await supabase
      .from('students')
      .update({ name: editing.name, course_id: editing.course_id })
      .eq('id', editing.id)
    if (error) toast.error('수정 실패')
    else {
      toast.success('수정되었습니다')
      setEditing(null)
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          수강생 관리
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          수강생 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showAdd && (
        <form onSubmit={addStudent} className="border rounded-lg p-4 mb-4 space-y-3 bg-indigo-50">
          <p className="font-medium text-sm text-indigo-800">신규 수강생 등록</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="이메일"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="초기 비밀번호"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
            <select
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">강좌 선택</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? '등록 중...' : '등록'}
          </button>
        </form>
      )}

      {/* 수강생 목록 */}
      <div className="space-y-2">
        {students.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            {editing?.id === s.id ? (
              <form onSubmit={saveEdit} className="flex items-center gap-2 flex-1">
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="border rounded px-2 py-1 text-sm flex-1"
                />
                <select
                  value={editing.course_id}
                  onChange={(e) => setEditing({ ...editing, course_id: e.target.value })}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <button type="submit" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded">저장</button>
                <button type="button" onClick={() => setEditing(null)} className="text-xs text-gray-500">취소</button>
              </form>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {s.name}
                    {!s.is_active && <Badge variant="absent">비활성</Badge>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.email} · 등록: {format(new Date(s.enrolled_at), 'yyyy/M/d')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing(s)}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="수정"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => toggleActive(s)}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title={s.is_active ? '비활성화' : '활성화'}
                  >
                    <UserX className={`w-3.5 h-3.5 ${s.is_active ? 'text-gray-500' : 'text-red-400'}`} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
