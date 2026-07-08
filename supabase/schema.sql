-- Enable UUID generation if needed
create extension if not exists "pgcrypto";

-- =========================
-- DROP EXISTING TABLES & ENUMS
-- =========================
drop table if exists public.ai_recommendations cascade;
drop table if exists public.fan_queries cascade;
drop table if exists public.knowledge_articles cascade;
drop table if exists public.queue_metrics cascade;
drop table if exists public.crowd_metrics cascade;
drop table if exists public.staff_assignments cascade;
drop table if exists public.incident_updates cascade;
drop table if exists public.incidents cascade;
drop table if exists public.tickets cascade;
drop table if exists public.routes cascade;
drop table if exists public.amenities cascade;
drop table if exists public.zones cascade;
drop table if exists public.matches cascade;
drop table if exists public.stadiums cascade;
drop table if exists public.profiles cascade;

drop type if exists knowledge_category cascade;
drop type if exists team_type cascade;
drop type if exists assignment_status cascade;
drop type if exists incident_status cascade;
drop type if exists incident_severity cascade;
drop type if exists incident_type cascade;
drop type if exists amenity_type cascade;
drop type if exists zone_type cascade;
drop type if exists match_status cascade;
drop type if exists user_role cascade;

-- =========================
-- ENUMS
-- =========================

create type user_role as enum ('fan', 'staff', 'ops_manager', 'admin');

create type match_status as enum ('scheduled', 'live', 'completed', 'cancelled');

create type zone_type as enum (
'gate',
'stand',
'concourse',
'exit',
'food',
'washroom',
'medical',
'merchandise',
'transport',
'control',
'other'
);

create type amenity_type as enum (
'food',
'washroom',
'medical',
'merchandise',
'helpdesk',
'water',
'other'
);

create type incident_type as enum (
'medical',
'lost_child',
'suspicious_item',
'harassment',
'crowd_disturbance',
'accessibility_issue',
'blocked_pathway',
'general_help',
'other'
);

create type incident_severity as enum ('low', 'medium', 'high', 'critical');

create type incident_status as enum (
'reported',
'acknowledged',
'assigned',
'in_progress',
'resolved',
'closed'
);

create type assignment_status as enum (
'assigned',
'accepted',
'in_progress',
'completed',
'cancelled'
);

create type team_type as enum (
'security',
'medical',
'operations',
'volunteer_support',
'accessibility_support'
);

create type knowledge_category as enum (
'entry_rules',
'prohibited_items',
'transport',
'accessibility',
'facilities',
'emergency_help',
'general_faq'
);

-- =========================
-- TABLES
-- =========================

create table public.profiles (
id uuid primary key references auth.users(id) on delete cascade,
full_name text not null,
email text unique not null,
role user_role not null default 'fan',
phone text,
preferred_language text default 'en',
accessibility_preferences jsonb default '{}'::jsonb,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
);

create table public.stadiums (
id uuid primary key default gen_random_uuid(),
name text not null,
city text not null,
country text not null,
capacity integer,
description text,
created_at timestamptz not null default now()
);

create table public.matches (
id uuid primary key default gen_random_uuid(),
stadium_id uuid not null references public.stadiums(id) on delete cascade,
title text not null,
home_team text,
away_team text,
match_date date not null,
start_time timestamptz not null,
status match_status not null default 'scheduled',
created_at timestamptz not null default now()
);

create table public.zones (
id uuid primary key default gen_random_uuid(),
stadium_id uuid not null references public.stadiums(id) on delete cascade,
name text not null,
zone_type zone_type not null,
level text,
is_accessible boolean not null default false,
metadata jsonb default '{}'::jsonb,
created_at timestamptz not null default now()
);

create table public.amenities (
id uuid primary key default gen_random_uuid(),
stadium_id uuid not null references public.stadiums(id) on delete cascade,
zone_id uuid not null references public.zones(id) on delete cascade,
name text not null,
amenity_type amenity_type not null,
is_accessible boolean not null default false,
status text not null default 'active',
metadata jsonb default '{}'::jsonb,
created_at timestamptz not null default now()
);

create table public.routes (
id uuid primary key default gen_random_uuid(),
stadium_id uuid not null references public.stadiums(id) on delete cascade,
from_zone_id uuid not null references public.zones(id) on delete cascade,
to_zone_id uuid not null references public.zones(id) on delete cascade,
distance numeric not null,
is_accessible boolean not null default false,
status text not null default 'open',
created_at timestamptz not null default now(),
constraint routes_no_self_loop check (from_zone_id <> to_zone_id)
);

create table public.tickets (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references public.profiles(id) on delete cascade,
match_id uuid not null references public.matches(id) on delete cascade,
seat_section text not null,
seat_row text,
seat_number text,
assigned_gate_zone_id uuid references public.zones(id) on delete set null,
created_at timestamptz not null default now()
);

create table public.incidents (
id uuid primary key default gen_random_uuid(),
match_id uuid not null references public.matches(id) on delete cascade,
stadium_id uuid not null references public.stadiums(id) on delete cascade,
reported_by uuid not null references public.profiles(id) on delete cascade,
reporter_role user_role not null,
title text not null,
description text not null,
incident_type incident_type not null default 'general_help',
severity incident_severity not null default 'low',
status incident_status not null default 'reported',
zone_id uuid references public.zones(id) on delete set null,
assigned_team team_type,
ai_summary text,
created_at timestamptz not null default now(),
resolved_at timestamptz
);

