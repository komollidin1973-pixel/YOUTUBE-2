-- YOUTUBE-2: kino posterida 12 soniyalik preview uchun Supabase migratsiyasi
alter table public.movies
  add column if not exists preview_url text;

alter table public.movies
  add column if not exists preview_start_seconds integer not null default 2400;

-- preview_url: alohida qisqa MP4 preview bo‘lsa shu yerda saqlanadi.
-- preview_start_seconds: preview_url bo‘sh bo‘lsa asosiy direct video ichidan
-- qaysi soniyadan boshlash. 2400 = 40 daqiqa.
