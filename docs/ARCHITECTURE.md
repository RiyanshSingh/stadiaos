# StadiaOS Architecture Guide

StadiaOS is a multi-surface platform built on a React/Vite frontend, a Supabase backend (PostgreSQL + Realtime), and Groq for fast LLM inference. 

This document explains the core technical architectures of the platform.

## 1. Surfaces
- **Fan Surface**: A mobile-first UI designed with strict monochrome glassmorphism. It uses mock-auth to simulate a specific fan (`MOCK_IDS.fanId`). It consumes services to render live data, routes, and alerts.
- **Ops Surface (`/ops`)**: A desktop-oriented Command Center for stadium operators. It aggregates data across domains and allows mutations (like triage updates and advisory publishing) using the `MOCK_IDS.opsManagerId`.

## 2. Service-Layer Architecture
We use a domain-driven service layer (Zustand + pure async functions) to decouple UI components from direct database queries:
- `incidentService.ts`: The absolute source of truth for incident creation and triage mutations.
- `alertService.ts`: Merges fan-safe incidents and ops-authored advisories into a single stream.
- `facilityService.ts` / `queueService.ts`: Handles amenity lookups and queue wait times.
- `opsService.ts`: An aggregation layer exclusively for the Command Center, preventing Ops logic from bleeding into core fan services.

## 3. Copilot Pipeline
The Fan Copilot (`FanCopilot.tsx`) is not a generic chatbot. It is a strictly bounded orchestrator:

1. **Intent Extraction**: User input is sent to `copilotIntentService.ts`. We use Groq (Llama-3) to extract a structured JSON schema representing a specific intent (e.g., `FACILITY_LOOKUP`, `ROUTE_HANDOFF`, `INCIDENT_DRAFT`).
2. **Resolution**: `copilotResolver.ts` takes the structured intent and queries the real domain services (like `facilityService` or `routingService`).
3. **Card Rendering**: The resolver returns a specific UI Card payload (not raw text), which the Copilot component renders interactively.

This architecture ensures the LLM never hallucinates stadium facts or routes—it acts purely as a semantic router.

## 4. Deterministic Routing Pipeline
To provide reliable, accessible indoor routing without complex GIS dependencies or database migrations, we built a bespoke routing engine:

1. **Routing Keys**: Zones and amenities in `seed.sql` have a semantic `routing_key` in their metadata (e.g., `gate_a`, `section_214`).
2. **Static Topology (`venueGraph.ts`)**: We maintain a static JSON adjacency list defining the physical connections between these semantic keys (including whether an edge requires stairs).
3. **Hydration**: `mapService.ts` fetches real coordinates from the DB and merges them with the static topology to build the runtime graph.
4. **Resolution (`nodeResolver.ts`)**: Converts abstract requests (e.g., "my seat", "nearest washroom") into explicit routing keys.
5. **Pathfinding (`routingService.ts`)**: Runs Dijkstra's algorithm over the graph. In `accessible` mode, it skips any edge flagged with stairs, ensuring reliable wheelchair routing.

## 5. Ops Incident & Advisory Flow
- **Incidents**: When a fan submits an incident via Copilot, it is inserted into the `incidents` table. Supabase Realtime triggers the `ops_incidents` channel, updating the Ops Triage desk instantly. Ops mutations (assigning teams, resolving) log chronologically to `incident_updates`.
- **Advisories**: When Ops publishes an advisory, it is saved in the `ai_recommendations` table with the type `public_advisory`. This keeps ops broadcasts logically separated from the incident triage queue, while `alertService.ts` seamlessly merges them into the fan's alert feed.
