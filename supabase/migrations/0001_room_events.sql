-- hq: append-only event log per room.
-- The table is locked down (RLS on, no policies). Clients only touch it
-- through the two functions below, so nobody can list other teams' rooms;
-- knowing a room id is what grants access to it.

create table if not exists public.room_events (
  id bigint generated always as identity primary key,
  room_id text not null check (room_id ~ '^[2-9a-hj-km-np-z]{12}$'),
  action jsonb not null check (pg_column_size(action) < 2048),
  created_at timestamptz not null default now()
);

create index if not exists room_events_room_id_idx on public.room_events (room_id, id);

alter table public.room_events enable row level security;

create or replace function public.hq_load(p_room text)
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select action from public.room_events where room_id = p_room order by id
$$;

create or replace function public.hq_append(p_room text, p_action jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(p_action) <> 'object' or not (p_action ? 'type') then
    raise exception 'invalid action';
  end if;
  if (select count(*) from public.room_events where room_id = p_room) >= 5000 then
    raise exception 'room is full';
  end if;
  insert into public.room_events (room_id, action) values (p_room, p_action);
end
$$;

revoke all on function public.hq_load(text) from public;
revoke all on function public.hq_append(text, jsonb) from public;
grant execute on function public.hq_load(text) to anon, authenticated;
grant execute on function public.hq_append(text, jsonb) to anon, authenticated;
