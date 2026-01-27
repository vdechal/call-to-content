-- =============================================
-- CATCHY MVP DATABASE SCHEMA
-- Phase 1: Core Foundations
-- =============================================

-- 1. PROFILES TABLE (extends auth.users)
-- =============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. RECORDINGS TABLE
-- =============================================
create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  file_path text not null,
  file_size bigint,
  duration_seconds integer,
  status text default 'uploading' check (status in ('uploading', 'transcribing', 'analyzing', 'ready', 'failed')),
  transcript_text text,
  speaker_segments jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on recordings
alter table public.recordings enable row level security;

-- Recordings RLS Policies
create policy "Users can view own recordings"
  on public.recordings for select
  using (auth.uid() = user_id);

create policy "Users can insert own recordings"
  on public.recordings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recordings"
  on public.recordings for update
  using (auth.uid() = user_id);

create policy "Users can delete own recordings"
  on public.recordings for delete
  using (auth.uid() = user_id);

-- Indexes for recordings
create index recordings_user_id_idx on public.recordings(user_id);
create index recordings_status_idx on public.recordings(status);

-- Enable realtime for recordings (for status updates)
alter publication supabase_realtime add table public.recordings;

-- 3. INSIGHTS TABLE
-- =============================================
create type public.insight_type as enum ('quote', 'pain_point', 'solution', 'proof');

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references public.recordings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type insight_type not null,
  text text not null,
  speaker text,
  start_time decimal,
  end_time decimal,
  confidence decimal,
  is_starred boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS on insights
alter table public.insights enable row level security;

-- Insights RLS Policies
create policy "Users can view own insights"
  on public.insights for select
  using (auth.uid() = user_id);

create policy "Users can insert own insights"
  on public.insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own insights"
  on public.insights for update
  using (auth.uid() = user_id);

create policy "Users can delete own insights"
  on public.insights for delete
  using (auth.uid() = user_id);

-- Indexes for insights
create index insights_recording_id_idx on public.insights(recording_id);
create index insights_type_idx on public.insights(type);

-- 4. POST DRAFTS TABLE
-- =============================================
create table public.post_drafts (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid references public.insights(id) on delete cascade not null,
  recording_id uuid references public.recordings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  tone text default 'original' check (tone in ('original', 'punchier', 'conversational', 'professional', 'storytelling')),
  version integer default 1,
  is_edited boolean default false,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on post_drafts
alter table public.post_drafts enable row level security;

-- Post Drafts RLS Policies
create policy "Users can view own drafts"
  on public.post_drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert own drafts"
  on public.post_drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own drafts"
  on public.post_drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete own drafts"
  on public.post_drafts for delete
  using (auth.uid() = user_id);

-- Indexes for post_drafts
create index post_drafts_insight_id_idx on public.post_drafts(insight_id);
create index post_drafts_recording_id_idx on public.post_drafts(recording_id);

-- 5. UPDATED_AT TRIGGER FUNCTION
-- =============================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_recordings_updated_at
  before update on public.recordings
  for each row execute function public.update_updated_at_column();

create trigger update_post_drafts_updated_at
  before update on public.post_drafts
  for each row execute function public.update_updated_at_column();