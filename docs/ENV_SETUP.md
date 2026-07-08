# Environment Setup

This guide will walk you through setting up StadiaOS locally, including configuring the required external services (Supabase and Groq) and seeding the database.

## Prerequisites
- Node.js (v18+)
- npm
- A free [Supabase](https://supabase.com/) account
- A free [Groq](https://groq.com/) API key (for fast LLM inference)

## 1. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Populate `.env` with the following:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

*Note: If you do not provide a Groq API key, the Copilot will fall back to a local mock implementation, but natural language routing will be degraded.*

## 2. Supabase Setup & Seeding
StadiaOS relies heavily on Supabase for data and real-time syncing. 

### Create the Schema
1. Open your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Copy the contents of `schema.sql` (located in the root of this repo) and run it. This will create all necessary tables, enums, and indexes.

### Seed the Data (Crucial)
1. In the same **SQL Editor**, copy the contents of `seed.sql` and run it.
2. **Why this is important:** The seed file creates the mock stadium (`stad-1`), the active match (`match-1`), all the routing zones (gates, concourses, sections), amenity locations, and the simulated mock metrics for queues and crowd density. Without this, the dashboard will be entirely empty and routing will fail.

## 3. Start the Application
Run the development server:
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

## A Note on Authentication (MVP)
For this MVP release, we have intentionally bypassed real JWT-based authentication to make evaluating and demoing the product as frictionless as possible. 

Behind the scenes, `src/services/authService.ts` automatically mocks the active user ID depending on the surface you are viewing (Fan vs Ops). This means you do not need to create accounts or log in to test the application flows.
