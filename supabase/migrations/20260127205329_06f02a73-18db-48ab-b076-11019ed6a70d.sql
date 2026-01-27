-- Fix function search path security warnings
-- Update handle_new_user function with explicit search_path
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Update update_updated_at_column function with explicit search_path
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Create storage bucket for audio recordings
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recordings',
  'recordings',
  false,
  104857600,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/webm', 'audio/ogg']
);

-- Storage RLS: Users can upload to their own folder
create policy "Users can upload own recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'recordings' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: Users can view own recordings
create policy "Users can view own recordings"
  on storage.objects for select
  using (
    bucket_id = 'recordings' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: Users can delete own recordings
create policy "Users can delete own recordings"
  on storage.objects for delete
  using (
    bucket_id = 'recordings' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );