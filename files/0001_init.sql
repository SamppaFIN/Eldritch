-- Eldritch Sanctuary v3 — initial schema
-- HUOM: tämä on LUONNOS. Tarkista h3-funktioiden nimet omaa Supabase-projektiasi vasten
-- (h3-pg v4: h3_lat_lng_to_cell, h3_polygon_to_cells, h3_cell_to_boundary_geometry,
--  h3_grid_disk, h3_cell_to_parent). Aja: supabase db push

create extension if not exists postgis;
create extension if not exists h3;
create extension if not exists h3_postgis;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------- constants
create schema if not exists game;

create table game.config (
  key   text primary key,
  value jsonb not null
);

insert into game.config (key, value) values
  ('res_ownership',        '11'),
  ('res_region',           '6'),
  ('loop_close_radius_m',  '25'),
  ('max_loop_area_m2',     '50000'),
  ('max_loop_duration_ms', '5400000'),
  ('min_loop_points',      '8'),
  ('max_speed_ms',         '8'),
  ('max_accuracy_m',       '50'),
  ('base_strength',        '100'),
  ('max_strength',         '500'),
  ('day_visit_bonus',      '25'),
  ('streak_visit_bonus',   '50'),
  ('decay_grace_hours',    '48'),
  ('decay_per_day',        '10'),
  ('decay_per_day_late',   '25'),
  ('decay_late_after_days','14'),
  ('neighbour_bonus',      '15'),
  ('neighbour_bonus_cap',  '90'),
  ('anchor_bonus',         '200'),
  ('level_strength_bonus', '5')
on conflict do nothing;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  display_name        text not null default 'Consciousness Walker',
  color_hue           int  not null default (floor(random()*360)),
  consciousness_level int  not null default 1,
  xp                  bigint not null default 0,
  cells_owned         int  not null default 0,
  total_area_m2       double precision not null default 0,
  theme               text not null default 'cosmic'
                      check (theme in ('cosmic','void','mystic')),
  save_version        int  not null default 1,   -- v2:ssa ei ollut → taso-118-bugi
  created_at          timestamptz not null default now(),
  -- v2:ssa tasokäyrä oli katkaisematon ja tuotannossa nähtiin taso 118.
  constraint level_capped check (consciousness_level between 1 and 20)
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- runs & trail
create table public.runs (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.profiles on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  status      text not null default 'active'
              check (status in ('active','closed','abandoned','flagged')),
  distance_m  double precision not null default 0,
  suspicious  boolean not null default false
);
create index on public.runs (player_id, status);

create table public.trail_points (
  run_id      uuid not null references public.runs on delete cascade,
  seq         int  not null,
  geom        geography(Point,4326) not null,
  accuracy_m  real not null,
  speed_ms    real,
  recorded_at timestamptz not null,
  primary key (run_id, seq)
);

-- ---------------------------------------------------------------- territory
create table public.cells (
  h3                 h3index primary key,
  region_h3_r6       h3index not null,
  owner_id           uuid not null references public.profiles on delete cascade,
  strength           int  not null default 100 check (strength between 1 and 500),
  visit_days         int  not null default 1,   -- montako eri päivää omistaja on käynyt
  last_visit_day     date not null default current_date,
  claimed_at         timestamptz not null default now(),
  last_reinforced_at timestamptz not null default now()
);

-- Yksi rivi per pelaaja+solu+päivä. Estää saman päivän toistuvan vahvistamisen.
create table public.cell_visits (
  player_id uuid    not null references public.profiles on delete cascade,
  h3        h3index not null,
  visit_day date    not null,
  primary key (player_id, h3, visit_day)
);
create index on public.cell_visits (h3, visit_day);
create index on public.cells (owner_id);
create index on public.cells (region_h3_r6);

create table public.cell_history (
  id         bigserial primary key,
  h3         h3index not null,
  from_owner uuid,
  to_owner   uuid,
  event      text not null check (event in ('claim','corrupt','siege','decay','release','wager','reinforce')),
  run_id     uuid,
  at         timestamptz not null default now()
);
create index on public.cell_history (h3, at desc);
create index on public.cell_history (to_owner, at desc);

