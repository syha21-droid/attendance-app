'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Course, Session, Period, Student, AttendanceSettings,
  Material, LateReason, AbsenceRequest, Dropout, Attendance
} from '@/types'
import { AdminSummaryCards } from '@/components/admin/AdminSummaryCards'
import { AttendanceTable } from '@/components/admin/AttendanceTable'
import { LateReasonReview } from '@/components/admin/LateReasonReview'
import { AbsenceRequestReview } from '@/components/admin/AbsenceRequestReview'
import { DropoutManager } from '@/components/admin/DropoutManager'
import { Statistics } from '@/components/admin/Statistics'
import { StudentManager } from '@/components/admin/StudentManager'
import { AttendanceSettingsPanel } from '@/components/admin/AttendanceSettings'
import { MaterialUpload } from '@/components/admin/MaterialUpload'
import { CourseManager } from '@/components/admin/CourseManager'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, ClipboardList, MessageSquare,
  ShieldCheck, LogOut, BarChart3, Users, Settings2, Upload,
  LogOut as LogOutIcon, BookOpen
} from 'lucide-react'

interface SessionWithPeriods extends Session {
  periods: Period[]
}

interface Props {
  admin: { id: string; name: string }
  courses: Course[]
  sessions: SessionWithPeriods[]
  students: Student[]
  lateReasons: (LateReason & { student: Student; attendance: unknown })[]
  absenceRequests: (AbsenceRequest & { student: Student; session: Session; period: Period })[]
  dropouts: (Dropout & { student: Student; period: Period; session: Session })[]
  settings: AttendanceSettings
  materials: Material[]
  periodsMap: Record<string, Period[]>
  todayCounts: Record<string, number>
  todaySession: SessionWithPeriods | null
}

type Tab = 'dashboard' | 'attendance' | 'late' | 'absence' | 'dropout' | 'stats' | 'students' | 'settings' | 'upload' | 'courses'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'attendance', label: '출결 현황', icon: ClipboardList },
  { id: 'late', label: '지각 사유', icon: MessageSquare },
  { id: 'absence', label: '공결 신청', icon: ShieldCheck },
  { id: 'dropout', label: '이탈 관리', icon: LogOut },
  { id: 'stats', label: '통계', icon: BarChart3 },
  { id: 'upload', label: '자료 업로드', icon: Upload },
  { id: 'students', label: '수강생 관리', icon: Users },
  { id: 'courses', label: '강의 관리', icon: BookOpen },
  { id: 'settings', label: '출결 설정', icon: Settings2 },
]

export function AdminClient({
  admin,
  courses,
  sessions,
  students,
  lateReasons,
  absenceRequests,
  dropouts,
  settings,
  materials: _materials,
  periodsMap,
  todayCounts,
  todaySession,
}: Props) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('로그아웃 되었습니다')
    router.push('/login')
  }

  // 오늘 출결 테이블용
  const todayRows = students.map((s) => {
    const periods = todaySession?.periods ?? []
    const attMap: Record<string, Attendance> = {}
    // 실제로는 server에서 join된 데이터를 받아야 하나, 여기서는 구조 시연
    return { student: s, periods, attendanceMap: attMap }
  })

  const pendingLateCount = lateReasons.filter((r) => r.status === 'pending').length
  const pendingAbsenceCount = absenceRequests.filter((r) => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <aside className="w-56 bg-white border-r fixed top-0 left-0 h-full z-20 flex flex-col">
        <div className="px-5 py-4 border-b">
          <p className="font-bold text-indigo-700 text-sm">출석 관리 시스템</p>
          <p className="text-xs text-gray-400 mt-0.5">관리자: {admin.name}</p>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const badge =
              id === 'late' ? pendingLateCount :
              id === 'absence' ? pendingAbsenceCount : 0
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  tab === id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 border-t"
        >
          <LogOutIcon className="w-4 h-4" />
          로그아웃
        </button>
      </aside>

      {/* 메인 */}
      <main className="ml-56 flex-1 p-6 space-y-5 max-w-5xl">
        {tab === 'dashboard' && (
          <>
            <h1 className="font-bold text-xl">오늘 현황 대시보드</h1>
            <AdminSummaryCards
              present={todayCounts.present ?? 0}
              late={todayCounts.late ?? 0}
              absent={todayCounts.absent ?? 0}
              excused={todayCounts.excused ?? 0}
              exited={todayCounts.exited ?? 0}
            />
            <div className="grid grid-cols-3 gap-4">
              {courses.map((c) => {
                const cs = sessions.filter((s) => s.course_id === c.id)
                const today = new Date().toISOString().split('T')[0]
                const done = cs.filter((s) => s.date < today).length
                const pct = c.total_sessions > 0 ? Math.round((done / c.total_sessions) * 100) : 0
                return (
                  <div key={c.id} className="bg-white rounded-xl border p-4">
                    <p className="font-medium text-sm truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{done}/{c.total_sessions}회차</p>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-indigo-600 font-medium mt-1 text-right">{pct}%</p>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'attendance' && (
          <>
            <h1 className="font-bold text-xl">출결 현황</h1>
            <AttendanceTable rows={todayRows} session={todaySession} />
          </>
        )}

        {tab === 'late' && (
          <>
            <h1 className="font-bold text-xl">지각 사유 검토</h1>
            <LateReasonReview reasons={lateReasons as Parameters<typeof LateReasonReview>[0]['reasons']} />
          </>
        )}

        {tab === 'absence' && (
          <>
            <h1 className="font-bold text-xl">공결 신청 대기</h1>
            <AbsenceRequestReview requests={absenceRequests as Parameters<typeof AbsenceRequestReview>[0]['requests']} />
          </>
        )}

        {tab === 'dropout' && (
          <>
            <h1 className="font-bold text-xl">중간 이탈 관리</h1>
            <DropoutManager dropouts={dropouts as Parameters<typeof DropoutManager>[0]['dropouts']} />
          </>
        )}

        {tab === 'stats' && (
          <>
            <h1 className="font-bold text-xl">통계 & 분석</h1>
            <Statistics lateReasons={lateReasons as Parameters<typeof Statistics>[0]['lateReasons']} />
          </>
        )}

        {tab === 'upload' && (
          <>
            <h1 className="font-bold text-xl">학습 자료 업로드</h1>
            <MaterialUpload
              courses={courses}
              sessions={sessions}
              periodsMap={periodsMap}
            />
          </>
        )}

        {tab === 'students' && (
          <>
            <h1 className="font-bold text-xl">수강생 관리</h1>
            <StudentManager students={students} courses={courses} />
          </>
        )}

        {tab === 'courses' && (
          <>
            <h1 className="font-bold text-xl">강의 관리</h1>
            <CourseManager courses={courses} onRefresh={() => router.refresh()} />
          </>
        )}

        {tab === 'settings' && (
          <>
            <h1 className="font-bold text-xl">출결 설정</h1>
            <AttendanceSettingsPanel settings={settings} courses={courses} />
          </>
        )}
      </main>
    </div>
  )
}
