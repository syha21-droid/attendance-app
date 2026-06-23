-- ============================================================
-- 출석체크 & 학습 관리 시스템 — Supabase 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 기본 테이블
-- ============================================================

-- 강좌
create table courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  total_sessions int not null default 1,
  created_at timestamptz default now()
);

-- 회차
create table sessions (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade,
  session_number int not null,
  date date not null,
  title text,
  unique(course_id, session_number)
);

-- 교시
create table periods (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  period_number int not null check (period_number between 1 and 3),
  title text,
  start_time time not null,
  end_time time not null,
  unique(session_id, period_number)
);

-- 수강생 프로필 (auth.users와 연동)
create table students (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  course_id uuid references courses(id),
  enrolled_at timestamptz default now(),
  is_active boolean default true
);

-- 관리자 프로필
create table admins (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- 출결 설정 (강좌별)
create table attendance_settings (
  course_id uuid references courses(id) on delete cascade primary key,
  late_threshold_minutes int not null default 15,
  absent_threshold_minutes int not null default 30,
  late_to_absent_ratio int not null default 3,
  min_attendance_rate int not null default 80,
  exit_threshold_minutes int not null default 10,
  notify_late boolean default true,
  notify_absent boolean default true,
  notify_low_rate boolean default true,
  notify_excuse_request boolean default true
);

-- 학습 자료
create table materials (
  id uuid default gen_random_uuid() primary key,
  period_id uuid references periods(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text check (file_type in ('pdf', 'video', 'ppt', 'excel', 'word', 'image', 'other')) default 'other',
  title text not null,
  is_public boolean default true,
  uploaded_at timestamptz default now(),
  uploaded_by uuid references auth.users(id)
);

-- 출석 기록
create table attendance (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  period_id uuid references periods(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  status text check (status in ('present', 'late', 'absent', 'excused', 'exited')) not null default 'absent',
  check_in_time timestamptz,
  late_minutes int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, period_id)
);

-- 지각 사유
create table late_reasons (
  id uuid default gen_random_uuid() primary key,
  attendance_id uuid references attendance(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  categories text[] not null default '{}',
  detail_text text check (char_length(detail_text) <= 200),
  agree_contact boolean default false,
  status text check (status in ('pending', 'reviewed', 'converted_excused')) default 'pending',
  admin_memo text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

-- 공결 신청
create table absence_requests (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  period_id uuid references periods(id) on delete cascade,
  reason text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  admin_memo text,
  requested_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

-- 중간이탈 기록
create table dropouts (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  period_id uuid references periods(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  exit_time timestamptz not null default now(),
  return_time timestamptz,
  duration_minutes int,
  is_returned boolean default false
);

-- heartbeat 기록
create table heartbeats (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  period_id uuid references periods(id) on delete cascade,
  received_at timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table courses enable row level security;
alter table sessions enable row level security;
alter table periods enable row level security;
alter table students enable row level security;
alter table admins enable row level security;
alter table attendance_settings enable row level security;
alter table materials enable row level security;
alter table attendance enable row level security;
alter table late_reasons enable row level security;
alter table absence_requests enable row level security;
alter table dropouts enable row level security;
alter table heartbeats enable row level security;

-- helper: 현재 사용자가 admin인지 확인
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from admins where id = auth.uid())
$$;

-- helper: 현재 사용자의 course_id 반환
create or replace function my_course_id()
returns uuid language sql security definer as $$
  select course_id from students where id = auth.uid()
$$;

-- courses
create policy "누구나 조회" on courses for select using (true);
create policy "관리자만 변경" on courses for all using (is_admin());

-- sessions
create policy "누구나 조회" on sessions for select using (true);
create policy "관리자만 변경" on sessions for all using (is_admin());

-- periods
create policy "누구나 조회" on periods for select using (true);
create policy "관리자만 변경" on periods for all using (is_admin());

-- students
create policy "본인 조회" on students for select using (id = auth.uid());
create policy "관리자 전체 조회" on students for select using (is_admin());
create policy "관리자만 변경" on students for all using (is_admin());

-- admins
create policy "관리자 본인 조회" on admins for select using (id = auth.uid());
create policy "관리자 전체 조회" on admins for select using (is_admin());

-- attendance_settings
create policy "수강생 본인 강좌 설정 조회" on attendance_settings for select
  using (course_id = my_course_id());
create policy "관리자 전체 조회/변경" on attendance_settings for all using (is_admin());

-- materials: 본인 강좌만
create policy "수강생 본인 강좌 자료 조회" on materials for select
  using (is_public = true and course_id = my_course_id());
create policy "관리자 전체" on materials for all using (is_admin());

-- attendance
create policy "수강생 본인 출석 조회" on attendance for select
  using (student_id = auth.uid());
create policy "수강생 본인 출석 입력" on attendance for insert
  with check (student_id = auth.uid());
create policy "관리자 전체" on attendance for all using (is_admin());

-- late_reasons
create policy "수강생 본인 지각사유 조회" on late_reasons for select
  using (student_id = auth.uid());
create policy "수강생 본인 지각사유 입력" on late_reasons for insert
  with check (student_id = auth.uid());
create policy "관리자 전체" on late_reasons for all using (is_admin());

-- absence_requests
create policy "수강생 본인 공결신청 조회" on absence_requests for select
  using (student_id = auth.uid());
create policy "수강생 본인 공결신청 입력" on absence_requests for insert
  with check (student_id = auth.uid());
create policy "관리자 전체" on absence_requests for all using (is_admin());

-- dropouts
create policy "수강생 본인 이탈 조회" on dropouts for select
  using (student_id = auth.uid());
create policy "수강생 본인 이탈 입력" on dropouts for insert
  with check (student_id = auth.uid());
create policy "관리자 전체" on dropouts for all using (is_admin());

-- heartbeats
create policy "수강생 본인 heartbeat 입력" on heartbeats for insert
  with check (student_id = auth.uid());
create policy "관리자 전체" on heartbeats for all using (is_admin());

-- ============================================================
-- 샘플 데이터 (선택사항 — 필요시 주석 해제 후 실행)
-- ============================================================

-- insert into courses (title, description, total_sessions)
-- values ('웹 개발 과정', '프론트엔드 + 백엔드 풀스택 과정', 20);
