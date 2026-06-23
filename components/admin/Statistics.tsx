'use client'

import { LateReason, Student } from '@/types'
import { LATE_CATEGORY_LABELS } from '@/lib/utils/attendance'
import { BarChart3 } from 'lucide-react'

interface Props {
  lateReasons: (LateReason & { student: Student })[]
}

export function Statistics({ lateReasons }: Props) {
  // 카테고리별 집계
  const catCount: Record<string, number> = {}
  lateReasons.forEach((r) => {
    r.categories.forEach((cat) => {
      catCount[cat] = (catCount[cat] ?? 0) + 1
    })
  })
  const maxCount = Math.max(1, ...Object.values(catCount))
  const sortedCats = Object.entries(catCount).sort(([, a], [, b]) => b - a)

  // 수강생별 지각 횟수 TOP 5
  const studentCount: Record<string, { name: string; count: number; cats: Record<string, number> }> = {}
  lateReasons.forEach((r) => {
    if (!studentCount[r.student_id]) {
      studentCount[r.student_id] = { name: r.student.name, count: 0, cats: {} }
    }
    studentCount[r.student_id].count++
    r.categories.forEach((cat) => {
      studentCount[r.student_id].cats[cat] = (studentCount[r.student_id].cats[cat] ?? 0) + 1
    })
  })
  const topStudents = Object.values(studentCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <h2 className="font-semibold text-lg flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-indigo-500" />
        통계 & 분석
      </h2>

      {/* 카테고리별 분포 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">지각 사유 카테고리 분포</p>
        {sortedCats.length === 0 ? (
          <p className="text-sm text-gray-400">데이터가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {sortedCats.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-20 shrink-0">
                  {LATE_CATEGORY_LABELS[cat] ?? cat}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 자주 지각하는 수강생 TOP 5 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">자주 지각하는 수강생 TOP 5</p>
        {topStudents.length === 0 ? (
          <p className="text-sm text-gray-400">데이터가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {topStudents.map((s, i) => {
              const mainCat = Object.entries(s.cats).sort(([, a], [, b]) => b - a)[0]
              return (
                <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      {mainCat && (
                        <p className="text-xs text-gray-400">
                          주요 사유: {LATE_CATEGORY_LABELS[mainCat[0]]}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{s.count}회</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
