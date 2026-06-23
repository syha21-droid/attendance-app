export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused' | 'exited'
export type LateReasonStatus = 'pending' | 'reviewed' | 'converted_excused'
export type AbsenceRequestStatus = 'pending' | 'approved' | 'rejected'
export type FileType = 'pdf' | 'video' | 'ppt' | 'excel' | 'word' | 'image' | 'other'
export type LateCategory =
  | 'traffic'
  | 'health'
  | 'family'
  | 'work'
  | 'parking'
  | 'weather'
  | 'other'

export interface Course {
  id: string
  title: string
  description: string | null
  total_sessions: number
  created_at: string
}

export interface Session {
  id: string
  course_id: string
  session_number: number
  date: string
  title: string | null
}

export interface Period {
  id: string
  session_id: string
  period_number: 1 | 2 | 3
  title: string | null
  start_time: string
  end_time: string
}

export interface Student {
  id: string
  name: string
  email: string
  course_id: string
  enrolled_at: string
  is_active: boolean
}

export interface AttendanceSettings {
  course_id: string
  late_threshold_minutes: number
  absent_threshold_minutes: number
  late_to_absent_ratio: number
  min_attendance_rate: number
  exit_threshold_minutes: number
  notify_late: boolean
  notify_absent: boolean
  notify_low_rate: boolean
  notify_excuse_request: boolean
}

export interface Material {
  id: string
  period_id: string
  session_id: string
  course_id: string
  file_name: string
  file_url: string
  file_type: FileType
  title: string
  is_public: boolean
  uploaded_at: string
  uploaded_by: string | null
}

export interface Attendance {
  id: string
  student_id: string
  period_id: string
  session_id: string
  status: AttendanceStatus
  check_in_time: string | null
  late_minutes: number | null
  created_at: string
  updated_at: string
}

export interface LateReason {
  id: string
  attendance_id: string
  student_id: string
  categories: LateCategory[]
  detail_text: string | null
  agree_contact: boolean
  status: LateReasonStatus
  admin_memo: string | null
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface AbsenceRequest {
  id: string
  student_id: string
  session_id: string
  period_id: string
  reason: string
  status: AbsenceRequestStatus
  admin_memo: string | null
  requested_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface Dropout {
  id: string
  student_id: string
  period_id: string
  session_id: string
  exit_time: string
  return_time: string | null
  duration_minutes: number | null
  is_returned: boolean
}

// Join types for UI
export interface AttendanceWithDetails extends Attendance {
  period: Period
  session: Session
}

export interface LateReasonWithDetails extends LateReason {
  attendance: AttendanceWithDetails
  student: Student
}

export interface AbsenceRequestWithDetails extends AbsenceRequest {
  student: Student
  session: Session
  period: Period
}

export interface DropoutWithDetails extends Dropout {
  student: Student
  period: Period
  session: Session
}

export interface MaterialWithDetails extends Material {
  period: Period
  session: Session
}

// 출석률 계산 결과
export interface AttendanceStats {
  present: number
  late: number
  absent: number
  excused: number
  exited: number
  total: number
  effectiveAttendanceRate: number
}
