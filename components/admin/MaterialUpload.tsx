'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Course, Session, Period } from '@/types'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'

interface Props {
  courses: Course[]
  sessions: Session[]
  periodsMap: Record<string, Period[]>
}

export function MaterialUpload({ courses, sessions, periodsMap }: Props) {
  const [courseId, setCourseId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [periodId, setPeriodId] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const filteredSessions = courseId ? sessions.filter((s) => s.course_id === courseId) : []
  const filteredPeriods = sessionId ? (periodsMap[sessionId] ?? []) : []

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  function detectType(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? ''
    if (['pdf'].includes(ext)) return 'pdf'
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
    if (['ppt', 'pptx'].includes(ext)) return 'ppt'
    if (['xls', 'xlsx'].includes(ext)) return 'excel'
    if (['doc', 'docx'].includes(ext)) return 'word'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
    return 'other'
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !courseId || !sessionId || !periodId || !title.trim()) {
      toast.error('모든 항목을 입력하고 파일을 선택해 주세요')
      return
    }
    setLoading(true)
    setProgress(10)
    try {
      const path = `materials/${courseId}/${sessionId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      setProgress(70)

      const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)
      setProgress(85)

      const { error: dbError } = await supabase.from('materials').insert({
        course_id: courseId,
        session_id: sessionId,
        period_id: periodId,
        title: title.trim(),
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: detectType(file.name),
        is_public: true,
      })
      if (dbError) throw dbError
      setProgress(100)
      toast.success('자료가 업로드되었습니다')
      setTitle('')
      setFile(null)
      setProgress(0)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '업로드 실패')
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-indigo-500" />
        학습 자료 업로드
      </h2>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">강좌</label>
            <select
              value={courseId}
              onChange={(e) => { setCourseId(e.target.value); setSessionId(''); setPeriodId('') }}
              className="w-full border rounded-lg px-2 py-2 text-sm"
            >
              <option value="">선택</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">회차</label>
            <select
              value={sessionId}
              onChange={(e) => { setSessionId(e.target.value); setPeriodId('') }}
              disabled={!courseId}
              className="w-full border rounded-lg px-2 py-2 text-sm disabled:bg-gray-50"
            >
              <option value="">선택</option>
              {filteredSessions.map((s) => (
                <option key={s.id} value={s.id}>{s.session_number}회차</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">교시</label>
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              disabled={!sessionId}
              className="w-full border rounded-lg px-2 py-2 text-sm disabled:bg-gray-50"
            >
              <option value="">선택</option>
              {filteredPeriods.map((p) => (
                <option key={p.id} value={p.id}>{p.period_number}교시</option>
              ))}
            </select>
          </div>
        </div>

        <input
          type="text"
          placeholder="자료 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* 드래그앤드롭 영역 */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">클릭하거나 파일을 드래그하세요</p>
              <p className="text-xs text-gray-400">PDF, 영상, PPT, Excel, Word, 이미지</p>
            </div>
          )}
        </div>

        {/* 진행률 */}
        {progress > 0 && progress < 100 && (
          <div className="space-y-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-right">{progress}%</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '업로드 중...' : '업로드'}
        </button>
      </form>
    </div>
  )
}
