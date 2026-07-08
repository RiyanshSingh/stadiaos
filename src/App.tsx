import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { FanDashboard } from '@/app/fan/FanDashboard'
import { FanCopilot } from '@/features/fan-assistant/FanCopilot'
import { OpsDashboard } from '@/app/ops/OpsDashboard'
import { ReportIncident } from '@/features/incidents/ReportIncident'
import { BottomNav } from '@/components/shared/BottomNav'
import { MobileFrame } from '@/components/layout/MobileFrame'
import { useAppStore } from '@/store/useAppStore'
import { useAuthService } from '@/services/authService'
import { MapView } from '@/app/fan/MapView'
import { ProfileView } from '@/app/fan/ProfileView'
import { ProfileInfoView } from '@/app/fan/ProfileInfoView'
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
import { AuthView } from '@/app/auth/AuthView'
import { OnboardingView } from '@/app/auth/OnboardingView'
import { TicketSetupView } from '@/app/fan/TicketSetupView'

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
  const { ticket, hasBootstrapped } = useAppStore();
  const location = useLocation();

  if (!userId || role !== 'fan') {
    return <Navigate to="/auth" replace />;
  }
  
  if (!hasBootstrapped) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-white/20" /></div>;
  }
  
  // If no ticket, force them to ticket setup
  if (!ticket && location.pathname !== '/ticket-setup') {
    return <Navigate to="/ticket-setup" replace />;
  }

  return <Outlet />;
}



function ProtectedOpsRoute() {
  const { userId, role } = useAuthService();
  if (!userId || role !== 'ops_manager') {
    return <Navigate to="/auth" state={{ from: { pathname: '/ops' } }} replace />;
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
        <Route path="/onboarding" element={<OnboardingView />} />
        <Route path="/auth" element={<AuthView />} />
        <Route element={<ProtectedFanRoute />}><Route path="/ticket-setup" element={<PageWrapper><TicketSetupView /></PageWrapper>} /></Route>

        {/* Protected Fan Surface */}
        <Route element={<ProtectedFanRoute />}>
          {/* Main tabs with Bottom Nav */}
          <Route element={<FanLayout />}>
            <Route path="/" element={<PageWrapper><FanDashboard /></PageWrapper>} />
            <Route path="/map" element={<PageWrapper><MapView /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><ProfileView /></PageWrapper>} />
          </Route>

          {/* Secondary Pages - No Bottom Nav */}
          <Route path="/profile/info" element={<PageWrapper><ProfileInfoView /></PageWrapper>} />
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
          <Route path="/copilot" element={<PageWrapper><FanCopilot /></PageWrapper>} />
        </Route>

        {/* Ops Surface */}
        <Route path="/ops" element={<PageWrapper><OpsDashboard /></PageWrapper>} />
        
        {/* Catch-all to redirect invalid routes (like the old /setup) to the dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const { initSupabase, loadBootstrap, profile } = useAppStore()
  const { initAuth } = useAuthService()
  const { userId, stadiumId, role } = useAuthService()

  useEffect(() => {
    initSupabase()
    initAuth()
  }, [initSupabase, initAuth])

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
    if (userId && role === 'fan') {
      loadBootstrap(userId);
    }
  }, [loadBootstrap, userId, role])

  return (
    <Router>
      <div className="dark bg-black min-h-screen text-foreground font-sans selection:bg-white/30 selection:text-white">
        <MobileFrame>
          <AnimatedRoutes />
        </MobileFrame>
      </div>
    </Router>
  )
}

export default App
