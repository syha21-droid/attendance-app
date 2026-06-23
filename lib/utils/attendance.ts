import { AttendanceStats, AttendanceSettings } from '@/types'

export function calcAttendanceStats(
  present: number,
  late: number,
  absent: number,
  excused: number,
  exited: number,
  total: number,
  settings: AttendanceSettings
): AttendanceStats {
  const ratio = settings.late_to_absent_ratio
  const effectivePresent =
    present + excused + Math.floor(late * (1 - 1 / ratio))
  const effectiveAttendanceRate =
    total > 0 ? Math.round((effectivePresent / total) * 100) : 0

  return {
    present,
    late,
    absent,
    excused,
    exited,
    total,
    effectiveAttendanceRate,
  }
}

export function determineStatus(
  checkInTime: Date,
  startTime: Date,
  settings: AttendanceSettings
): 'present' | 'late' | 'absent' {
  const diffMinutes = Math.floor(
    (checkInTime.getTime() - startTime.getTime()) / 60000
  )
  if (diffMinutes <= 0) return 'present'
  if (diffMinutes <= settings.late_threshold_minutes) return 'present'
  if (diffMinutes <= settings.absent_threshold_minutes) return 'late'
  return 'absent'
}

export const STATUS_LABELS: Record<string, string> = {
  present: '출석',
  late: '지각',
  absent: '결석',
  excused: '공결',
  exited: '이탈',
}

export const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-800',
  late: 'bg-amber-100 text-amber-800',
  absent: 'bg-red-100 text-red-800',
  excused: 'bg-blue-100 text-blue-800',
  exited: 'bg-pink-100 text-pink-800',
  pending: 'bg-gray-100 text-gray-700',
}

export const LATE_CATEGORY_LABELS: Record<string, string> = {
  traffic: '교통 지연',
  health: '건강 문제',
  family: '가정 사정',
  work: '직장 사정',
  parking: '주차 문제',
  weather: '날씨',
  other: '기타',
}

export const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  video: '🎥',
  ppt: '📊',
  excel: '📗',
  word: '📝',
  image: '🖼️',
  other: '📎',
}
