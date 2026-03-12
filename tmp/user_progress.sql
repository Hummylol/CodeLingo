-- Run this in your Supabase SQL Editor

-- Create the user_progress table
create table public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  language text not null, -- e.g., 'cpp', 'python', 'java', 'dsa'
  unlocked_level integer not null default 1,
  unlocked_difficulty text not null default 'beginner', -- 'beginner', 'intermediate', 'expert', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, language) -- A user can only have one progress record per language
);

-- Turn on Row Level Security
alter table public.user_progress enable row level security;

-- Create policies so users can only view and update their own progress
create policy "Users can view their own progress" 
  on public.user_progress for select 
  using ( auth.uid() = user_id );

create policy "Users can insert their own progress" 
  on public.user_progress for insert 
  with check ( auth.uid() = user_id );

create policy "Users can update their own progress" 
  on public.user_progress for update 
  using ( auth.uid() = user_id );
