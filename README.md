# StadiaOS

**A GenAI-powered Smart Stadium & Tournament Operations Platform**

StadiaOS is a real-time multi-agent platform designed for stadium operators, volunteers, and fans. It tackles the chaos of matchdays by predicting crowd pressure, coordinating incidents, optimizing staff deployment, and giving every fan a multilingual match-day assistant.

## Product Capabilities

### 📱 Fan App

- **Matchday Copilot**: A conversational AI that understands natural language ("where's the nearest washroom?", "take me to my seat").
- **Live Routing**: An indoor map and step-by-step route engine tailored to the stadium's topology, including accessible routes.
- **Incident Reporting**: Fast, AI-triaged incident reporting for emergencies or assistance.
- **Live Alerts**: Real-time broadcast advisories pushed directly from stadium operations.

### 🛡️ Ops Command Center

- **Live Aggregation Snapshot**: Real-time monitoring of open incidents, active advisories, congested gates, and high-queue facilities.
- **AI Triage Desk**: An operational queue where reported incidents are instantly analyzed by AI, assigning severity and summaries to speed up staff dispatch.
- **Advisory Broadcasting**: Allows ops managers to instantly publish public alerts that sync directly to the Fan App.
- **Crowd Operations**: Real-time wait times and density metrics for gates and amenities to direct operational flow.

## Architecture Highlights

- **Fan Copilot Pipeline**: LLM-driven intent extraction (using Groq) mapped to rigid, predictable domain resolvers.
- **Deterministic Routing**: A bespoke indoor graph pathfinding engine (Dijkstra) running over static routing keys to guarantee reliable fan directions without heavy GIS dependencies.
- **Realtime Sync**: Leverages Supabase Realtime to keep the Fan App and Ops Dashboard in perfect sync during live events.

For more deep-dives into how these systems are built, read [Architecture Guide](docs/ARCHITECTURE.md).

## How to Use the App

StadiaOS provides two distinct interfaces depending on your user role. The Identity Gateway (`/auth`) will automatically route you to the correct experience upon login.

### 📱 Fan Experience

To experience the app as a fan attending a match:

1. Open the application base URL (e.g., `http://localhost:5173/`). If you aren't logged in, you'll be redirected to the **Identity Gateway**.
2. log in as id- itsyourriyansh@gmail.com, Pass: 123123
3. Upon logging in, you'll land on the **Fan Dashboard**.
4. **Key Features to Explore:**
   - **Ticket & Map**: View your ticket and get step-by-step routing to your seat using the interactive indoor map (`/map`).
   - **stadios Copilot**: Tap "Ask Copilot" on the dashboard to chat with the AI (e.g., "Where is the nearest food?").
   - **Safety & Reporting**: Use the "Emergency & Support" quick actions to report an incident (like a blocked pathway or a medical emergency).

### 🛡️ Ops Command Center (Admin/Staff)

To experience the command center as stadium operations staff:

1. Navigate directly to the Ops Dashboard route (`/ops`).
2. Upon logging in, you'll access the **Ops Command Center**.
3. **Key Features to Explore:**
   - **AI Triage Desk**: Watch incidents reported by fans appear in real-time, complete with AI-generated summaries and suggested severity.
   - **Crowd Control**: Monitor active wait times and density metrics across the stadium gates and amenities.
   - **Resolution**: Assign response teams to active incidents and resolve them, syncing the updates back to the reporting fan.

## Quick Start

To get this project running locally on your machine with full mock data and GenAI integration:

1. Clone the repo and run `npm install`.
2. Follow the detailed environment setup in [Environment Setup](docs/ENV_SETUP.md) to configure Supabase and Groq.
3. Start the dev server with `npm run dev`.

## Evaluating the Platform

If you are evaluating this project, we highly recommend following our step-by-step demo script to see the real-time interaction between the Fan App and Ops Command Center.

👉 **Read the [Demo Flow Guide](docs/DEMO_FLOW.md)**
