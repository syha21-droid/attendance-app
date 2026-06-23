'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Course } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2 } from 'lucide-react'

interface Props {
  courses: Course[]
  onRefresh: () => void
}

export function CourseManager({ courses, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalSessions, setTotalSessions] = useState('20')
  const [loading, setLoading] = useState(false)

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('강의명을 입력해주세요')
      return
    }
    setLoading(true)
    const supabase = createClient()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('courses')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            total_sessions: parseInt(totalSessions) || 20,
          })
          .eq('id', editingId)
        if (error) throw error
        toast.success('강의가 수정되었습니다')
      } else {
        const { error } = await supabase.from('courses').insert({
          title: title.trim(),
          description: description.trim() || null,
          total_sessions: parseInt(totalSessions) || 20,
        })
        if (error) throw error
        toast.success('강의가 추가되었습니다')
      }
      setTitle('')
      setDescription('')
      setTotalSessions('20')
      setShowForm(false)
      setEditingId(null)
      onRefresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '저장 실패'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function handleEditCourse(course: Course) {
    setEditingId(course.id)
    setTitle(course.title)
    setDescription(course.description || '')
    setTotalSessions(course.total_sessions?.toString() || '20')
    setShowForm(true)
  }

  function handleCancelEdit() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setTotalSessions('20')
    setShowForm(false)
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm('이 강의를 삭제하시겠습니까?')) return
    const supabase = createClient()
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
      toast.success('강의가 삭제되었습니다')
      onRefresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '삭제 실패'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      {!showForm && (
        <button
          onClick={() => {
            setEditingId(null)
            setTitle('')
            setDescription('')
            setTotalSessions('20')
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          강의 추가
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSaveCourse} className="bg-white rounded-lg border p-6 space-y-4">
          <h3 className="font-medium text-gray-900">
            {editingId ? '강의 수정' : '강의 추가'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              강의명
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 1번 사업단"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="강의 설명 (선택사항)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              총 회차
            </label>
            <input
              type="number"
              value={totalSessions}
              onChange={(e) => setTotalSessions(e.target.value)}
              min="1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '저장 중...' : editingId ? '수정하기' : '추가하기'}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-gray-500 mt-1">{course.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                총 {course.total_sessions}회차
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditCourse(course)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="수정"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDeleteCourse(course.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="삭제"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">강의가 없습니다</p>
        </div>
      )}
    </div>
  )
}
