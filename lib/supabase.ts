import { createClient } from '@supabase/supabase-js'

export type Role = 'admin' | 'student'
export type AttendanceStatus = 'present' | 'late' | 'absent'

export interface Organization {
  id: string
  name: string
}

export interface Branch {
  id: string
  organization_id: string
  name: string
  organizations?: Organization
}

export interface Profile {
  id: string
  branch_id: string
  name: string
  role: Role
  cohort?: string
  created_at?: string
  branches?: Branch & { organizations?: Organization }
}

export interface ClassPeriod {
  id: string
  branch_id: string
  period_number: number
  name: string
  start_time: string
  end_time: string
  late_threshold_minutes: number
  is_active: boolean
  course_type?: string
}

export interface Dropout {
  id: string
  user_id: string
  branch_id: string
  cohort?: string
  period_id?: string
  course_type?: string
  dropout_date: string
  reason: string
  reason_detail?: string
  created_at: string
  profiles?: Profile
  class_periods?: ClassPeriod | null
}

export interface Attendance {
  id: string
  user_id: string
  period_id: string
  period_number: number
  checked_at: string
  checkout_at?: string | null
  date: string
  status: AttendanceStatus
  late_minutes: number
  profiles?: Profile
  class_periods?: ClassPeriod | null
}

export interface QrToken {
  id: string
  branch_id: string
  period_id: string
  period_number: number
  token: string
  expires_at: string
  created_by: string
  type?: 'checkin' | 'checkout'
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
