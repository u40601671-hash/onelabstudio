-- One Lab Studio: database setup (Phase 1 + 2)
-- Run this ONCE in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- It is safe to run again (it uses "if not exists" / "or replace" where possible).

-- ------------------------------------------------------------------
-- 1) Profiles: one row per user (created automatically at signup)
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: is the current user an admin? (security definer avoids a policy loop)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Members may change ONLY their name and avatar. Role and plan can never be edited from the website.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Create a profile automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------
-- 2) Tools
-- ------------------------------------------------------------------
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null check (category in ('Content Creation', 'Automation', 'AI')),
  description text not null default '',
  icon text not null default '🛠️',
  art int not null default 1 check (art between 1 and 12), -- which illustration to show
  type text not null default 'js' check (type in ('js', 'python', 'download')),
  access text not null default 'free' check (access in ('free', 'paid')),
  status text not null default 'draft' check (status in ('draft', 'live')),
  entry text, -- JS tool path, Python endpoint or download link (used in Phase 3)
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tools enable row level security;

drop policy if exists "tools: live are public, admin sees all" on public.tools;
create policy "tools: live are public, admin sees all" on public.tools
  for select using (status = 'live' or public.is_admin());

drop policy if exists "tools: admin insert" on public.tools;
create policy "tools: admin insert" on public.tools
  for insert with check (public.is_admin());

drop policy if exists "tools: admin update" on public.tools;
create policy "tools: admin update" on public.tools
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tools: admin delete" on public.tools;
create policy "tools: admin delete" on public.tools
  for delete using (public.is_admin());

-- ------------------------------------------------------------------
-- 3) Sample tools (the same 12 you see on the website today)
-- ------------------------------------------------------------------
insert into public.tools (slug, name, category, description, icon, art, type, access, status, sort_order) values
  ('thumbnail-maker',      'Thumbnail Maker',      'Content Creation', 'Design eye-catching YouTube thumbnails in minutes.',          '🖼️', 1,  'js',       'free', 'live', 10),
  ('caption-generator',    'Caption Generator',    'Content Creation', 'Write engaging captions for every post.',                       '✍️', 2,  'js',       'free', 'live', 20),
  ('hashtag-finder',       'Hashtag Finder',       'Content Creation', 'Find relevant hashtags to reach a wider audience.',             '#️⃣', 3,  'js',       'free', 'live', 30),
  ('title-idea-generator', 'Title Idea Generator', 'Content Creation', 'Get click-worthy title ideas for videos and articles.',         '📝', 4,  'js',       'free', 'live', 40),
  ('bulk-file-renamer',    'Bulk File Renamer',    'Automation',       'Rename thousands of files with one click.',                     '🗂️', 5,  'download', 'free', 'live', 50),
  ('link-shortener',       'Link Shortener',       'Automation',       'Create short, clean links that are easy to share.',             '🔗', 6,  'js',       'free', 'live', 60),
  ('content-planner',      'Content Planner',      'Automation',       'Plan a full week of posts on one simple calendar.',             '📅', 7,  'js',       'free', 'live', 70),
  ('ai-idea-assistant',    'AI Idea Assistant',    'AI',               'Brainstorm content ideas with the help of AI.',                 '🤖', 8,  'python',   'free', 'live', 80),
  ('text-cleaner',         'Text Cleaner',         'AI',               'Fix spacing, remove duplicates and tidy any text.',             '🧹', 9,  'js',       'free', 'live', 90),
  ('video-script-writer',  'Video Script Writer',  'AI',               'Generate a complete video script from a single idea.',          '🎬', 10, 'python',   'paid', 'live', 100),
  ('auto-poster',          'Auto Poster',          'Automation',       'Schedule and publish to your social accounts automatically.',   '🚀', 11, 'python',   'paid', 'live', 110),
  ('ai-voice-over',        'AI Voice Over',        'AI',               'Turn any text into natural-sounding speech.',                   '🎙️', 12, 'python',   'paid', 'live', 120)
on conflict (slug) do nothing;

-- ------------------------------------------------------------------
-- 4) Make YOURSELF the admin (do this AFTER you have signed up on the website)
--    Replace the email, then run just this line:
-- ------------------------------------------------------------------
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');
