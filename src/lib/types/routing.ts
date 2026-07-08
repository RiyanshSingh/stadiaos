// ─── Route Mode ──────────────────────────────────────────────────────────────
export type RouteMode = 'standard' | 'accessible';

// ─── Graph primitives ─────────────────────────────────────────────────────────
export type EdgeType = 'walk' | 'escalator' | 'elevator' | 'stairs' | 'ramp';

export interface RouteNode {
  /** Stable semantic key matching metadata.routing_key in the DB */
  routingKey: string;
  /** DB UUID, populated after DB fetch */
  id: string;
  label: string;
  level: string;
  x: string; // CSS-percent string, e.g. "45%"
  y: string;
  accessible: boolean;
}

export interface RouteEdge {
  fromKey: string;
  toKey: string;
  distanceMeters: number;
  type: EdgeType;
  /** If false this edge is skipped in accessible mode */
  accessible: boolean;
}

export interface RouteGraph {
  nodes: Map<string, RouteNode>; // keyed by routingKey
  edges: RouteEdge[];
}

// ─── Source strategy ─────────────────────────────────────────────────────────
export type RouteSourceStrategy =
  | { kind: 'ticket_seat' }                         // resolve from bootstrap ticket
  | { kind: 'zone'; routingKey: string }
  | { kind: 'amenity'; routingKey: string }
  | { kind: 'gate'; name: string }
  | { kind: 'label'; label: string };               // fuzzy label from Copilot

export type RouteDestinationStrategy =
  | { kind: 'zone'; routingKey: string }
  | { kind: 'amenity'; routingKey: string }
  | { kind: 'gate'; name: string }
  | { kind: 'ticket_seat' }
  | { kind: 'label'; label: string };

// ─── Route request ────────────────────────────────────────────────────────────
export interface RouteRequest {
  source: RouteSourceStrategy;
  destination: RouteDestinationStrategy;
  mode: RouteMode;
}

// ─── Route result ─────────────────────────────────────────────────────────────
export interface RouteStep {
  instruction: string;
  distance: string;
  type: EdgeType | 'arrive';
}

export interface RouteResult {
  ok: true;
  sourceLabel: string;
  destinationLabel: string;
  etaMinutes: number;
  distanceMeters: number;
  routeMode: RouteMode;
  steps: RouteStep[];
  pathNodeKeys: string[];
  polyline: { x: string; y: string }[];
}

export interface RouteError {
  ok: false;
  reason: string;
}

export type RouteOutcome = RouteResult | RouteError;
