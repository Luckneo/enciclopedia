create table if not exists public.encyclopedia_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('creature','plant','mineral','continent','region','nation','city','character','artifact','ecosystem','other')),
  slug text not null,
  title text not null,
  scientific_name text,
  summary text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  taxonomy jsonb not null default '{}'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  lore jsonb not null default '{}'::jsonb,
  relations jsonb not null default '[]'::jsonb,
  cover_image text,
  gallery jsonb not null default '[]'::jsonb,
  source_table text,
  source_id text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(kind, slug)
);

create index if not exists encyclopedia_entries_kind_status_idx on public.encyclopedia_entries(kind, status);
create index if not exists encyclopedia_entries_title_idx on public.encyclopedia_entries using gin (to_tsvector('simple', title || ' ' || coalesce(summary,'')));
create index if not exists encyclopedia_entries_created_by_idx on public.encyclopedia_entries(created_by);
create index if not exists encyclopedia_entries_updated_by_idx on public.encyclopedia_entries(updated_by);

alter table public.encyclopedia_entries enable row level security;
grant select on public.encyclopedia_entries to anon, authenticated;
grant insert, update, delete on public.encyclopedia_entries to authenticated;

create policy encyclopedia_entries_public_read on public.encyclopedia_entries for select to anon, authenticated using (status='published' or (select auth.uid()) is not null);
create policy encyclopedia_entries_owner_insert on public.encyclopedia_entries for insert to authenticated with check (created_by=(select auth.uid()) and updated_by=(select auth.uid()));
create policy encyclopedia_entries_owner_update on public.encyclopedia_entries for update to authenticated using (created_by=(select auth.uid())) with check (created_by=(select auth.uid()) and updated_by=(select auth.uid()));
create policy encyclopedia_entries_owner_delete on public.encyclopedia_entries for delete to authenticated using (created_by=(select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('encyclopedia-media','encyclopedia-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy encyclopedia_media_public_read on storage.objects for select to public using (bucket_id='encyclopedia-media');
create policy encyclopedia_media_owner_insert on storage.objects for insert to authenticated with check (bucket_id='encyclopedia-media' and owner_id=(select auth.uid())::text);
create policy encyclopedia_media_owner_update on storage.objects for update to authenticated using (bucket_id='encyclopedia-media' and owner_id=(select auth.uid())::text);
create policy encyclopedia_media_owner_delete on storage.objects for delete to authenticated using (bucket_id='encyclopedia-media' and owner_id=(select auth.uid())::text);
