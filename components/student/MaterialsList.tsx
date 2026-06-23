'use client'

import { useState } from 'react'
import { Material, Session } from '@/types'
import { FILE_TYPE_ICONS } from '@/lib/utils/attendance'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface SessionMaterials {
  session: Session
  materials: Material[]
}

interface Props {
  currentMaterials: Material[]
  pastSessions: SessionMaterials[]
}

export function MaterialsList({ currentMaterials, pastSessions }: Props) {
  const [expanded, setExpanded] = useState<string[]>([])

  function toggle(id: string) {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <h2 className="font-semibold text-lg">학습 자료</h2>

      {/* 현재 회차 */}
      {currentMaterials.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">현재 회차</p>
          {currentMaterials.map((m) => (
            <MaterialRow key={m.id} material={m} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">현재 회차 자료가 없습니다</p>
      )}

      {/* 이전 회차 아코디언 */}
      {pastSessions.map(({ session, materials }) => (
        <div key={session.id} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => toggle(session.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            <span>{session.session_number}회차 — {session.title ?? format(new Date(session.date), 'M월 d일', { locale: ko })}</span>
            <span className="flex items-center gap-1 text-gray-400">
              <span className="text-xs">{materials.length}개</span>
              {expanded.includes(session.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          </button>
          {expanded.includes(session.id) && (
            <div className="divide-y">
              {materials.map((m) => (
                <MaterialRow key={m.id} material={m} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MaterialRow({ material }: { material: Material }) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">{FILE_TYPE_ICONS[material.file_type]}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{material.title}</p>
          <p className="text-xs text-gray-400">
            {format(new Date(material.uploaded_at), 'M/d HH:mm')}
          </p>
        </div>
      </div>
      <a
        href={material.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-3 shrink-0 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        열기
      </a>
    </div>
  )
}
