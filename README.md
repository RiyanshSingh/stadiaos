# StadiaOS 🏟️

**An AI-powered smart stadium companion for sports fans — built at Hack2Skill Hackathon.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Overview

StadiaOS transforms the in-stadium experience by putting real-time intelligence in fans' hands. It helps you find your seat, navigate facilities, get live alerts, and report incidents — all powered by a conversational AI Copilot.

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── fan/          # All fan-facing views (FanDashboard, MapView, etc.)
│   └── ops/          # Ops Manager dashboard
├── components/
│   ├── layout/       # MobileFrame (responsive shell)
│   ├── shared/       # Reusable components (BottomNav, ErrorBoundary)
│   └── ui/           # Primitive UI components (Card, Avatar, etc.)
├── features/
│   └── fan-assistant/ # FanCopilot (AI chat interface)
├── services/          # Business logic and API clients
│   ├── __tests__/     # Unit & integration tests (Vitest)
│   ├── groq/          # Groq LLM client
│   ├── routing/       # Pathfinding (graph-based, Dijkstra-like)
│   └── supabase/      # Supabase client
├── store/             # Zustand global state
└── lib/
    ├── types/         # Shared TypeScript types & interfaces
    └── supabase.ts    # Typed Supabase client
```

---

## 🛡️ Security

- **Row Level Security (RLS)**: All Supabase tables are protected. Users can only access their own tickets, incidents, and queries. See `supabase/rls_policies.sql`.
- **Content Security Policy (CSP)**: Strict CSP headers are applied in `index.html`.
- **API Key Handling**: The Groq API key is held client-side only for the hackathon prototype. In production, this would be moved to a Supabase Edge Function.
- **Supabase Auth**: All protected routes require authentication via Supabase Auth.

---

## ♿ Accessibility

- All icon-only buttons and links have `aria-label` attributes.
- The navigation uses a semantic `<nav>` element.
- Main content pages use semantic `<main>` elements.
- The AI Copilot chat uses `role="log"` and `aria-live="polite"` for screen reader compatibility.
- A **skip to main content** link is available for keyboard users.

---

## 🧪 Testing

```bash
npm run test        # Run all tests (Vitest)
npm run test:watch  # Watch mode
```

**Test Coverage:**
- `routingService` — Pathfinding and graph algorithms (9 tests)
- `copilotIntentService` — Intent classification (3 tests)
- `copilotResolver` — End-to-end Copilot pipeline (4 tests)
- `incidentService` — Incident creation (2 tests)
- `facilityService` — Facility lookup (1 test)
- `alertService` — Alert fetching (1 test)
- `opsService` — Ops dashboard metrics (2 tests)
- `BottomNav` — UI component test (1 test)
- `MobileFrame` — UI component test (1 test)

---

## ⚡ Efficiency

- **Code Splitting**: All routes are lazily loaded via `React.lazy()` + `<Suspense>`, reducing initial bundle size.
- **Memoization**: Expensive static data in components is wrapped with `useMemo`.
- **Image Optimization**: Images use `loading="lazy"` for deferred loading.
- **Passive scroll listeners**: All scroll event listeners use `{ passive: true }` to prevent blocking the main thread.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GROQ_API_KEY

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Groq (Llama 3.1) |
| Testing | Vitest, React Testing Library |
| Routing | React Router v6 |

---

## 📄 License

MIT