create table public.claims (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references public.profiles on delete cascade,
  run_id        uuid not null references public.runs on delete cascade,
  loop          geometry(Polygon,4326) not null,
  area_m2       double precision not null,
  cells_gained  int not null default 0,
  cells_stolen  int not null default 0,
  created_at    timestamptz not null default now()
);

create table public.anchors (
  id       uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  h3       h3index not null unique,
  built_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- codex (v2:sta)
-- Evolving Codex: jokaisella entiteetillä on tasoja jotka aukeavat kohtaamismäärän
-- mukaan. Rakenne peritty v2:n EvolvingCodexData.js:stä — säilytä porrastus.
create table public.codex_entries (
  key      text primary key,          -- 'cosmic-fragment', 'aurora', ...
  category text not null check (category in ('discovery','npc','monster','shrine','place')),
  name     text not null,
  glyph    text
);

create table public.codex_tiers (
  entry_key    text references public.codex_entries on delete cascade,
  unlock_at    int  not null,          -- kohtaamisia vaaditaan: 0, 1, 5, 10
  title        text not null,
  body         text not null,
  primary key (entry_key, unlock_at)
);

create table public.player_codex (
  player_id       uuid references public.profiles on delete cascade,
  entry_key       text references public.codex_entries on delete cascade,
  encounter_count int not null default 0,
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  primary key (player_id, entry_key)
);

-- ---------------------------------------------------------------- chat
-- Korvaa v2:n Socket.io-chatin. Realtime broadcast lukee tästä.
create table public.chat_messages (
  id         bigserial primary key,
  player_id  uuid not null references public.profiles on delete cascade,
  region_h3_r6 h3index not null,
  body       text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.chat_messages (region_h3_r6, created_at desc);

create table public.discoveries (
  id           uuid primary key default gen_random_uuid(),
  h3           h3index not null,
  geom         geography(Point,4326) not null,
  type         text not null,
  rarity       text not null check (rarity in ('common','uncommon','rare','epic','legendary')),
  xp           int not null,
  spawned_at   timestamptz not null default now(),
  expires_at   timestamptz,
  collected_by uuid references public.profiles,
  collected_at timestamptz
);
create index on public.discoveries using gist (geom) where collected_by is null;

-- ---------------------------------------------------------------- wagers
create table public.wagers (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  host_id         uuid not null references public.profiles,
  guest_id        uuid references public.profiles,
  mode            text not null default 'arena' check (mode in ('arena','open')),
  arena_center    geography(Point,4326),
  arena_radius_m  int default 500,
  starts_at       timestamptz,
  ends_at         timestamptz,
  status          text not null default 'pending'
                  check (status in ('pending','active','finished','cancelled')),
  winner_id       uuid references public.profiles,
  created_at      timestamptz not null default now()
);

create table public.wager_scores (
  wager_id  uuid references public.wagers on delete cascade,
  player_id uuid references public.profiles on delete cascade,
  cells     int not null default 0,
  area_m2   double precision not null default 0,
  primary key (wager_id, player_id)
);

-- ---------------------------------------------------------------- RLS
alter table public.profiles      enable row level security;
alter table public.cells         enable row level security;
alter table public.cell_history  enable row level security;
alter table public.claims        enable row level security;
alter table public.anchors       enable row level security;
alter table public.runs          enable row level security;
alter table public.trail_points  enable row level security;
alter table public.wagers        enable row level security;
alter table public.wager_scores  enable row level security;
alter table public.discoveries   enable row level security;

-- public read on the shared world
create policy read_all on public.profiles     for select using (true);
create policy read_all on public.cells        for select using (true);
create policy read_all on public.cell_history for select using (true);
create policy read_all on public.claims       for select using (true);
create policy read_all on public.anchors      for select using (true);
create policy read_all on public.wagers       for select using (true);
create policy read_all on public.wager_scores for select using (true);
create policy read_all on public.discoveries  for select using (true);

-- own data only
create policy read_own on public.runs
  for select using (auth.uid() = player_id);
create policy read_own on public.trail_points
  for select using (exists (
    select 1 from public.runs r where r.id = run_id and r.player_id = auth.uid()));

-- NO write policies anywhere. All mutations go through SECURITY DEFINER RPC below.

-- ---------------------------------------------------------------- RPC: start run
create or replace function public.start_run()
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  update public.runs set status = 'abandoned', ended_at = now()
    where player_id = auth.uid() and status = 'active';
  insert into public.runs (player_id) values (auth.uid()) returning id into new_id;
  return new_id;
end $$;

-- ---------------------------------------------------------------- RPC: submit points
-- points: [{lat, lng, accuracy, recorded_at}]  — server validates and renumbers
create or replace function public.submit_trail_batch(p_run_id uuid, p_points jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_owner     uuid;
  v_last_geom geography;
  v_last_time timestamptz;
  v_seq       int;
  v_max_acc   real := (select (value #>> '{}')::real from game.config where key='max_accuracy_m');
  v_max_speed real := (select (value #>> '{}')::real from game.config where key='max_speed_ms');
  v_pt        jsonb;
  v_geom      geography;
  v_time      timestamptz;
  v_dist      double precision;
  v_dt        double precision;
  v_accepted  int := 0;
  v_rejected  int := 0;
begin
  select player_id into v_owner from public.runs where id = p_run_id and status = 'active';
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'run not found or not yours';
  end if;

  select geom, recorded_at, seq into v_last_geom, v_last_time, v_seq
    from public.trail_points where run_id = p_run_id order by seq desc limit 1;
  v_seq := coalesce(v_seq, 0);

  for v_pt in select * from jsonb_array_elements(p_points) loop
    if (v_pt->>'accuracy')::real > v_max_acc then
      v_rejected := v_rejected + 1; continue;
    end if;

    v_geom := st_point((v_pt->>'lng')::float8, (v_pt->>'lat')::float8)::geography;
    v_time := (v_pt->>'recorded_at')::timestamptz;

    if v_time > now() + interval '2 minutes' then
      v_rejected := v_rejected + 1; continue;
    end if;

    if v_last_geom is not null then
      v_dist := st_distance(v_last_geom, v_geom);
      v_dt   := extract(epoch from (v_time - v_last_time));
      if v_dt <= 0 then v_rejected := v_rejected + 1; continue; end if;
      if v_dist / v_dt > v_max_speed then
        v_rejected := v_rejected + 1;
        update public.runs set suspicious = true where id = p_run_id;
        continue;
      end if;
      update public.runs set distance_m = distance_m + v_dist where id = p_run_id;
    end if;

    v_seq := v_seq + 1;
    insert into public.trail_points (run_id, seq, geom, accuracy_m, recorded_at)
      values (p_run_id, v_seq, v_geom, (v_pt->>'accuracy')::real, v_time);

    v_last_geom := v_geom;
    v_last_time := v_time;
    v_accepted  := v_accepted + 1;
  end loop;

  return jsonb_build_object('accepted', v_accepted, 'rejected', v_rejected, 'last_seq', v_seq);
end $$;

-- ---------------------------------------------------------------- RPC: close loop
-- Builds a polygon from the trail, rasterises it to H3, resolves ownership.
-- TODO(Vaihe 2): loop-detection is currently "whole trail" — refine to detect the
-- self-intersection point and use only the closed portion. Mirror the exact algorithm
-- from packages/core/geo/loopDetection.ts so client and server agree.
create or replace function public.close_loop(p_run_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_owner    uuid;
  v_level    int;
  v_res      int    := (select (value #>> '{}')::int    from game.config where key='res_ownership');
  v_res_r6   int    := (select (value #>> '{}')::int    from game.config where key='res_region');
  v_base     int    := (select (value #>> '{}')::int    from game.config where key='base_strength');
  v_lvlbonus int    := (select (value #>> '{}')::int    from game.config where key='level_strength_bonus');
  v_nbonus   int    := (select (value #>> '{}')::int    from game.config where key='neighbour_bonus');
  v_ncap     int    := (select (value #>> '{}')::int    from game.config where key='neighbour_bonus_cap');
  v_maxarea  float8 := (select (value #>> '{}')::float8 from game.config where key='max_loop_area_m2');
  v_minpts   int    := (select (value #>> '{}')::int    from game.config where key='min_loop_points');
  v_line     geometry;
  v_poly     geometry;
  v_area     float8;
  v_npoints  int;
  v_gained   int := 0;
  v_stolen   int := 0;
  v_sieged   int := 0;
  v_anchorb  int    := (select (value #>> '{}')::int from game.config where key='anchor_bonus');
  v_cell     h3index;
  v_power    int;
  v_defence  int;
  v_prev     uuid;
begin
  select r.player_id, p.consciousness_level into v_owner, v_level
    from public.runs r join public.profiles p on p.id = r.player_id
   where r.id = p_run_id and r.status = 'active';
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'run not found or not yours';
  end if;

  select count(*) into v_npoints from public.trail_points where run_id = p_run_id;
  if v_npoints < v_minpts then raise exception 'too few points'; end if;

  select st_makeline(geom::geometry order by seq) into v_line
    from public.trail_points where run_id = p_run_id;

  v_poly := st_makevalid(st_makepolygon(st_addpoint(v_line, st_startpoint(v_line))));
  if v_poly is null or st_isempty(v_poly) then raise exception 'loop is not closeable'; end if;

  v_area := st_area(v_poly::geography);
  if v_area > v_maxarea * (1 + v_level::float8 / 10) then
    raise exception 'loop too large: % m2', round(v_area);
  end if;

  -- PIIRITYSMALLI: hyokkays tekee vahinkoa, solu vaihtaa omistajaa vasta nollassa.
  -- Naapuribonus lasketaan ENNEN silmukkaa, jotta saman lenkin aikana vallatut solut
  -- eivat kasvata voimaa kesken suorituksen (jarjestysriippuvuus = epadeterministinen).
  for v_cell in select h3_polygon_to_cells(v_poly, v_res) loop
    select owner_id, strength into v_prev, v_defence from public.cells where h3 = v_cell;

    v_power := v_base + v_level * v_lvlbonus
             + least(v_ncap, v_nbonus * (
                 select count(*) from public.cells c
                  where c.owner_id = v_owner and c.h3 = any (h3_grid_disk(v_cell, 1))))
             + coalesce((select v_anchorb from public.anchors a
                          where a.owner_id = v_owner
                            and a.h3 = any (h3_grid_disk(v_cell, 1)) limit 1), 0);

    if v_prev is null then
      -- vapaa maa
      insert into public.cells (h3, region_h3_r6, owner_id, strength, visit_days, last_visit_day)
      values (v_cell, h3_cell_to_parent(v_cell, v_res_r6), v_owner, v_base, 1, current_date);
      insert into public.cell_visits (player_id, h3, visit_day)
      values (v_owner, v_cell, current_date) on conflict do nothing;
      insert into public.cell_history (h3, to_owner, event, run_id)
      values (v_cell, v_owner, 'claim', p_run_id);
      v_gained := v_gained + 1;

    elsif v_prev = v_owner then
      -- oma solu: vahvistuu vain kerran per paiva, streak jos eilen myos
      perform public.register_visit(v_owner, v_cell);

    else
      -- vihollisen solu: vahinkoa
      if v_defence - v_power <= 0 then
        update public.cells
           set owner_id = v_owner, strength = v_base, visit_days = 1,
               last_visit_day = current_date,
               claimed_at = now(), last_reinforced_at = now()
         where h3 = v_cell;
        insert into public.cell_visits (player_id, h3, visit_day)
        values (v_owner, v_cell, current_date) on conflict do nothing;
        insert into public.cell_history (h3, from_owner, to_owner, event, run_id)
        values (v_cell, v_prev, v_owner, 'corrupt', p_run_id);
        v_stolen := v_stolen + 1;
      else
        update public.cells set strength = v_defence - v_power where h3 = v_cell;
        insert into public.cell_history (h3, from_owner, to_owner, event, run_id)
        values (v_cell, v_prev, v_owner, 'siege', p_run_id);
        v_sieged := v_sieged + 1;
      end if;
    end if;
  end loop;

  insert into public.claims (player_id, run_id, loop, area_m2, cells_gained, cells_stolen)
  values (v_owner, p_run_id, v_poly, v_area, v_gained, v_stolen);

  update public.runs set status = 'closed', ended_at = now() where id = p_run_id;
  delete from public.trail_points where run_id = p_run_id;

  update public.profiles
     set xp = xp + v_gained * 10 + v_stolen * 25,
         cells_owned = (select count(*) from public.cells where owner_id = v_owner)
   where id = v_owner;

  return jsonb_build_object(
    'area_m2', round(v_area), 'gained', v_gained, 'stolen', v_stolen,
    'sieged', v_sieged, 'xp', v_gained * 10 + v_stolen * 25);
end $$;

-- ---------------------------------------------------------------- vahvistuminen
-- Kerran per kalenteripaiva. Perakkainen paiva antaa suuremman bonuksen.
create or replace function public.register_visit(p_player uuid, p_cell h3index)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_day     int := (select (value #>> '{}')::int from game.config where key='day_visit_bonus');
  v_streak  int := (select (value #>> '{}')::int from game.config where key='streak_visit_bonus');
  v_max     int := (select (value #>> '{}')::int from game.config where key='max_strength');
  v_bonus   int;
  v_isnew   boolean;
begin
  insert into public.cell_visits (player_id, h3, visit_day)
  values (p_player, p_cell, current_date)
  on conflict do nothing;
  get diagnostics v_isnew = row_count;

  if not v_isnew then return; end if;   -- jo kaynyt tanaan, ei vaikutusta

  if exists (select 1 from public.cell_visits
              where player_id = p_player and h3 = p_cell
                and visit_day = current_date - 1)
  then v_bonus := v_streak;
  else v_bonus := v_day;
  end if;

  update public.cells
     set strength = least(v_max, strength + v_bonus),
         visit_days = visit_days + 1,
         last_visit_day = current_date,
         last_reinforced_at = now()
   where h3 = p_cell and owner_id = p_player;

  insert into public.cell_history (h3, to_owner, event)
  values (p_cell, p_player, 'reinforce');
end $$;

-- ---------------------------------------------------------------- rappeutuminen
-- Kiihtyva: 48h armonaika, sitten -10/vrk, 14 vrk jalkeen -25/vrk. Nollassa vapautuu.
create or replace function public.decay_tick()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_grace  int := (select (value #>> '{}')::int from game.config where key='decay_grace_hours');
  v_slow   int := (select (value #>> '{}')::int from game.config where key='decay_per_day');
  v_fast   int := (select (value #>> '{}')::int from game.config where key='decay_per_day_late');
  v_late   int := (select (value #>> '{}')::int from game.config where key='decay_late_after_days');
  v_decayed int;
  v_released int;
begin
  with aged as (
    select h3, owner_id, strength,
           extract(epoch from (now() - last_reinforced_at)) / 86400.0 as days_idle
      from public.cells
     where last_reinforced_at < now() - (v_grace || ' hours')::interval
  )
  update public.cells c
     set strength = c.strength - case when a.days_idle > v_late then v_fast else v_slow end
    from aged a
   where c.h3 = a.h3;
  get diagnostics v_decayed = row_count;

  -- The Void reclaims
  insert into public.cell_history (h3, from_owner, event)
  select h3, owner_id, 'release' from public.cells where strength <= 0;

  with gone as (delete from public.cells where strength <= 0 returning owner_id)
  select count(*) into v_released from gone;

  delete from public.cell_visits
   where visit_day < current_date - 60;   -- siivous

  update public.profiles p
     set cells_owned = (select count(*) from public.cells c where c.owner_id = p.id);

  return jsonb_build_object('decayed', v_decayed, 'released', v_released);
end $$;

-- Kerran vuorokaudessa klo 03:00 UTC. EI tunneittain — rappeutuminen on paivakohtaista.
select cron.schedule('eldritch-decay', '0 3 * * *', $$select public.decay_tick()$$);

-- ---------------------------------------------------------------- HUOM Vaihe 2
-- register_visit kutsutaan myos submit_trail_batchista jokaiselle solulle jonka lapi
-- kuljetaan — ei pelkastaan lenkin sulkeutuessa. Muuten pelkka lapikulku ei vahvista
-- aluetta, ja pelaajan pitaisi sulkea lenkki joka paiva sailyttaakseen kotialueensa.
-- Lisaa se kun loop-detection on paikallaan (ks. PROMPTS.md Vaihe 2).
