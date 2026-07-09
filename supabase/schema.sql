-- StudyVerse — Supabase schema for private Study Rooms + user progress sync.
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- The app has NO authentication, so it uses the anon role directly. The RLS
-- policies below are intentionally permissive (anon can read/write rooms it
-- knows the code for). Tighten these if you later add Supabase Auth.

-- ---------------------------------------------------------------------------
-- User progress (per local profile — the app has no auth, so the local
-- profile id is the key). Used to persist the editable Daily Goal + progress.
-- ---------------------------------------------------------------------------
create table if not exists public.study_profiles (
  id                   text primary key,        -- local profile id
  username             text not null default 'Explorer',
  avatar_id            integer not null default 0,
  level                integer not null default 1,
  xp                   integer not null default 0,
  coins                integer not null default 0,
  gems                 integer not null default 0,
  streak_days          integer not null default 0,
  study_minutes_today  integer not null default 0,
  daily_goal_minutes   integer not null default 180,
  last_study_date      date,
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Rooms
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,           -- 6-char human-shareable invite code
  name         text not null,
  host_name    text not null,
  -- Shared Pomodoro timer state (broadcast to every participant):
  timer_state  text not null default 'idle',   -- 'idle' | 'running' | 'paused'
  timer_ends_at    timestamptz,                 -- when the current run completes
  timer_remaining  integer not null default 1500, -- seconds left when paused/idle
  timer_duration   integer not null default 1500, -- selected session length (s)
  created_at   timestamptz not null default now()
);

create index if not exists rooms_code_idx on public.rooms (code);

-- ---------------------------------------------------------------------------
-- Participants (live membership; presence is layered on top via Realtime)
-- ---------------------------------------------------------------------------
create table if not exists public.room_participants (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms (id) on delete cascade,
  client_id   text not null,                    -- stable per-browser id
  name        text not null,
  avatar_id   integer not null default 0,
  joined_at   timestamptz not null default now(),
  unique (room_id, client_id)
);

create index if not exists room_participants_room_idx on public.room_participants (room_id);

-- ---------------------------------------------------------------------------
-- Chat messages
-- ---------------------------------------------------------------------------
create table if not exists public.room_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms (id) on delete cascade,
  client_id   text not null,
  name        text not null,
  avatar_id   integer not null default 0,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists room_messages_room_idx on public.room_messages (room_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security — permissive (no auth in this app)
-- ---------------------------------------------------------------------------
alter table public.study_profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.room_messages enable row level security;

do $$
begin
  -- study_profiles
  if not exists (select 1 from pg_policies where tablename = 'study_profiles' and policyname = 'study_profiles_all') then
    create policy study_profiles_all on public.study_profiles for all using (true) with check (true);
  end if;
  -- rooms
  if not exists (select 1 from pg_policies where tablename = 'rooms' and policyname = 'rooms_all') then
    create policy rooms_all on public.rooms for all using (true) with check (true);
  end if;
  -- participants
  if not exists (select 1 from pg_policies where tablename = 'room_participants' and policyname = 'participants_all') then
    create policy participants_all on public.room_participants for all using (true) with check (true);
  end if;
  -- messages
  if not exists (select 1 from pg_policies where tablename = 'room_messages' and policyname = 'messages_all') then
    create policy messages_all on public.room_messages for all using (true) with check (true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime — broadcast table changes to subscribed clients
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_participants;
alter publication supabase_realtime add table public.room_messages;
