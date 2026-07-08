-- Mock UUIDs for easy referencing
-- Stadium: 11111111-1111-1111-1111-111111111111
-- Match: 22222222-2222-2222-2222-222222222222
-- Profile (Ops): 33333333-3333-3333-3333-333333333333
-- Profile (Fan): 44444444-4444-4444-4444-444444444444

-- Insert Stadium
INSERT INTO public.stadiums (id, name, city, country, capacity, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Luzhniki Stadium', 'Moscow', 'Russia', 81000, 'Main stadium for the event'),
('11111111-2222-2222-2222-222222222221', 'Wembley Stadium', 'London', 'UK', 90000, ''),
('11111111-2222-2222-2222-222222222222', 'Camp Nou', 'Barcelona', 'Spain', 99354, ''),
('11111111-2222-2222-2222-222222222223', 'Santiago Bernabéu', 'Madrid', 'Spain', 81044, ''),
('11111111-2222-2222-2222-222222222224', 'Old Trafford', 'Manchester', 'UK', 74310, ''),
('11111111-2222-2222-2222-222222222225', 'Anfield', 'Liverpool', 'UK', 61276, ''),
('11111111-2222-2222-2222-222222222226', 'Etihad Stadium', 'Manchester', 'UK', 53400, ''),
('11111111-2222-2222-2222-222222222227', 'Allianz Arena', 'Munich', 'Germany', 75000, ''),
('11111111-2222-2222-2222-222222222228', 'Signal Iduna Park', 'Dortmund', 'Germany', 81365, ''),
('11111111-2222-2222-2222-222222222229', 'San Siro', 'Milan', 'Italy', 80018, ''),
('11111111-2222-2222-2222-22222222222a', 'Parc des Princes', 'Paris', 'France', 47929, ''),
('11111111-2222-2222-2222-22222222222b', 'Johan Cruyff Arena', 'Amsterdam', 'Netherlands', 55500, ''),
('11111111-2222-2222-2222-22222222222c', 'Lusail Stadium', 'Lusail', 'Qatar', 88966, ''),
('11111111-2222-2222-2222-22222222222d', 'Maracanã', 'Rio de Janeiro', 'Brazil', 78838, ''),
('11111111-2222-2222-2222-22222222222e', 'Estadio Azteca', 'Mexico City', 'Mexico', 87523, ''),
('11111111-2222-2222-2222-22222222222f', 'Tottenham Hotspur Stadium', 'London', 'UK', 62850, ''),
('11111111-3333-3333-3333-333333333330', 'Stamford Bridge', 'London', 'UK', 40341, ''),
('11111111-3333-3333-3333-333333333331', 'Emirates Stadium', 'London', 'UK', 60704, ''),
('11111111-3333-3333-3333-333333333332', 'Stadio Olimpico', 'Rome', 'Italy', 70634, ''),
('11111111-3333-3333-3333-333333333333', 'Celtic Park', 'Glasgow', 'Scotland', 60411, ''),
('11111111-3333-3333-3333-333333333334', 'Ibrox', 'Glasgow', 'Scotland', 50817, ''),
('11111111-3333-3333-3333-333333333335', 'Wanda Metropolitano', 'Madrid', 'Spain', 70460, '');

-- Insert Match
INSERT INTO public.matches (id, stadium_id, title, home_team, away_team, match_date, start_time, status) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Final Match', 'Team A', 'Team B', '2026-07-15', '2026-07-15T18:00:00Z', 'scheduled'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Semi-Final Match', 'Team C', 'Team D', '2026-07-10', '2026-07-10T18:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333301', '11111111-2222-2222-2222-222222222221', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333302', '11111111-2222-2222-2222-222222222222', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333303', '11111111-2222-2222-2222-222222222223', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333304', '11111111-2222-2222-2222-222222222224', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333305', '11111111-2222-2222-2222-222222222225', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333306', '11111111-2222-2222-2222-222222222226', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333307', '11111111-2222-2222-2222-222222222227', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333308', '11111111-2222-2222-2222-222222222228', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333309', '11111111-2222-2222-2222-222222222229', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333310', '11111111-2222-2222-2222-22222222222a', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333311', '11111111-2222-2222-2222-22222222222b', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333312', '11111111-2222-2222-2222-22222222222c', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333313', '11111111-2222-2222-2222-22222222222d', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333314', '11111111-2222-2222-2222-22222222222e', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333315', '11111111-2222-2222-2222-22222222222f', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333316', '11111111-3333-3333-3333-333333333330', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333317', '11111111-3333-3333-3333-333333333331', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333318', '11111111-3333-3333-3333-333333333332', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333319', '11111111-3333-3333-3333-333333333333', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333320', '11111111-3333-3333-3333-333333333334', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled'),
('22222222-3333-3333-3333-333333333321', '11111111-3333-3333-3333-333333333335', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled');

-- Insert Profiles (Note: In a real app, these must exist in auth.users first, but we are skipping RLS and foreign key constraints for this mock seed to work directly if needed, or we assume they exist. To be safe, we disable RLS on incidents/profiles later for MVP testing).
-- Since profiles references auth.users, inserting here directly will fail unless auth.users has them.
-- For a raw seed.sql, we should insert into auth.users if we are superusers, or just disable the foreign key constraint.
-- Let's just drop the constraint for the MVP so the seed works without signing up users manually.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

INSERT INTO public.profiles (id, full_name, email, role) VALUES
('33333333-3333-3333-3333-333333333333', 'Ops Manager', 'ops@nexora.app', 'ops_manager'),
('44444444-4444-4444-4444-444444444444', 'Average Fan', 'fan@nexora.app', 'fan'),
('44444444-4444-4444-4444-444444444445', 'Accessible Fan', 'accessible@nexora.app', 'fan');

-- Insert Ticket for the Fan
INSERT INTO public.tickets (id, user_id, match_id, seat_section, seat_row, seat_number) VALUES
('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '214', 'F', '12'),
('77777777-7777-7777-7777-777777777778', '44444444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222223', '102', 'A', '1');

-- Insert Zones (all tagged with metadata.routing_key for the route graph)
INSERT INTO public.zones (id, stadium_id, name, zone_type, level, is_accessible, metadata) VALUES
-- Gates (level 0)
('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'Gate A',            'gate',      '0', true,  '{"routing_key":"gate_a",           "x":"10%","y":"48%"}'),
('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 'Gate B',            'gate',      '0', true,  '{"routing_key":"gate_b",           "x":"90%","y":"48%"}'),
('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', 'Gate C',            'gate',      '0', true,  '{"routing_key":"gate_c",           "x":"50%","y":"90%"}'),
-- Concourse ring (level 1)
('55555555-5555-5555-5555-555555555554', '11111111-1111-1111-1111-111111111111', 'North Concourse',   'concourse', '1', true,  '{"routing_key":"north_concourse",  "x":"50%","y":"18%"}'),
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'South Concourse',   'concourse', '1', true,  '{"routing_key":"south_concourse",  "x":"50%","y":"78%"}'),
('55555555-5555-5555-5555-555555555556', '11111111-1111-1111-1111-111111111111', 'East Concourse',    'concourse', '1', true,  '{"routing_key":"east_concourse",   "x":"82%","y":"48%"}'),
('55555555-5555-5555-5555-555555555557', '11111111-1111-1111-1111-111111111111', 'West Concourse',    'concourse', '1', true,  '{"routing_key":"west_concourse",   "x":"18%","y":"48%"}'),
-- Level transitions
('55555555-5555-5555-5555-555555555558', '11111111-1111-1111-1111-111111111111', 'Escalator North',   'other',     '1', true,  '{"routing_key":"escalator_north",  "x":"50%","y":"26%"}'),
('55555555-5555-5555-5555-555555555559', '11111111-1111-1111-1111-111111111111', 'Escalator South',   'other',     '1', true,  '{"routing_key":"escalator_south",  "x":"50%","y":"70%"}'),
('55555555-5555-5555-5555-55555555555a', '11111111-1111-1111-1111-111111111111', 'Elevator East',     'other',     '1', true,  '{"routing_key":"elevator_east",    "x":"76%","y":"48%"}'),
-- Stands / Sections (level 2)
('55555555-5555-5555-5555-55555555555b', '11111111-1111-1111-1111-111111111111', 'Section 102',       'stand',     '2', true,  '{"routing_key":"section_102",      "x":"50%","y":"62%"}'),
('55555555-5555-5555-5555-55555555555c', '11111111-1111-1111-1111-111111111111', 'Section 214',       'stand',     '2', true,  '{"routing_key":"section_214",      "x":"32%","y":"32%"}'),
('55555555-5555-5555-5555-55555555555d', '11111111-1111-1111-1111-111111111111', 'Section 330',       'stand',     '2', false, '{"routing_key":"section_330",      "x":"68%","y":"32%"}');

-- Insert Amenities (tagged with routing keys)
INSERT INTO public.amenities (id, stadium_id, zone_id, name, amenity_type, is_accessible, status, metadata) VALUES
('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555554', 'Burger Grill',      'food',     true,  'active', '{"routing_key":"food_north",       "x":"45%","y":"18%"}'),
('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555554', 'Washroom (North)',  'washroom', true,  'active', '{"routing_key":"washroom_north",   "x":"55%","y":"18%"}'),
('66666666-6666-6666-6666-666666666663', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555556', 'Washroom (East)',   'washroom', true,  'active', '{"routing_key":"washroom_east",    "x":"82%","y":"40%"}'),
('66666666-6666-6666-6666-666666666664', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Food Court South',  'food',     true,  'active', '{"routing_key":"food_south",       "x":"42%","y":"78%"}'),
('66666666-6666-6666-6666-666666666665', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555556', 'Medical Station',   'medical',  true,  'active', '{"routing_key":"medical_station",  "x":"82%","y":"56%"}');

-- Insert Crowd Metrics
INSERT INTO public.crowd_metrics (match_id, zone_id, density_score, estimated_wait_minutes, footfall_count) VALUES
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555551', 0.2, 2,  500),
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', 0.8, 15, 2500),
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555554', 0.3, 3,  800);

-- Insert Queue Metrics
INSERT INTO public.queue_metrics (match_id, amenity_id, queue_score, estimated_wait_minutes) VALUES
('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', 0.4, 6),
('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666662', 0.1, 1),
('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666663', 0.2, 2),
('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666664', 0.6, 8),
('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666665', 0.0, 0);

-- Insert AI Recommendations
INSERT INTO public.ai_recommendations (match_id, stadium_id, recommendation_type, title, content, related_zone_id) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'routing', 'Gate B is crowded', 'Gate B is crowded. Use Gate A instead.', '55555555-5555-5555-5555-555555555551'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'facility', 'Washroom Wait Times', 'Nearest washroom in your zone has only a 1 min wait.', '55555555-5555-5555-5555-555555555554');

-- Disable RLS for MVP ease of testing without full auth
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stadiums DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_queries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations DISABLE ROW LEVEL SECURITY;
