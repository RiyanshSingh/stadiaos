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
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Public Read-Only Tables (Stadiums, Matches, Zones, Amenities, Routes, Knowledge)
-- Anyone can read these, but only admins/ops can modify (updates restricted to service role for now)
CREATE POLICY "Public read access for stadiums" ON public.stadiums FOR SELECT USING (true);
CREATE POLICY "Public read access for matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read access for zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Public read access for amenities" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "Public read access for routes" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Public read access for knowledge_articles" ON public.knowledge_articles FOR SELECT USING (true);

-- 3. Tickets
-- Fans can only see their own tickets.
CREATE POLICY "Users can view own tickets" 
ON public.tickets FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Incidents & Incident Updates
-- Fans can view and insert their own incidents. 
CREATE POLICY "Users can insert own incidents" 
ON public.incidents FOR INSERT 
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view own incidents" 
ON public.incidents FOR SELECT 
USING (auth.uid() = reported_by);

CREATE POLICY "Users can view own incident updates" 
ON public.incident_updates FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.incidents 
    WHERE incidents.id = incident_updates.incident_id 
    AND incidents.reported_by = auth.uid()
  )
);

-- 5. Metrics & AI Recommendations
-- Read only for public/authenticated
CREATE POLICY "Public read access for crowd_metrics" ON public.crowd_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for queue_metrics" ON public.queue_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for ai_recommendations" ON public.ai_recommendations FOR SELECT USING (true);

-- 6. Fan Queries
-- Users can insert and read their own queries
CREATE POLICY "Users can insert own queries" 
ON public.fan_queries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own queries" 
ON public.fan_queries FOR SELECT 
USING (auth.uid() = user_id);
