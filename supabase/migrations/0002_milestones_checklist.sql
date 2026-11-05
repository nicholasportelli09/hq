-- hq 0002: allow milestone and checklist actions.
-- Only widens the action-type allowlist in hq_append; everything else is unchanged.

create or replace function public.hq_append(p_room text, p_action jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := p_action ->> 'type';
  v_count int;
begin
  if jsonb_typeof(p_action) <> 'object'
     or octet_length(p_action::text) >= 2048
     or v_type is null
     or v_type not in (
       'room/create', 'room/rename', 'room/deadline', 'member/upsert',
       'task/add', 'task/done', 'task/owner', 'task/remove',
       'idea/add', 'idea/vote', 'idea/remove', 'idea/lock',
       'milestone/add', 'milestone/remove', 'checklist/set'
     ) then
    raise exception 'invalid action';
  end if;

  -- Serialise appends per room so the caps below can't be raced.
  perform pg_advisory_xact_lock(hashtext(p_room));

  select count(*) into v_count from public.room_events where room_id = p_room;

  if v_count = 0 then
    if v_type <> 'room/create' then
      raise exception 'room does not exist';
    end if;
    if (select count(*) from public.room_events
        where created_at > now() - interval '1 minute'
          and action ->> 'type' = 'room/create') >= 30 then
      raise exception 'too many new rooms, try again in a minute';
    end if;
  end if;

  -- Stay under PostgREST's default 1000-row response cap so hq_load is never truncated.
  if v_count >= 1000 then
    raise exception 'room is full';
  end if;

  if (select count(*) from public.room_events
      where room_id = p_room and created_at > now() - interval '10 seconds') >= 60 then
    raise exception 'slow down';
  end if;

  insert into public.room_events (room_id, action) values (p_room, p_action);
end
$$;

revoke all on function public.hq_append(text, jsonb) from public;
revoke all on function public.hq_append(text, jsonb) from authenticated;
grant execute on function public.hq_append(text, jsonb) to anon;
