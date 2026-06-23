'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogOut, Clock, AlertCircle, Upload, FileText, Download, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

interface Attendance {
  date: string
  time: string
  status: 'attended' | 'late' | 'absent'
}

interface CourseFile {
  id: string
  name: string
  uploadTime: string
  size: string
}

export default function CoursePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseName = searchParams.get('name') || ''
  
  const [user, setUser] = useState<User | null>(null)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('attendance_current_user')
      if (!userData) {
        router.push('/login')
        return
      }

      try {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.isAdmin) {
          router.push('/admin')
          return
        }
        setUser(parsedUser)

        const key = ttendance_+parsedUser.id
        const attendance = localStorage.getItem(key)
        if (attendance) {
          setAttendances(JSON.parse(attendance))
        }

        const fileKey = course_files_+courseName
        const files = localStorage.getItem(fileKey)
        if (files) {
          setCourseFiles(JSON.parse(files))
        }
      } catch (e) {
        router.push('/login')
      }
    }
  }, [router, courseName])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const newFile: CourseFile = {
          id: Date.now().toString(),
          name: file.name,
          uploadTime: new Date().toLocaleString('ko-KR'),
          size: (file.size / 1024).toFixed(2)+' KB'
        }

        const newFiles = [...courseFiles, newFile]
        setCourseFiles(newFiles)

        const fileKey = course_files_+courseName
        localStorage.setItem(fileKey, JSON.stringify(newFiles))
        
        const contentKey = course_file_content_+newFile.id
        localStorage.setItem(contentKey, reader.result as string)

        toast.success('✅ 강의안이 업로드되었습니다!')
        setIsUploading(false)
        e.target.value = ''
      } catch (error) {
        toast.error('파일 업로드 실패')
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = (fileId: string, fileName: string) => {
    const contentKey = course_file_content_+fileId
    const fileContent = localStorage.getItem(contentKey)
    
    if (!fileContent) {
      toast.error('파일을 찾을 수 없습니다')
      return
    }

    const link = document.createElement('a')
    link.href = fileContent
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('✅ 파일 다운로드가 시작되었습니다')
  }

  const handleDeleteFile = (fileId: string) => {
    if (!window.confirm('파일을 삭제하시겠습니까?')) return

    const newFiles = courseFiles.filter((f) => f.id !== fileId)
    setCourseFiles(newFiles)

    const fileKey = course_files_+courseName
    localStorage.setItem(fileKey, JSON.stringify(newFiles))

    const contentKey = course_file_content_+fileId
    localStorage.removeItem(contentKey)

    toast.success('✅ 파일이 삭제되었습니다')
  }

  const handleAttendance = () => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('ko-KR')
    const dateStr = now.toLocaleDateString('ko-KR')

    const newAttendance: Attendance = {
      date: dateStr,
      time: timeStr,
      status: 'attended',
    }

    const newAttendances = [...attendances, newAttendance]
    setAttendances(newAttendances)
    const key = ttendance_+user?.id
    localStorage.setItem(key, JSON.stringify(newAttendances))

    toast.success('✅ '+courseName+' 출석 확인: '+timeStr)
  }

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    router.push('/login')
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/student')} className="text-indigo-600 font-medium hover:underline">
            ← 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{courseName}</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{courseName}</h2>
          <p className="text-gray-600">📚 수강 중인 강의</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-gray-900">출석 등록</h3>
            </div>
            <p className="text-gray-600 mb-4">현재 시간에 출석을 확인합니다</p>
            <button onClick={handleAttendance} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700">
              ✅ 출석 확인하기
            </button>
          </div>

          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">중간이탈</h3>
            </div>
            <p className="text-gray-600 mb-4">강의를 더 이상 계속할 수 없습니다</p>
            <button
              onClick={() => {
                if (window.confirm(courseName+' 강의를 중간이탈하시겠습니까?')) {
                  toast.success('✅ 중간이탈이 접수되었습니다!')
                  setTimeout(() => router.push('/student'), 1500)
                }
              }}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
            >
              🚫 중간이탈 신청
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            강의안 업로드
          </h3>
          
          <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center mb-6">
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png"
              />
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-indigo-600" />
                <p className="text-gray-900 font-medium">클릭해서 파일을 선택하세요</p>
                <p className="text-sm text-gray-500">또는 드래그해서 올리세요</p>
                <p className="text-xs text-gray-400">PDF, Word, Excel, PPT, 이미지 등</p>
              </div>
            </label>
          </div>

          {courseFiles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">업로드된 강의안이 없습니다</p>
          ) : (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">📄 업로드된 파일 ({courseFiles.length})</h4>
              {courseFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.uploadTime} · {file.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(file.id, file.name)}
                      className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      title="다운로드"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">강의 정보</h3>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <p className="text-sm text-gray-600">강의명</p>
              <p className="text-lg font-semibold text-gray-900">{courseName}</p>
            </div>
            <div className="border-b pb-4">
              <p className="text-sm text-gray-600">상태</p>
              <p className="text-lg font-semibold text-green-600">✅ 수강 중</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">수강생</p>
              <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
