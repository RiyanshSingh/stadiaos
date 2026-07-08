const fs = require('fs');
const content = `import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { FanDashboard } from '@/app/fan/FanDashboard'
import { FanCopilot } from '@/features/fan-assistant/FanCopilot'
import { OpsDashboard } from '@/app/ops/OpsDashboard'
import { ReportIncident } from '@/features/incidents/ReportIncident'
import { BottomNav } from '@/components/shared/BottomNav'
import { useAppStore } from '@/store/useAppStore'
import { useAuthService } from '@/services/authService'
import { MapView } from '@/app/fan/MapView'
import { ProfileView } from '@/app/fan/ProfileView'
import { QueuesFacilitiesView } from '@/app/fan/QueuesFacilitiesView'
import { LiveAlertsView } from '@/app/fan/LiveAlertsView'
import { NotificationsView } from '@/app/fan/NotificationsView'
import { MyReportsView } from '@/app/fan/MyReportsView'
import { SearchResultsView } from '@/app/fan/SearchResultsView'
import { MatchCenterView } from '@/app/fan/MatchCenterView'
import { TicketSeatView } from '@/app/fan/TicketSeatView'
import { RouteDetailView } from '@/app/fan/RouteDetailView'
import { FacilityDetailView } from '@/app/fan/FacilityDetailView'
import { VenueInfoView } from '@/app/fan/VenueInfoView'
import { AccessibilityAssistanceView } from '@/app/fan/AccessibilityAssistanceView'
import { SavedRecentView } from '@/app/fan/SavedRecentView'
import { SettingsView } from '@/app/fan/SettingsView'
import { FanAccessView } from '@/app/auth/FanAccessView'
import { OpsAccessView } from '@/app/auth/OpsAccessView'

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}

function ProtectedFanRoute() {
  const { userId, role } = useAuthService();
  if (!userId || role !== 'fan') {
    return <Navigate to="/access" replace />;
  }
  return <Outlet />;
}

function ProtectedOpsRoute() {
  const { userId, role } = useAuthService();
  if (!userId || role !== 'ops_manager') {
    return <Navigate to="/ops/access" replace />;
  }
  return <Outlet />;
}

function FanLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Access Routes */}
        <Route path="/access" element={<FanAccessView />} />
        <Route path="/ops/access" element={<OpsAccessView />} />

        {/* Protected Fan Surface */}
        <Route element={<ProtectedFanRoute />}>
          <Route element={<FanLayout />}>
            {/* Primary Pages */}
            <Route path="/" element={<PageWrapper><FanDashboard /></PageWrapper>} />
            <Route path="/map" element={<PageWrapper><MapView /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><ProfileView /></PageWrapper>} />

            {/* Secondary Pages */}
            <Route path="/report" element={<PageWrapper><ReportIncident /></PageWrapper>} />
            <Route path="/alerts" element={<PageWrapper><LiveAlertsView /></PageWrapper>} />
            <Route path="/facilities" element={<PageWrapper><QueuesFacilitiesView /></PageWrapper>} />
            <Route path="/match" element={<PageWrapper><MatchCenterView /></PageWrapper>} />
            <Route path="/ticket" element={<PageWrapper><TicketSeatView /></PageWrapper>} />
            <Route path="/route/:id" element={<PageWrapper><RouteDetailView /></PageWrapper>} />
            <Route path="/route/detail" element={<PageWrapper><RouteDetailView /></PageWrapper>} />
            <Route path="/facility/:id" element={<PageWrapper><FacilityDetailView /></PageWrapper>} />
            <Route path="/search" element={<PageWrapper><SearchResultsView /></PageWrapper>} />
            <Route path="/my-reports" element={<PageWrapper><MyReportsView /></PageWrapper>} />
            <Route path="/notifications" element={<PageWrapper><NotificationsView /></PageWrapper>} />
            <Route path="/venue-info" element={<PageWrapper><VenueInfoView /></PageWrapper>} />
            <Route path="/accessibility" element={<PageWrapper><AccessibilityAssistanceView /></PageWrapper>} />
            <Route path="/saved" element={<PageWrapper><SavedRecentView /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsView /></PageWrapper>} />
          </Route>

          {/* Fan Surface - No Bottom Nav */}
          <Route path="/copilot" element={<PageWrapper><FanCopilot /></PageWrapper>} />
        </Route>

        {/* Protected Ops Surface */}
        <Route element={<ProtectedOpsRoute />}>
          <Route path="/ops" element={<PageWrapper><OpsDashboard /></PageWrapper>} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const { initSupabase, loadBootstrap, profile } = useAppStore()
  const { userId, stadiumId, role } = useAuthService()

  useEffect(() => {
    initSupabase()
  }, [initSupabase])

  useEffect(() => {
    // Only hydrate fan data if logged in as fan.
    // Ops uses separate queries mostly, but we can load profile for ops too if needed.
    // For now, loadBootstrap resolves everything for the fan.
    // Wait, loadBootstrap currently requires stadiumId. 
    // In our new flow, we might not have stadiumId in auth state for fan immediately, 
    // bootstrapService fetches it implicitly or needs adjusting? 
    // Wait, authService fan login doesn't set stadiumId.
    // Let's modify bootstrapService to NOT need stadiumId if we just fetch from the ticket!
    // We will fix bootstrapService separately.
    if (userId) {
      // Pass empty string for stadiumId for now, we'll fix bootstrapService to handle it.
      loadBootstrap(userId, stadiumId || '');
    }
  }, [loadBootstrap, userId, stadiumId])

  return (
    <Router>
      <div className="dark bg-background min-h-screen text-foreground font-sans selection:bg-white/30 selection:text-white">
        <AnimatedRoutes />
      </div>
    </Router>
  )
}

export default App
`;

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
