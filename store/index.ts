import { create } from 'zustand'
import { Student, Course, Session, Period, AttendanceSettings } from '@/types'

interface AppState {
  student: Student | null
  course: Course | null
  currentSession: Session | null
  currentPeriod: Period | null
  settings: AttendanceSettings | null
  isAdmin: boolean
  setStudent: (s: Student | null) => void
  setCourse: (c: Course | null) => void
  setCurrentSession: (s: Session | null) => void
  setCurrentPeriod: (p: Period | null) => void
  setSettings: (s: AttendanceSettings | null) => void
  setIsAdmin: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  student: null,
  course: null,
  currentSession: null,
  currentPeriod: null,
  settings: null,
  isAdmin: false,
  setStudent: (student) => set({ student }),
  setCourse: (course) => set({ course }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setCurrentPeriod: (currentPeriod) => set({ currentPeriod }),
  setSettings: (settings) => set({ settings }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}))
