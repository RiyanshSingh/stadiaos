import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { FanDashboard } from '@/app/fan/FanDashboard' // keep dashboard eager for fast initial load
import { BottomNav } from '@/components/shared/BottomNav'
import { MobileFrame } from '@/components/layout/MobileFrame'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useAppStore } from '@/store/useAppStore'
import { useAuthService } from '@/services/authService'

const FanCopilot = lazy(() => import('@/features/fan-assistant/FanCopilot').then(m => ({ default: m.FanCopilot })))
const OpsDashboard = lazy(() => import('@/app/ops/OpsDashboard').then(m => ({ default: m.OpsDashboard })))
const ReportIncident = lazy(() => import('@/features/incidents/ReportIncident').then(m => ({ default: m.ReportIncident })))
const MapView = lazy(() => import('@/app/fan/MapView').then(m => ({ default: m.MapView })))
const ProfileView = lazy(() => import('@/app/fan/ProfileView').then(m => ({ default: m.ProfileView })))
const ProfileInfoView = lazy(() => import('@/app/fan/ProfileInfoView').then(m => ({ default: m.ProfileInfoView })))
const QueuesFacilitiesView = lazy(() => import('@/app/fan/QueuesFacilitiesView').then(m => ({ default: m.QueuesFacilitiesView })))
const LiveAlertsView = lazy(() => import('@/app/fan/LiveAlertsView').then(m => ({ default: m.LiveAlertsView })))
const NotificationsView = lazy(() => import('@/app/fan/NotificationsView').then(m => ({ default: m.NotificationsView })))
const MyReportsView = lazy(() => import('@/app/fan/MyReportsView').then(m => ({ default: m.MyReportsView })))
const SearchResultsView = lazy(() => import('@/app/fan/SearchResultsView').then(m => ({ default: m.SearchResultsView })))
const MatchCenterView = lazy(() => import('@/app/fan/MatchCenterView').then(m => ({ default: m.MatchCenterView })))
const TicketSeatView = lazy(() => import('@/app/fan/TicketSeatView').then(m => ({ default: m.TicketSeatView })))
const RouteDetailView = lazy(() => import('@/app/fan/RouteDetailView').then(m => ({ default: m.RouteDetailView })))
const FacilityDetailView = lazy(() => import('@/app/fan/FacilityDetailView').then(m => ({ default: m.FacilityDetailView })))
const VenueInfoView = lazy(() => import('@/app/fan/VenueInfoView').then(m => ({ default: m.VenueInfoView })))
const AccessibilityAssistanceView = lazy(() => import('@/app/fan/AccessibilityAssistanceView').then(m => ({ default: m.AccessibilityAssistanceView })))
const SavedRecentView = lazy(() => import('@/app/fan/SavedRecentView').then(m => ({ default: m.SavedRecentView })))
const SettingsView = lazy(() => import('@/app/fan/SettingsView').then(m => ({ default: m.SettingsView })))
const AuthView = lazy(() => import('@/app/auth/AuthView').then(m => ({ default: m.AuthView })))
const OnboardingView = lazy(() => import('@/app/auth/OnboardingView').then(m => ({ default: m.OnboardingView })))
const TicketSetupView = lazy(() => import('@/app/fan/TicketSetupView').then(m => ({ default: m.TicketSetupView })))
const OpsAuthView = lazy(() => import('@/app/auth/OpsAuthView').then(m => ({ default: m.OpsAuthView })))

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
  const { isInitialized, userId, role } = useAuthService();
  const { ticket, hasBootstrapped } = useAppStore();
  const location = useLocation();

  if (!isInitialized) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-white/20" /></div>;
  }

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
  const { isInitialized, userId, role } = useAuthService();
  
  if (!isInitialized) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-white/20" /></div>;
  }
  
  if (!userId || role !== 'ops_manager') {
    return <Navigate to="/opsauth" state={{ from: { pathname: '/ops' } }} replace />;
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
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-white/20" /></div>}>
        <Routes location={location} key={location.pathname}>
        {/* Public Access Routes */}
        <Route path="/onboarding" element={<OnboardingView />} />
        <Route path="/auth" element={<AuthView />} />
        <Route path="/opsauth" element={<OpsAuthView />} />
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
        <Route element={<ProtectedOpsRoute />}>
          <Route path="/ops" element={<PageWrapper><OpsDashboard /></PageWrapper>} />
        </Route>
        
        {/* Catch-all to redirect invalid routes (like the old /setup) to the dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

function App() {
  const { initSupabase, loadBootstrap, profile: _profile } = useAppStore()
  const { initAuth } = useAuthService()
  const { userId, stadiumId: _stadiumId, role } = useAuthService()

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
        {/* Skip to content link for keyboard / screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-full focus:font-semibold focus:text-sm"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <MobileFrame>
            <div id="main-content">
              <AnimatedRoutes />
            </div>
          </MobileFrame>
        </ErrorBoundary>
      </div>
    </Router>
  )
}

export default App
