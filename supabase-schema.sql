-- ============================================================
-- 출석체크 앱 Supabase 스키마 (Supabase SQL Editor에서 실행)
-- ============================================================

-- 사업단 테이블
create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- 지점 테이블
create table branches (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id),
  name text not null,
  created_at timestamptz default now()
);

-- 사용자 테이블
create table profiles (
  id uuid references auth.users(id) primary key,
  branch_id uuid references branches(id),
  name text not null,
  role text check (role in ('admin', 'student')) not null,
  created_at timestamptz default now()
);

-- 교시 설정 테이블
create table class_periods (
  id uuid default gen_random_uuid() primary key,
  branch_id uuid references branches(id),
  period_number int not null check (period_number between 1 and 4),
  name text not null,
  start_time time not null,
  end_time time not null,
  late_threshold_minutes int not null default 5,
  is_active boolean default false,
  created_at timestamptz default now(),
  unique(branch_id, period_number)
);

-- 출석 기록 테이블
create table attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  period_id uuid references class_periods(id),
  period_number int,
  checked_at timestamptz default now(),
  date date default current_date,
  status text check (status in ('present', 'late', 'absent')) not null default 'present',
  late_minutes int default 0,
  unique(user_id, period_id, date)
);

-- QR 토큰 테이블
create table qr_tokens (
  id uuid default gen_random_uuid() primary key,
  branch_id uuid references branches(id),
  period_id uuid references class_periods(id),
  period_number int,
  token text unique not null,
  expires_at timestamptz not null,
  created_by uuid references profiles(id)
);

-- ============================================================
-- RLS 정책
-- ============================================================

alter table attendance enable row level security;
alter table profiles enable row level security;
alter table class_periods enable row level security;
alter table qr_tokens enable row level security;

-- profiles 정책
create policy "본인 프로필 조회"
on profiles for select
using (id = auth.uid());

create policy "관리자는 같은 지점 프로필 조회"
on profiles for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
    and p.branch_id = profiles.branch_id
  )
);

-- attendance 정책
create policy "관리자는 같은 지점 출석 전체 조회"
on attendance for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
    and profiles.branch_id = (
      select branch_id from profiles where id = attendance.user_id
    )
  )
);

create policy "수강생은 본인 출석만 조회"
on attendance for select
using (user_id = auth.uid());

create policy "출석 체크는 본인만"
on attendance for insert
with check (user_id = auth.uid());

create policy "관리자는 출석 상태 변경 가능"
on attendance for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- class_periods 정책
create policy "교시는 같은 지점 전체 조회 가능"
on class_periods for select
using (
  branch_id = (select branch_id from profiles where id = auth.uid())
);

create policy "교시 수정은 관리자만"
on class_periods for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- qr_tokens 정책
create policy "같은 지점 QR 토큰 조회"
on qr_tokens for select
using (
  branch_id = (select branch_id from profiles where id = auth.uid())
);

create policy "관리자만 QR 생성"
on qr_tokens for insert
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "관리자만 QR 삭제"
on qr_tokens for delete
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- ============================================================
-- Realtime 활성화 (Supabase Dashboard > Database > Replication)
-- 아래 테이블들의 Realtime을 활성화해주세요:
-- - attendance
-- - class_periods
-- ============================================================

-- ============================================================
-- 샘플 데이터 (선택사항)
-- ============================================================
-- insert into organizations (name) values ('제1사업단');
-- insert into branches (organization_id, name) values ('[위의 org id]', '강남지점');
