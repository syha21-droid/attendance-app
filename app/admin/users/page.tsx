'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Profile } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function UsersPage() {
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student' as 'admin' | 'student',
  })

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*, branches(*, organizations(*))')
      .eq('id', user.id)
      .single()

    if (!prof || prof.role !== 'admin') { router.push('/'); return }
    setMyProfile(prof)
    await loadUsers(prof.branch_id)
    setLoading(false)
  }

  async function loadUsers(branchId: string) {
    const res = await fetch(`/api/users?branchId=${branchId}`)
    const data = await res.json()
    setUsers(data || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!myProfile) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branchId: myProfile.branch_id }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '생성 실패')
        return
      }

      toast.success(`${form.name}님 계정이 생성되었습니다`)
      setForm({ email: '', password: '', name: '', role: 'student' })
      setShowForm(false)
      await loadUsers(myProfile.branch_id)
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`${name}님 계정을 삭제하시겠습니까?`)) return

    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    if (!res.ok) {
      toast.error('삭제 실패')
      return
    }

    toast.success('삭제되었습니다')
    if (myProfile) await loadUsers(myProfile.branch_id)
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

  const orgName = (myProfile as any)?.branches?.organizations?.name || ''
  const branchName = (myProfile as any)?.branches?.name || ''
  const admins = users.filter(u => u.role === 'admin')
  const students = users.filter(u => u.role === 'student')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400">{orgName} &gt; {branchName}</p>
            <h1 className="text-xl font-bold text-gray-800">회원 관리</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin" className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">대시보드</Link>
            <Link href="/admin/periods" className="px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-700">교시 설정</Link>
            <Link href="/admin/qr" className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700">QR 생성</Link>
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 rounded-lg text-red-700">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 계정 추가 버튼 */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            + 새 계정 추가
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">새 계정 추가</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'student' }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">수강생</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6자 이상"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors"
                >
                  {submitting ? '생성 중...' : '계정 생성'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 관리자 목록 */}
        <div>
          <h2 className="text-base font-bold text-gray-700 mb-3">관리자 ({admins.length}명)</h2>
          <div className="bg-white rounded-xl shadow border overflow-hidden">
            {admins.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">관리자가 없습니다</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">이름</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">역할</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">등록일</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {admins.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">관리자</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.created_at?.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        {u.id !== myProfile?.id && (
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 수강생 목록 */}
        <div>
          <h2 className="text-base font-bold text-gray-700 mb-3">수강생 ({students.length}명)</h2>
          <div className="bg-white rounded-xl shadow border overflow-hidden">
            {students.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">등록된 수강생이 없습니다</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">이름</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">역할</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">등록일</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">수강생</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.created_at?.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
