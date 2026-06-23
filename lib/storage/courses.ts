// localStorage를 사용한 사업단 저장소

export interface StoredCourse {
  id: string
  title: string
  description?: string
  total_sessions: number
  created_at: string
}

const COURSES_KEY = 'attendance_courses'

// 초기 사업단 설정
const INITIAL_COURSES: StoredCourse[] = [
  { id: '1', title: '1번 사업단', description: '1번 사업단', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '2', title: '2번 사업단', description: '2번 사업단', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '3', title: '3번 하이라이트 사업단', description: '3번 하이라이트 사업단', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '4', title: '4번 레거시 사업단', description: '4번 레거시 사업단', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '5', title: '5번 인터넷 사업단', description: '5번 인터넷 사업단', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '6', title: '6번 웹텐 사업단', description: '6번 웹텐 사업단', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '7', title: '7번 마케스토을 사업단', description: '7번 마케스토을 사업단', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '8', title: '8번 헬드메스 사업단', description: '8번 헬드메스 사업단', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '9', title: '외부', description: '외부', total_sessions: 20, created_at: new Date().toISOString() },
  { id: '10', title: '지인 소개', description: '지인 소개', total_sessions: 20, created_at: new Date().toISOString() },
]

export function initializeCourses() {
  const courses = getCourses()
  if (courses.length === 0) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(INITIAL_COURSES))
  }
}

export function getCourses(): StoredCourse[] {
  const courses = localStorage.getItem(COURSES_KEY)
  return courses ? JSON.parse(courses) : []
}

export function addCourse(title: string, description?: string, totalSessions: number = 20): StoredCourse {
  const courses = getCourses()
  const newCourse: StoredCourse = {
    id: `course-${Date.now()}`,
    title,
    description,
    total_sessions: totalSessions,
    created_at: new Date().toISOString(),
  }
  courses.push(newCourse)
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses))
  return newCourse
}

export function updateCourse(id: string, title: string, description?: string, totalSessions: number = 20): StoredCourse | null {
  const courses = getCourses()
  const course = courses.find(c => c.id === id)
  if (course) {
    course.title = title
    course.description = description
    course.total_sessions = totalSessions
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses))
    return course
  }
  return null
}

export function deleteCourse(id: string): boolean {
  const courses = getCourses()
  const index = courses.findIndex(c => c.id === id)
  if (index > -1) {
    courses.splice(index, 1)
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses))
    return true
  }
  return false
}
