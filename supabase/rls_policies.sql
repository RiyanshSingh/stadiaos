-- =========================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stadiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
-- Users can read and update their own profile. Ops/Admin can read all.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Public Read-Only Tables (Stadiums, Matches, Zones, Amenities, Routes, Knowledge)
-- Anyone can read these, but only admins/ops can modify (updates restricted to service role for now)
DROP POLICY IF EXISTS "Public read access for stadiums" ON public.stadiums;
CREATE POLICY "Public read access for stadiums" ON public.stadiums FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access for matches" ON public.matches;
CREATE POLICY "Public read access for matches" ON public.matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access for zones" ON public.zones;
CREATE POLICY "Public read access for zones" ON public.zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access for amenities" ON public.amenities;
CREATE POLICY "Public read access for amenities" ON public.amenities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access for routes" ON public.routes;
CREATE POLICY "Public read access for routes" ON public.routes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access for knowledge_articles" ON public.knowledge_articles;
CREATE POLICY "Public read access for knowledge_articles" ON public.knowledge_articles FOR SELECT USING (true);

-- 3. Tickets
-- Fans can only see their own tickets.
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
CREATE POLICY "Users can insert own tickets" ON public.tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Incidents & Incident Updates
-- Fans can view and insert their own incidents. 
DROP POLICY IF EXISTS "Users can insert own incidents" ON public.incidents;
CREATE POLICY "Users can insert own incidents" ON public.incidents FOR INSERT 
WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can view own incidents" ON public.incidents;
CREATE POLICY "Users can view own incidents" ON public.incidents FOR SELECT 
USING (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can view own incident updates" ON public.incident_updates;
CREATE POLICY "Users can view own incident updates" ON public.incident_updates FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.incidents 
    WHERE incidents.id = incident_updates.incident_id 
    AND incidents.reported_by = auth.uid()
  )
);

-- Ops Manager Incident Policies
DROP POLICY IF EXISTS "Ops can view all incidents" ON public.incidents;
CREATE POLICY "Ops can view all incidents" ON public.incidents FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ops_manager')
);

DROP POLICY IF EXISTS "Ops can update all incidents" ON public.incidents;
CREATE POLICY "Ops can update all incidents" ON public.incidents FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ops_manager')
);

DROP POLICY IF EXISTS "Ops can view incident updates" ON public.incident_updates;
CREATE POLICY "Ops can view incident updates" ON public.incident_updates FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ops_manager')
);

DROP POLICY IF EXISTS "Ops can insert incident updates" ON public.incident_updates;
CREATE POLICY "Ops can insert incident updates" ON public.incident_updates FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ops_manager')
);

-- 5. Metrics & AI Recommendations
-- Read only for public/authenticated
DROP POLICY IF EXISTS "Public read access for crowd_metrics" ON public.crowd_metrics;
CREATE POLICY "Public read access for crowd_metrics" ON public.crowd_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access for queue_metrics" ON public.queue_metrics;
CREATE POLICY "Public read access for queue_metrics" ON public.queue_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access for ai_recommendations" ON public.ai_recommendations;
CREATE POLICY "Public read access for ai_recommendations" ON public.ai_recommendations FOR SELECT USING (true);

-- Ops Manager AI Recommendations Policies
DROP POLICY IF EXISTS "Ops can insert ai_recommendations" ON public.ai_recommendations;
CREATE POLICY "Ops can insert ai_recommendations" ON public.ai_recommendations FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ops_manager')
);

-- 6. Fan Queries
-- Users can insert and read their own queries
DROP POLICY IF EXISTS "Users can insert own queries" ON public.fan_queries;
CREATE POLICY "Users can insert own queries" ON public.fan_queries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own queries" ON public.fan_queries;
CREATE POLICY "Users can view own queries" ON public.fan_queries FOR SELECT 
USING (auth.uid() = user_id);
