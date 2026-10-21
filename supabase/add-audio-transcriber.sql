-- Adds the Audio Transcriber tool (runs in the visitor's browser). Safe to run more than once.
insert into public.tools (slug, name, category, description, icon, art, type, access, status, sort_order) values
  ('audio-transcriber', 'Audio Transcriber', 'AI', 'Turn audio or video into text and subtitles (SRT/VTT) with word-exact timing. Runs privately in your browser.', '🎧', 8, 'js', 'free', 'live', 85)
on conflict (slug) do nothing;

-- Adds the Auto Video Editor tool (runs in the visitor's browser). Safe to run more than once.
insert into public.tools (slug, name, category, description, icon, art, type, access, status, sort_order) values
  ('auto-video-editor', 'Auto Video Editor', 'Content Creation', 'Turn your voiceover, pictures and clips into a finished video with synced scenes, burned-in captions and an MP4 download. Runs privately in your browser.', '🎞️', 10, 'js', 'free', 'live', 15)
on conflict (slug) do nothing;
