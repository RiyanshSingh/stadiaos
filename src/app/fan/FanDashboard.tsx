import React, { useEffect, useState, useMemo } from 'react'
import { Bell, Search, MapPin, Coffee, AlertTriangle, ShieldAlert, HeartPulse, History, Navigation, Map, Ticket, UserSearch, Accessibility } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/store/useAppStore'
import { dashboardService } from '@/services/dashboardService'
import type { GateStatus } from '@/services/dashboardService'
import type { AiRecommendation } from '@/lib/types/domain'
import { alertService } from '@/services/alertService'

type LiveStatusCard = { id: string; title: string; value: string; subtext: string; icon: any; route: string; type: 'alert' | 'success' | 'neutral' }
type QuickAction = { label: string; icon: any; path: string }
type RecentItem = { label: string; subtext: string; icon: any; path: string }

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export function FanDashboard() {
  const { profile, match, ticket } = useAppStore()
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([])
  const [gateStatus, setGateStatus] = useState<GateStatus[]>([])
  const [activeAlertsCount, setActiveAlertsCount] = useState(0)
  const [liveStatusCards, setLiveStatusCards] = useState<LiveStatusCard[]>([])

  useEffect(() => {
    if (match?.id) {
      dashboardService.getDashboardRecommendations(match.id).then(setRecommendations)
      dashboardService.getDashboardGateStatus(match.id).then(setGateStatus)
      alertService.fetchActiveAlerts(match.id).then(alerts => {
        setActiveAlertsCount(alerts.length)
      })
      
      dashboardService.getLiveStatusCards(match.id).then((data) => {
        const cards: LiveStatusCard[] = []
        if (data.gate) {
          cards.push({ id: 'gate', title: `${data.gate.gate} Congestion`, value: data.gate.crowd, subtext: `${data.gate.waitTime}m wait`, icon: DoorIcon, route: '/map', type: data.gate.crowd === 'Low' ? 'success' : 'alert' })
        } else {
          cards.push({ id: 'gate', title: 'Gate C Congestion', value: 'Low', subtext: 'Recommended Exit', icon: DoorIcon, route: '/map', type: 'success' })
        }

        if (data.food) {
          cards.push({ id: 'food', title: 'Nearest Food', value: `${data.food.estimated_wait_minutes}m`, subtext: data.food.amenities?.name || 'Concession', icon: Coffee, route: '/facilities', type: 'success' })
        } else {
          cards.push({ id: 'food', title: 'Nearest Food', value: '6m', subtext: 'Concession B', icon: Coffee, route: '/facilities', type: 'alert' })
        }

        if (data.washroom) {
          cards.push({ id: 'washroom', title: 'Nearest Washroom', value: `${data.washroom.estimated_wait_minutes}m`, subtext: data.washroom.amenities?.name || 'Washroom', icon: UserIcon, route: '/facilities', type: 'success' })
        } else {
          cards.push({ id: 'washroom', title: 'Nearest Washroom', value: '2m', subtext: 'Section 210', icon: UserIcon, route: '/facilities', type: 'success' })
        }
        
        cards.push({ id: 'time', title: 'Match Time', value: '65\'', subtext: '2nd Half', icon: ClockIcon, route: '/match', type: 'neutral' })
        
        setLiveStatusCards(cards)
      })
    }
  }, [match?.id])

  const state = React.useMemo(() => ({
    unreadNotificationsCount: 2,
    
    quickActions: [
      { label: 'Route to Seat', icon: Navigation, path: '/route/seat' },
      { label: 'Nearest Food', icon: Coffee, path: '/facilities' },
      { label: 'Nearest Washroom', icon: UserIcon, path: '/facilities' },
      { label: 'Exit Route', icon: Map, path: '/route/exit' },
      { label: 'Medical Help', icon: HeartPulse, path: '/report' },
      { label: 'Accessible Route', icon: Accessibility, path: '/map' }
    ] as QuickAction[],

    recentActivity: [
      { label: 'Match Ticket', subtext: 'Section 214', icon: Ticket, path: '/ticket' },
      { label: 'Open Incident', subtext: '10 mins ago', icon: History, path: '/my-reports' },
      { label: 'Saved Route', subtext: 'To Parking', icon: MapPin, path: '/saved' }
    ] as RecentItem[]
  }), [])

  return (
    <div className="min-h-screen bg-black text-white pb-32 px-6 pt-12 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative z-10 space-y-10">
        
        {/* A. Header / Seat Context */}
        <motion.header variants={itemVariants} className="flex justify-between items-center">
          <Link to="/profile" className="flex items-center gap-2 mt-0.5">
            {ticket ? (
              <>
                <div className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 flex items-baseline">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold mr-1.5">Sec</span>
                  <span className="text-lg font-bold tracking-tight text-white">{ticket.seat_section}</span>
                </div>
                <div className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 flex items-baseline">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold mr-1.5">Row</span>
                  <span className="text-lg font-bold tracking-tight text-white">{ticket.seat_row || '-'}</span>
                </div>
                <div className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 flex items-baseline">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold mr-1.5">Seat</span>
                  <span className="text-lg font-bold tracking-tight text-white">{ticket.seat_number || '-'}</span>
                </div>
              </>
            ) : (
              <h1 className="text-xl font-semibold tracking-tight text-white/50">No Active Ticket</h1>
            )}
          </Link>
          <div className="flex gap-2">
            <Link to="/alerts" className="relative p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <AlertTriangle className="w-4 h-4 text-white/70" />
              {activeAlertsCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
            </Link>
            <Link to="/notifications" className="relative p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4 text-white/70" />
              {state.unreadNotificationsCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
            </Link>
          </div>
        </motion.header>

        {/* B. Match Status Hero */}
        <motion.section variants={itemVariants} className="pt-2 pb-1">
          <Link to="/match" className="block group">
            <h2 className="text-[2.5rem] font-semibold leading-[1.05] tracking-tight mb-3">
              Match is <span className="text-white">{match?.status === 'live' ? 'Live.' : 'Upcoming.'}</span><br />
              <span className="text-white/50">Enjoy the game.</span>
            </h2>
            <div className="flex items-center gap-2.5 text-[13px] text-white/40 font-medium tracking-tight">
              <span className="text-white/80">{match?.title || 'Unknown Match'}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>{match?.home_team ? `${match.home_team} vs ${match.away_team}` : 'Luzhniki Stadium'}</span>
            </div>
          </Link>
        </motion.section>

        {/* C. Global Search / Ask Copilot */}
        <motion.section variants={itemVariants}>
          <Link to="/copilot" className="relative block group">
            <Search className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors pointer-events-none" />
            <div className="w-full pl-11 pr-4 h-12 bg-white/5 border border-white/10 rounded-full flex items-center text-white/40 text-[15px] font-medium tracking-tight group-hover:bg-white/10 group-hover:border-white/20 transition-all backdrop-blur-md shadow-sm relative z-0">
              Ask Copilot
            </div>
          </Link>
        </motion.section>

        {/* D. Live Status Cards */}
        <motion.section variants={itemVariants}>
          <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Live Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {liveStatusCards.map((card) => (
              <Link key={card.id} to={card.route}>
                <Card className="glass-card p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-colors h-full flex flex-col justify-between rounded-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">{card.title}</p>
                    <div className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 group-hover:text-white/80 transition-colors shrink-0">
                      <card.icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[22px] font-bold tracking-tight leading-none mb-1 text-white">{card.value}</p>
                    <p className="text-xs text-white/40 font-medium tracking-tight">{card.subtext}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* E. Quick Navigation */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Quick Actions</h3>
            <Link to="/map" className="flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">
              Open Map <Navigation className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {state.quickActions.map((action, idx) => (
              <Link key={idx} to={action.path}>
                <Card className="glass-card p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center text-center gap-3 h-28 rounded-2xl">
                  <action.icon className="w-6 h-6 text-white/50" strokeWidth={1.5} />
                  <span className="font-medium tracking-tight text-[11px] text-white/70 leading-tight">{action.label}</span>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* F. Need Help / Emergency Actions */}
        <motion.section variants={itemVariants}>
          <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Emergency & Support</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/report">
              <Card className="glass-card p-3.5 border border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/40 transition-all flex items-center gap-3 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-[13px] text-slate-300 tracking-tight">Report Incident</span>
              </Card>
            </Link>
            <Link to="/report">
              <Card className="glass-card p-3.5 border border-rose-900/30 bg-rose-950/20 hover:bg-rose-950/40 transition-all flex items-center gap-3 rounded-2xl">
                <HeartPulse className="w-4 h-4 text-rose-400/80" />
                <span className="font-semibold text-[13px] text-rose-300/90 tracking-tight">Medical Help</span>
              </Card>
            </Link>
            <Link to="/report">
              <Card className="glass-card p-3.5 border border-amber-900/30 bg-amber-950/20 hover:bg-amber-950/40 transition-all flex items-center gap-3 rounded-2xl">
                <ShieldAlert className="w-4 h-4 text-amber-400/80" />
                <span className="font-semibold text-[13px] text-amber-300/90 tracking-tight">Security Issue</span>
              </Card>
            </Link>
            <Link to="/report">
              <Card className="glass-card p-3.5 border border-indigo-900/30 bg-indigo-950/20 hover:bg-indigo-950/40 transition-all flex items-center gap-3 rounded-2xl">
                <UserSearch className="w-4 h-4 text-indigo-400/80" />
                <span className="font-semibold text-[13px] text-indigo-300/90 tracking-tight">Lost Person</span>
              </Card>
            </Link>
          </div>
        </motion.section>

        {/* G. Smart Recommendations */}
        <motion.section variants={itemVariants}>
          <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">AI Recommendations</h3>
          <div className="space-y-2">
            {recommendations.length > 0 ? recommendations.map((rec) => (
              <Link key={rec.id} to={`/map`} className="block">
                <Card className="glass-card px-4 py-3.5 border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex items-start gap-3 rounded-xl">
                  <div className="mt-1.5 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <p className="text-[13px] text-white/70 leading-relaxed font-medium tracking-tight pr-4">{rec.content}</p>
                </Card>
              </Link>
            )) : (
              <p className="text-white/30 text-[13px] font-medium px-1">No active recommendations right now.</p>
            )}
          </div>
        </motion.section>

        {/* H. Recent Activity / Continue */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Recent & Saved</h3>
            <Link to="/saved" className="text-[11px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">See all</Link>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 -mx-6 px-6">
            {state.recentActivity.map((recent, idx) => (
              <Link key={idx} to={recent.path} className="w-[140px] flex-shrink-0">
                <Card className="glass-card p-3.5 border border-white/5 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="p-1.5 bg-white/5 rounded-full border border-white/10">
                      <recent.icon className="w-3.5 h-3.5 text-white/60" />
                    </div>
                  </div>
                  <p className="font-semibold tracking-tight text-[13px] text-white/90">{recent.label}</p>
                  <p className="text-[10px] font-medium tracking-tight text-white/40 mt-0.5">{recent.subtext}</p>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>

      </motion.div>
    </div>
  )
}

// Helper Icons
const DoorIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/></svg>
)
const UserIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const ClockIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
