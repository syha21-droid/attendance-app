'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, ClassPeriod, Profile } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function PeriodsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [periods, setPeriods] = useState<ClassPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ClassPeriod>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPeriod, setNewPeriod] = useState({
    period_number: 1,
    name: '',
    start_time: '09:00',
    end_time: '10:30',
    late_threshold_minutes: 5,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*, branches(*, organizations(*))')
      .eq('id', user.id)
      .single()

    if (!prof || prof.role !== 'admin') { router.push('/'); return }
    setProfile(prof)

    const { data: pds } = await supabase
      .from('class_periods')
      .select('*')
      .eq('branch_id', prof.branch_id)
      .order('period_number')

    setPeriods(pds || [])
    setLoading(false)
  }

  async function toggleActive(period: ClassPeriod) {
    const { error } = await supabase
      .from('class_periods')
      .update({ is_active: !period.is_active })
      .eq('id', period.id)

    if (error) { toast.error('변경 실패'); return }
    toast.success(period.is_active ? '비활성화 되었습니다' : '활성화 되었습니다')
    loadData()
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from('class_periods')
      .update(editForm)
      .eq('id', id)

    if (error) { toast.error('저장 실패'); return }
    toast.success('저장되었습니다')
    setEditingId(null)
    loadData()
  }

  async function deletePeriod(id: string) {
    if (!confirm('교시를 삭제하시겠습니까?')) return
    const { error } = await supabase.from('class_periods').delete().eq('id', id)
    if (error) { toast.error('삭제 실패'); return }
    toast.success('삭제되었습니다')
    loadData()
  }

  async function addPeriod() {
    if (!profile) return
    const { error } = await supabase.from('class_periods').insert({
      ...newPeriod,
      branch_id: profile.branch_id,
      is_active: false,
    })
    if (error) { toast.error('추가 실패: ' + error.message); return }
    toast.success('교시가 추가되었습니다')
    setShowAddForm(false)
    setNewPeriod({ period_number: 1, name: '', start_time: '09:00', end_time: '10:30', late_threshold_minutes: 5 })
    loadData()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">로딩 중...</div>
    </div>
  )

  const orgName = (profile as any)?.branches?.organizations?.name || ''
  const branchName = (profile as any)?.branches?.name || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{orgName} &gt; {branchName}</p>
            <h1 className="text-xl font-bold text-gray-800">교시 설정</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">대시보드</Link>
            <Link href="/admin/qr" className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors">QR 생성</Link>
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {periods.map((period) => (
          <div key={period.id} className="bg-white rounded-xl shadow-sm border p-5">
            {editingId === period.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">교시 번호</label>
                    <input type="number" min={1} max={4}
                      value={editForm.period_number ?? period.period_number}
                      onChange={(e) => setEditForm(f => ({ ...f, period_number: +e.target.value }))}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">이름</label>
                    <input type="text"
                      value={editForm.name ?? period.name}
                      onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">시작 시간</label>
                    <input type="time"
                      value={editForm.start_time ?? period.start_time}
                      onChange={(e) => setEditForm(f => ({ ...f, start_time: e.target.value }))}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">종료 시간</label>
                    <input type="time"
                      value={editForm.end_time ?? period.end_time}
                      onChange={(e) => setEditForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-xs text-gray-500">지각 기준(분)</label>
                    <input type="number" min={0}
                      value={editForm.late_threshold_minutes ?? period.late_threshold_minutes}
                      onChange={(e) => setEditForm(f => ({ ...f, late_threshold_minutes: +e.target.value }))}
                      className="w-24 border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => saveEdit(period.id)} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm">저장</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm">취소</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="font-bold text-gray-800 mr-2">{period.period_number}교시</span>
                  <span className="text-gray-600 mr-3">{period.name}</span>
                  <span className="text-gray-500 text-sm">{period.start_time} ~ {period.end_time}</span>
                  <span className="ml-3 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">지각기준 {period.late_threshold_minutes}분</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(period)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${period.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${period.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-xs font-medium ${period.is_active ? 'text-blue-600' : 'text-gray-400'}`}>
                    {period.is_active ? 'ON' : 'OFF'}
                  </span>
                  <button onClick={() => { setEditingId(period.id); setEditForm({}) }} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">수정</button>
                  <button onClick={() => deletePeriod(period.id)} className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-lg text-red-600">삭제</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showAddForm ? (
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">교시 추가</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500">교시 번호</label>
                <input type="number" min={1} max={4}
                  value={newPeriod.period_number}
                  onChange={(e) => setNewPeriod(f => ({ ...f, period_number: +e.target.value }))}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">이름</label>
                <input type="text"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod(f => ({ ...f, name: e.target.value }))}
                  placeholder="예: 오전반"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">시작 시간</label>
                <input type="time"
                  value={newPeriod.start_time}
                  onChange={(e) => setNewPeriod(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">종료 시간</label>
                <input type="time"
                  value={newPeriod.end_time}
                  onChange={(e) => setNewPeriod(f => ({ ...f, end_time: e.target.value }))}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs text-gray-500">지각 기준(분)</label>
                <input type="number" min={0}
                  value={newPeriod.late_threshold_minutes}
                  onChange={(e) => setNewPeriod(f => ({ ...f, late_threshold_minutes: +e.target.value }))}
                  className="w-24 border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={addPeriod} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm">추가</button>
                <button onClick={() => setShowAddForm(false)} className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm">취소</button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + 교시 추가
          </button>
        )}
      </main>
    </div>
  )
}
