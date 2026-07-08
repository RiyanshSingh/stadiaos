export type UserRole = 'fan' | 'staff' | 'ops_manager' | 'admin';
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'acknowledged' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  preferred_language: string;
}

export interface Match {
  id: string;
  stadium_id: string;
  title: string;
  status: MatchStatus;
  start_time: string;
  home_team?: string;
  away_team?: string;
  stadium_name?: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  match_id: string;
  seat_section: string;
  seat_row: string;
  seat_number: string;
  gate?: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  updated_by: string;
  old_status: IncidentStatus | null;
  new_status: IncidentStatus | null;
  note: string;
  created_at: string;
}

export interface Incident {
  id: string;
  match_id: string;
  stadium_id: string;
  reported_by: string;
  reporter_role: string;
  title: string;
  description: string;
  incident_type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  zone_id?: string;
  assigned_team?: string;
  ai_summary?: string;
  created_at: string;
  updates?: IncidentUpdate[]; // Joined relation
}

export interface Zone {
  id: string;
  stadium_id: string;
  name: string;
  zone_type: string;
  level: string;
  is_accessible: boolean;
  metadata?: any;
}

export interface Amenity {
  id: string;
  stadium_id: string;
  zone_id: string;
  name: string;
  amenity_type: string;
  is_accessible: boolean;
  status: string;
  metadata?: any;
  zone?: Zone; // Joined
}

export interface CrowdMetric {
  id: string;
  match_id: string;
  zone_id: string;
  density_score: number;
  estimated_wait_minutes: number;
  footfall_count: number;
  captured_at: string;
  zone?: Zone; // Joined
}

export interface QueueMetric {
  id: string;
  match_id: string;
  amenity_id: string;
  queue_score: number;
  estimated_wait_minutes: number;
  captured_at: string;
}

export interface AiRecommendation {
  id: string;
  match_id: string;
  stadium_id: string;
  recommendation_type: string;
  title: string;
  content: string;
  related_zone_id?: string;
  created_at: string;
}