create table public.incident_updates (
id uuid primary key default gen_random_uuid(),
incident_id uuid not null references public.incidents(id) on delete cascade,
updated_by uuid not null references public.profiles(id) on delete cascade,
old_status incident_status,
new_status incident_status,
note text,
created_at timestamptz not null default now()
);

create table public.staff_assignments (
id uuid primary key default gen_random_uuid(),
incident_id uuid not null references public.incidents(id) on delete cascade,
staff_id uuid not null references public.profiles(id) on delete cascade,
team_type team_type not null,
assignment_status assignment_status not null default 'assigned',
assigned_at timestamptz not null default now(),
completed_at timestamptz
);

create table public.crowd_metrics (
id uuid primary key default gen_random_uuid(),
match_id uuid not null references public.matches(id) on delete cascade,
zone_id uuid not null references public.zones(id) on delete cascade,
density_score numeric not null,
estimated_wait_minutes integer,
footfall_count integer,
captured_at timestamptz not null default now()
);

create table public.queue_metrics (
id uuid primary key default gen_random_uuid(),
match_id uuid not null references public.matches(id) on delete cascade,
amenity_id uuid not null references public.amenities(id) on delete cascade,
queue_score numeric not null,
estimated_wait_minutes integer,
captured_at timestamptz not null default now()
);

create table public.knowledge_articles (
id uuid primary key default gen_random_uuid(),
stadium_id uuid not null references public.stadiums(id) on delete cascade,
title text not null,
category knowledge_category not null,
content text not null,
tags text[] default '{}',
language text not null default 'en',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
);

create table public.fan_queries (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references public.profiles(id) on delete cascade,
match_id uuid not null references public.matches(id) on delete cascade,
query_text text not null,
query_type text,
response_text text,
created_at timestamptz not null default now()
);

create table public.ai_recommendations (
id uuid primary key default gen_random_uuid(),
match_id uuid not null references public.matches(id) on delete cascade,
stadium_id uuid not null references public.stadiums(id) on delete cascade,
recommendation_type text not null,
title text not null,
content text not null,
related_zone_id uuid references public.zones(id) on delete set null,
generated_by text not null default 'groq',
created_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================
create index idx_profiles_role on public.profiles(role);
create index idx_matches_stadium_id on public.matches(stadium_id);
create index idx_matches_status on public.matches(status);
create index idx_matches_match_date on public.matches(match_date);
create index idx_zones_stadium_id on public.zones(stadium_id);
create index idx_zones_zone_type on public.zones(zone_type);
create index idx_amenities_stadium_id on public.amenities(stadium_id);
create index idx_amenities_zone_id on public.amenities(zone_id);
create index idx_amenities_type on public.amenities(amenity_type);
create index idx_routes_stadium_id on public.routes(stadium_id);
create index idx_routes_from_zone_id on public.routes(from_zone_id);
create index idx_routes_to_zone_id on public.routes(to_zone_id);
create index idx_tickets_user_id on public.tickets(user_id);
create index idx_tickets_match_id on public.tickets(match_id);
create index idx_incidents_match_id on public.incidents(match_id);
create index idx_incidents_stadium_id on public.incidents(stadium_id);
create index idx_incidents_status on public.incidents(status);
create index idx_incidents_severity on public.incidents(severity);
create index idx_incidents_zone_id on public.incidents(zone_id);
create index idx_incidents_assigned_team on public.incidents(assigned_team);
create index idx_incidents_created_at on public.incidents(created_at desc);
create index idx_incident_updates_incident_id on public.incident_updates(incident_id);
create index idx_incident_updates_created_at on public.incident_updates(created_at desc);
create index idx_staff_assignments_incident_id on public.staff_assignments(incident_id);
create index idx_staff_assignments_staff_id on public.staff_assignments(staff_id);
create index idx_staff_assignments_status on public.staff_assignments(assignment_status);
create index idx_crowd_metrics_match_zone_time on public.crowd_metrics(match_id, zone_id, captured_at desc);
create index idx_queue_metrics_match_amenity_time on public.queue_metrics(match_id, amenity_id, captured_at desc);
create index idx_knowledge_articles_stadium_id on public.knowledge_articles(stadium_id);
create index idx_knowledge_articles_category on public.knowledge_articles(category);
create index idx_fan_queries_user_id on public.fan_queries(user_id);
create index idx_fan_queries_match_id on public.fan_queries(match_id);
create index idx_ai_recommendations_match_id on public.ai_recommendations(match_id);
create index idx_ai_recommendations_stadium_id on public.ai_recommendations(stadium_id);
create index idx_ai_recommendations_related_zone_id on public.ai_recommendations(related_zone_id);

-- =========================
-- AUTH TRIGGER FOR PROFILES
-- =========================
-- Automatically creates a fan profile when a user signs up.
-- Ops users are seeded manually.
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email, 'fan');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists (using a trick to bypass syntax errors if not attached)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

ALTER TABLE public.tickets ADD COLUMN gate text;
