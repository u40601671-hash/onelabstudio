-- ====================================================================
-- One Lab Studio: Open Community Q&A Database Schema
-- Run this ONCE in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- ====================================================================

-- 1) Allow public profile lookup for display name and avatar in community
drop policy if exists "profiles: public display info" on public.profiles;
create policy "profiles: public display info" on public.profiles
  for select using (true);

-- 2) Community Questions / Posts Table (Open for any type of question)
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Creator',
  author_role text not null default 'member' check (author_role in ('member', 'pro', 'admin')),
  author_avatar text,
  title text not null,
  content text not null,
  category text default 'General',
  tags text[] default '{}',
  likes_count int not null default 0,
  comments_count int not null default 0,
  views_count int not null default 0,
  is_pinned boolean not null default false,
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;

-- Policies for community_posts
drop policy if exists "community_posts: read published" on public.community_posts;
create policy "community_posts: read published" on public.community_posts
  for select using (status = 'published' or public.is_admin());

drop policy if exists "community_posts: insert authenticated" on public.community_posts;
create policy "community_posts: insert authenticated" on public.community_posts
  for insert with check (auth.uid() is not null);

drop policy if exists "community_posts: update own or admin" on public.community_posts;
create policy "community_posts: update own or admin" on public.community_posts
  for update using (auth.uid() = user_id or public.is_admin());

drop policy if exists "community_posts: delete own or admin" on public.community_posts;
create policy "community_posts: delete own or admin" on public.community_posts
  for delete using (auth.uid() = user_id or public.is_admin());

-- 3) Community Answers / Comments Table
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Creator',
  author_role text not null default 'member' check (author_role in ('member', 'pro', 'admin')),
  author_avatar text,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.community_comments enable row level security;

drop policy if exists "community_comments: read all" on public.community_comments;
create policy "community_comments: read all" on public.community_comments
  for select using (true);

drop policy if exists "community_comments: insert authenticated" on public.community_comments;
create policy "community_comments: insert authenticated" on public.community_comments
  for insert with check (auth.uid() is not null);

drop policy if exists "community_comments: delete own or admin" on public.community_comments;
create policy "community_comments: delete own or admin" on public.community_comments
  for delete using (auth.uid() = user_id or public.is_admin());

-- 4) Community Likes (Upvotes) Table
create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.community_likes enable row level security;

drop policy if exists "community_likes: read all" on public.community_likes;
create policy "community_likes: read all" on public.community_likes
  for select using (true);

drop policy if exists "community_likes: insert authenticated" on public.community_likes;
create policy "community_likes: insert authenticated" on public.community_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "community_likes: delete own" on public.community_likes;
create policy "community_likes: delete own" on public.community_likes
  for delete using (auth.uid() = user_id);

-- 5) Counter Triggers
create or replace function public.update_post_comments_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update public.community_posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.community_posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_community_comment_change on public.community_comments;
create trigger on_community_comment_change
  after insert or delete on public.community_comments
  for each row execute procedure public.update_post_comments_count();

create or replace function public.update_post_likes_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.community_posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_community_like_change on public.community_likes;
create trigger on_community_like_change
  after insert or delete on public.community_likes
  for each row execute procedure public.update_post_likes_count();

-- 6) Initial Starter Questions
insert into public.community_posts (title, content, author_name, author_role, is_pinned, likes_count, comments_count, tags)
values
(
  'How do I grow from 0 to 1,000 subscribers without running paid ads?',
  'I started a new channel 3 weeks ago and posted 8 videos. Getting around 20-50 views per video from search. For creators who hit 1k subs recently, what strategy moved the needle fastest? Focusing entirely on Shorts, or making high-search long-form videos?',
  'Hamza Tariq',
  'pro',
  true,
  38,
  7,
  array['growth', 'subscribers', 'youtube']
),
(
  'What is your target Click-Through Rate (CTR) for YouTube thumbnails?',
  'I have been testing different styles using the One Lab Thumbnail Maker. My impressions went up, but my CTR on browse features is hovering around 5.4%. What CTR do you consider a green flag in the first 24 hours of publishing? What tweaks make the biggest difference for you?',
  'Farhan Ali',
  'member',
  false,
  26,
  6,
  array['thumbnails', 'ctr', 'analytics']
),
(
  'How to keep Short-form retention above 80%? Where are people dropping off?',
  'When looking at YouTube Studio audience retention curves on my Shorts, I see a sharp 30% drop right at second 3 to 4. What do you do in the first 3 seconds to lock viewers in? Fast zoom? Sound effect? Text hook?',
  'Zayd Khan',
  'member',
  false,
  31,
  9,
  array['shorts', 'retention', 'editing']
),
(
  'What are your best AI prompts for generating viral video ideas and hooks?',
  'Most generic ChatGPT prompts give boring results like ''5 tips to be productive''. Has anyone built a good prompt template for Groq or Claude that generates contrarian or curiosity-driven titles and hooks?',
  'Bilal Ahmed',
  'pro',
  false,
  45,
  8,
  array['ai', 'prompts', 'scriptwriting']
),
(
  'How to remove background fan/room noise from microphone recordings cleanly?',
  'Recording in a room with PC fan noise and mild reverb. Are you using AI noise removal tools or OBS / Audacity noise gates? Does AI transcription or voice cloning work better if audio is pre-cleaned?',
  'Sarah Jenkins',
  'member',
  false,
  19,
  4,
  array['audio', 'microphone', 'sound']
);
