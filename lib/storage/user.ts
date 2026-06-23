// localStorage를 사용한 사용자 저장소

export interface StoredUser {
  id: string
  email: string
  password: string
  name: string
  isAdmin: boolean
  courseId?: string
}

const USERS_KEY = 'attendance_users'
const CURRENT_USER_KEY = 'attendance_current_user'

// 초기 관리자 설정
const ADMIN_USER: StoredUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  password: 'test1234',
  name: '관리자',
  isAdmin: true,
}

export function initializeUsers() {
  const users = getUsers()
  if (users.length === 0) {
    users.push(ADMIN_USER)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }
}

export function getUsers(): StoredUser[] {
  const users = localStorage.getItem(USERS_KEY)
  return users ? JSON.parse(users) : []
}

export function registerUser(user: Omit<StoredUser, 'id'>): StoredUser {
  const users = getUsers()
  const newUser: StoredUser = {
    ...user,
    id: `user-${Date.now()}`,
  }
  users.push(newUser)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return newUser
}

export function loginUser(email: string, password: string): StoredUser | null {
  const users = getUsers()
  const user = users.find(u => u.email === email && u.password === password)
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    return user
  }
  return null
}

export function getCurrentUser(): StoredUser | null {
  const user = localStorage.getItem(CURRENT_USER_KEY)
  return user ? JSON.parse(user) : null
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function userExists(email: string): boolean {
  const users = getUsers()
  return users.some(u => u.email === email)
}
