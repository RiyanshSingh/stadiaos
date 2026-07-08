import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Navigation2, X, AlertTriangle, Filter, Coffee, 
  ArrowRight, HeartPulse, User, DoorOpen, Activity, AlertCircle,
  Accessibility, Save, ShieldAlert, Navigation, Search, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useAppStore } from '@/store/useAppStore'
import { MAP_GATES, MAP_WASHROOMS, MAP_CAFETERIAS, MAP_SECTIONS } from '@/lib/constants/stadiumData'
import { mapService, type MapPoint } from '@/services/mapService'
import { routingService } from '@/services/routing/routingService'
import type { RouteGraph, RouteResult, RouteMode } from '@/lib/types/routing'

type Mode = 'explore' | 'route' | 'live'
type ExploreChip = 'seat' | 'gate' | 'food' | 'washroom' | 'medical' | 'exit'
type LiveChip = 'crowd' | 'queue' | 'incidents' | 'alerts'

export function MapView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { match, ticket } = useAppStore()
  
  // State Machine
  const [mode, setMode] = useState<Mode>('explore')
  const [exploreChip, setExploreChip] = useState<ExploreChip>('food')
  const [liveChip, setLiveChip] = useState<LiveChip>('crowd')
  const [selectedItem, setSelectedItem] = useState<MapPoint | null>(null)
  
  // Real Data State
  const [explorePoints, setExplorePoints] = useState<MapPoint[]>([])
  const [livePoints, setLivePoints] = useState<MapPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [routeGraph, setRouteGraph] = useState<RouteGraph | null>(null)

  useEffect(() => {
    const staticExplorePoints: MapPoint[] = [
      ...MAP_GATES.map(g => ({ id: g.id, type: 'gate' as any, name: g.label, desc: 'Entry Gate', x: `${g.x}px`, y: `${g.y}px`, status: 'active' as const })),
      ...MAP_WASHROOMS.map(w => ({ id: w.id, type: 'washroom' as any, name: 'Washroom', desc: `Near ${w.nearSection}`, x: `${w.x}px`, y: `${w.y}px`, status: 'active' as const })),
      ...MAP_CAFETERIAS.map(f => ({ id: f.id, type: 'food' as any, name: 'Food Court', desc: `Near ${f.nearSection}`, x: `${f.x}px`, y: `${f.y}px`, status: 'active' as const })),
      ...MAP_SECTIONS.map(s => ({ id: s.id, type: 'seat' as any, name: `Section ${s.label}`, desc: 'Seating', x: `${s.x}px`, y: `${s.y}px`, status: 'active' as const })),
    ]
    
    if (match?.id && match?.stadium_id) {
      Promise.all([
        mapService.fetchLiveOverlays(match.id, match.stadium_id),
        mapService.fetchRouteGraph(match.stadium_id),
      ]).then(([live, graph]) => {
        setExplorePoints(staticExplorePoints)
        setLivePoints(live)
        setRouteGraph(graph)
        setLoading(false)
      })
    } else {
      setExplorePoints(staticExplorePoints)
      setLoading(false)
    }
  }, [match?.id, match?.stadium_id])

  // Route State
  const defaultFrom = ticket ? `Section ${ticket.seat_section}` : 'Section 214'
  const [routeFrom, setRouteFrom] = useState(defaultFrom)
  const [routeTo, setRouteTo] = useState(() => searchParams.get('dest') ?? '')
  const [routeGenerated, setRouteGenerated] = useState(false)
  const [routeAccessible, setRouteAccessible] = useState(useAppStore(s => s.accessibleRouting))
  const [computedRoute, setComputedRoute] = useState<RouteResult | null>(null)

  // Pre-populate route if Copilot passed ?dest= and ?mode=
  useEffect(() => {
    const dest = searchParams.get('dest')
    const mode = searchParams.get('mode') as RouteMode | null
    if (dest) {
      setRouteTo(dest)
      if (mode === 'accessible') setRouteAccessible(true)
    }
  }, [])

  useEffect(() => {
    if (!loading && searchParams.get('start') === 'true' && routeTo) {
      setMode('route')
      handleRouteGenerate(routeTo, true)
    }
  }, [loading, searchParams, routeTo])

  const userLocationPoint = useMemo(() => {
    if (!ticket?.seat_section) return null
    return explorePoints.find(p => p.type === 'seat' && p.name.includes(ticket.seat_section))
  }, [ticket?.seat_section, explorePoints])

  // Data
  const exploreChips: { id: ExploreChip, label: string, icon: any }[] = [
    { id: 'seat', label: 'Seat', icon: MapPin },
    { id: 'gate', label: 'Gate', icon: DoorOpen },
    { id: 'food', label: 'Food', icon: Coffee },
    { id: 'washroom', label: 'Washroom', icon: User },
    { id: 'medical', label: 'Medical', icon: HeartPulse },
    { id: 'exit', label: 'Exit', icon: Navigation2 },
  ]

  const liveChips: { id: LiveChip, label: string, icon: any }[] = [
    { id: 'crowd', label: 'Crowd', icon: Activity },
    { id: 'queue', label: 'Queue', icon: Coffee },
    { id: 'incidents', label: 'Incidents', icon: ShieldAlert },
    { id: 'alerts', label: 'Alerts', icon: AlertCircle },
  ]

  const routeChips = [
    { label: 'Seat' }, { label: 'Gate' }, { label: 'Food' }, 
    { label: 'Washroom' }, { label: 'Exit' }, { label: 'Medical' }
  ]

  // Derived points based on mode
  const visiblePoints = useMemo(() => {
    if (mode === 'explore') {
      return explorePoints.filter(p => p.type === exploreChip)
    } else if (mode === 'live') {
      if (liveChip === 'incidents') return livePoints.filter(p => p.type === 'live_incident')
      if (liveChip === 'alerts') return livePoints.filter(p => p.type === 'live_alert')
      return [] // crowd/queue are heatmaps, not markers
    }
    return [] // Route mode renders a line, no standard markers
  }, [mode, exploreChip, liveChip, explorePoints, livePoints])

  const activeAlertsCount = livePoints.filter(p => p.type === 'live_alert' && p.status === 'active').length

  const handleModeChange = (m: Mode) => {
    setMode(m)
    setSelectedItem(null)
    setRouteGenerated(false)
  }

  const handleRouteGenerate = (destination: string, preventNavigation = false) => {
    setRouteTo(destination)
    setSelectedItem(null)

    let outcome = null
    if (routeGraph) {
      let source: any = ticket ? { kind: 'ticket_seat' } : { kind: 'label', label: routeFrom };
      let destObj: any = { kind: 'label', label: destination };

      if (destination.toLowerCase() === 'seat') {
        source = { kind: 'gate', name: 'gate a' };
        destObj = ticket ? { kind: 'ticket_seat' } : { kind: 'label', label: 'section 214' };
      }

      outcome = routingService.computeRoute(
        {
          source,
          destination: destObj,
          mode: routeAccessible ? 'accessible' : 'standard',
        },
        routeGraph
      )
    }

    if (outcome && outcome.ok) {
      setComputedRoute(outcome)
      if (!preventNavigation) navigate(`/route/detail?dest=${encodeURIComponent(destination)}&mode=${routeAccessible ? 'accessible' : 'standard'}`)
    } else {
      // Fallback: draw straight line if graph fails
      const findPoint = (search: string) => {
        const s = search.toLowerCase()
        return explorePoints.find(p => 
          p.name.toLowerCase().includes(s) || 
          s.includes(p.name.toLowerCase()) || 
          (p.desc && p.desc.toLowerCase().includes(s)) ||
          p.type.toLowerCase() === s
        )
      }
      
      const sourcePt = findPoint(routeFrom) || explorePoints[0]
      const destPt = findPoint(destination) || explorePoints[Math.floor(explorePoints.length / 2)]
      
      if (sourcePt && destPt) {
        // Ensure toSvgCoord is hoisted or duplicate its logic for here
        const sx = sourcePt.x.includes('%') ? parseFloat(sourcePt.x) * 10 : parseFloat(sourcePt.x);
        const sy = sourcePt.y.includes('%') ? parseFloat(sourcePt.y) * 10 : parseFloat(sourcePt.y);
        const dx = destPt.x.includes('%') ? parseFloat(destPt.x) * 10 : parseFloat(destPt.x);
        const dy = destPt.y.includes('%') ? parseFloat(destPt.y) * 10 : parseFloat(destPt.y);

        const crossesX = (sx < 350 && dx > 650) || (sx > 650 && dx < 350);
        const crossesY = (sy < 350 && dy > 650) || (sy > 650 && dy < 350);
        
        const waypoints = [];
        waypoints.push({ id: 'start', x: sourcePt.x, y: sourcePt.y, floor: '0' });
        
        if (crossesX && crossesY) {
          waypoints.push({ id: 'wp1', x: `${sx}px`, y: `${dy}px`, floor: '0' });
        } else if (crossesX) {
          const safeY = sy < 500 ? 150 : 850;
          waypoints.push({ id: 'wp1', x: `${sx}px`, y: `${safeY}px`, floor: '0' });
          waypoints.push({ id: 'wp2', x: `${dx}px`, y: `${safeY}px`, floor: '0' });
        } else if (crossesY) {
          const safeX = sx < 500 ? 150 : 850;
          waypoints.push({ id: 'wp1', x: `${safeX}px`, y: `${sy}px`, floor: '0' });
          waypoints.push({ id: 'wp2', x: `${safeX}px`, y: `${dy}px`, floor: '0' });
        }
        
        waypoints.push({ id: 'end', x: destPt.x, y: destPt.y, floor: '0' });

        setComputedRoute({
          ok: true,
          sourceLabel: 'Current Location',
          destinationLabel: destination,
          etaMinutes: Math.ceil(250 / 80),
          distanceMeters: 250,
          routeMode: routeAccessible ? 'accessible' : 'standard',
          steps: [],
          pathNodeKeys: [],
          polyline: waypoints
        })
        if (!preventNavigation) navigate(`/route/detail?dest=${encodeURIComponent(destination)}&mode=${routeAccessible ? 'accessible' : 'standard'}`)
      } else {
        setComputedRoute(null)
      }
    }
    setRouteGenerated(true)
  }

  // Helper to handle mixed coordinates (percentages vs absolute px)
  const toSvgCoord = (val: string | number) => {
    if (typeof val === 'number') return val;
    return val.includes('%') ? parseFloat(val) * 10 : parseFloat(val)
  }

  return (
    <div className="h-screen w-full bg-black text-white relative overflow-hidden flex flex-col pb-32">
      
      {/* --- BACKGROUND MAP --- */}
      <div className="absolute inset-4 top-[240px] bottom-[100px] z-0 bg-black overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="absolute inset-0 w-full h-full">
          <TransformWrapper
            initialScale={0.8}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
          >
            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-[1000px] !h-[1000px] flex items-center justify-center">
              <div className="relative w-full h-full">
                <img src="/stadium-map.png" alt="Stadium Map" loading="lazy" className="absolute inset-0 w-full h-full object-contain opacity-40 pointer-events-none" />

                {/* Route Line Overlay — real polyline from routingService or fallback */}
                {mode === 'route' && routeGenerated && computedRoute && computedRoute.polyline.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' }} viewBox="0 0 1000 1000">
                    <polyline
                      points={computedRoute.polyline
                        .map(pt => `${toSvgCoord(pt.x)} ${toSvgCoord(pt.y)}`)
                        .join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="6"
                      strokeDasharray="10 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Source dot */}
                    {computedRoute.polyline[0] && (
                      <circle
                        cx={toSvgCoord(computedRoute.polyline[0].x)}
                        cy={toSvgCoord(computedRoute.polyline[0].y)}
                        r="8" fill="#fff"
                      />
                    )}
                    {/* Destination dot */}
                    {computedRoute.polyline[computedRoute.polyline.length - 1] && (
                      <circle
                        cx={toSvgCoord(computedRoute.polyline[computedRoute.polyline.length - 1].x)}
                        cy={toSvgCoord(computedRoute.polyline[computedRoute.polyline.length - 1].y)}
                        r="8" fill="#3b82f6" stroke="#fff" strokeWidth="3"
                      />
                    )}
                  </svg>
                )}
                {/* Fallback static overlay if route not yet computed */}
                {mode === 'route' && routeGenerated && !computedRoute && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' }} viewBox="0 0 1000 1000">
                    <path d="M 500 750 Q 600 500 800 400 T 700 200" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="10 6" />
                    <circle cx="500" cy="750" r="8" fill="#fff" />
                    <circle cx="700" cy="200" r="8" fill="#3b82f6" stroke="#fff" strokeWidth="3" />
                  </svg>
                )}

                {/* Live Heatmaps (Mock visual effect for MVP) */}
                {mode === 'live' && liveChip === 'crowd' && (
                  <>
                    <div className="absolute top-[20%] left-[10%] w-48 h-48 bg-red-500/30 blur-3xl rounded-full mix-blend-screen" />
                    <div className="absolute top-[60%] right-[20%] w-64 h-64 bg-green-500/20 blur-3xl rounded-full mix-blend-screen" />
                  </>
                )}
                {mode === 'live' && liveChip === 'queue' && (
                  <>
                    <div className="absolute top-[35%] left-[70%] w-32 h-32 bg-yellow-500/40 blur-2xl rounded-full mix-blend-screen" />
                  </>
                )}

                {/* User Current Location Dot */}
                {userLocationPoint && (
                  <div className="absolute z-10 w-8 h-8 -ml-4 -mt-4" style={{ left: userLocationPoint.x, top: userLocationPoint.y }}>
                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
                    <div className="absolute inset-2 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  </div>
                )}

                {/* Interactive Markers */}
                {!loading && visiblePoints.map((point) => (
                  <motion.button
                    key={point.id}
                    style={{ left: point.x, top: point.y }}
                    className={cn(
                      "absolute z-20 w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center transition-all",
                      selectedItem?.id === point.id 
                        ? "bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
                        : point.type === 'live_incident' || point.type === 'live_alert'
                          ? "bg-red-500/20 border-red-500/50 text-red-500 border backdrop-blur-md"
                          : "bg-black text-white hover:bg-white/10 border border-white/30 backdrop-blur-md"
                    )}
                    onClick={(e) => {
                      e.stopPropagation() // Prevent zoom-pan click interception
                      setSelectedItem(point)
                    }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    {point.type === 'food' && <Coffee className="w-4 h-4" />}
                    {point.type === 'gate' && <DoorOpen className="w-4 h-4" />}
                    {point.type === 'seat' && <MapPin className="w-4 h-4" />}
                    {point.type === 'washroom' && <User className="w-4 h-4" />}
                    {point.type === 'medical' && <HeartPulse className="w-4 h-4" />}
                    {point.type === 'exit' && <Navigation2 className="w-4 h-4" />}
                    {point.type === 'live_incident' && <ShieldAlert className="w-4 h-4" />}
                    {point.type === 'live_alert' && <AlertTriangle className="w-4 h-4" />}
                  </motion.button>
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>

      {/* --- TOP OVERLAYS --- */}
      <div className="relative z-30 pt-12 px-6 pb-4 flex flex-col gap-4 pointer-events-none">
        
        {/* Top Header */}
        <div className="flex justify-between items-center pointer-events-auto">
          <div>
            <h1 className="text-xl font-medium tracking-tight">
              {match?.stadium_name || match?.title || 'Stadium Map'}
            </h1>
            <p className="text-sm text-white/50 flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {ticket?.seat_section ? `Section ${ticket.seat_section}` : 'General Venue'}
            </p>
          </div>
          <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
            <Filter className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-1 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 pointer-events-auto shadow-lg">
          {(['explore', 'route', 'live'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={cn(
                "flex-1 py-2 text-sm font-medium capitalize rounded-full transition-all relative",
                mode === m ? "text-black" : "text-white/60 hover:text-white"
              )}
            >
              {mode === m && (
                <motion.div layoutId="modeBg" className="absolute inset-0 bg-white rounded-full z-0" transition={{ type: "spring", stiffness: 400, damping: 25 }} />
              )}
              <span className="relative z-10">{m}</span>
            </button>
          ))}
        </div>

        {/* Mode Specific Top UI */}
        <div className="pointer-events-auto pt-2 -mx-6 px-6 overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* Explore Mode Chips */}
            {mode === 'explore' && (
              <motion.div key="explore" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {exploreChips.map((chip) => (
                  <button key={chip.id} onClick={() => { setExploreChip(chip.id); setSelectedItem(null); }} className={cn("flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border rounded-full transition-colors whitespace-nowrap shadow-sm", exploreChip === chip.id ? "border-white bg-white/10 text-white" : "border-white/10 text-white/60 hover:bg-white/5 hover:text-white")}>
                    <chip.icon className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-tight">{chip.label}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Live Mode Chips */}
            {mode === 'live' && (
              <motion.div key="live" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {liveChips.map((chip) => (
                  <button key={chip.id} onClick={() => { setLiveChip(chip.id); setSelectedItem(null); }} className={cn("flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border rounded-full transition-colors whitespace-nowrap shadow-sm", liveChip === chip.id ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-white/10 text-white/60 hover:bg-white/5 hover:text-white")}>
                    <chip.icon className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-tight">{chip.label}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Route Mode Inputs */}
            {mode === 'route' && !routeGenerated && (
              <motion.div key="route" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col gap-2 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 ml-1" />
                    <Input value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)} className="h-8 bg-transparent border-0 px-0 focus-visible:ring-0 text-white placeholder:text-white/30" placeholder="From (Current Location)" />
                  </div>
                  <div className="absolute left-[8px] top-[26px] bottom-[26px] w-[1px] bg-white/10" />
                  <div className="flex items-center gap-3 border-t border-white/5 pt-2">
                    <div className="w-2 h-2 rounded-sm bg-red-400 ml-1" />
                    <Input value={routeTo} onChange={(e) => setRouteTo(e.target.value)} className="h-8 bg-transparent border-0 px-0 focus-visible:ring-0 text-white placeholder:text-white/30" placeholder="Where to?" autoFocus />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                  {routeChips.map((chip, i) => (
                    <button key={i} onClick={() => handleRouteGenerate(chip.label)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap">
                      {chip.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- BOTTOM CONTEXT SHEETS --- */}
      <AnimatePresence>
        
        {/* Explore Context Sheet */}
        {mode === 'explore' && selectedItem && (
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="absolute bottom-28 left-0 w-full px-4 z-40">
            <Card className="glass-card border border-white/10 p-5 rounded-3xl w-full bg-black/80 backdrop-blur-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">{selectedItem.type}</p>
                  <h3 className="text-2xl font-bold tracking-tight">{selectedItem.name}</h3>
                  {selectedItem.desc && <p className="text-white/70 text-sm mt-0.5">{selectedItem.desc}</p>}
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              {selectedItem.wait && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                    <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Wait Time</p>
                    <p className="text-lg font-bold text-green-400">{selectedItem.wait}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                    <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Crowd</p>
                    <p className="text-lg font-bold">{selectedItem.crowd || '-'}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setMode('route'); handleRouteGenerate(selectedItem.name); }} className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                  <Navigation2 className="w-4 h-4" /> Route
                </button>
                {selectedItem.type === 'food' || selectedItem.type === 'washroom' ? (
                  <button onClick={() => navigate(`/facility/${selectedItem.id}`)} className="flex-1 bg-white/10 border border-white/10 text-white py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors">
                    View Details
                  </button>
                ) : (
                  <button onClick={() => navigate('/copilot')} className="flex-1 bg-white/10 border border-white/10 text-white py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors">
                    Ask Copilot
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Route Summary Sheet */}
        {mode === 'route' && routeGenerated && (
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="absolute bottom-28 left-0 w-full px-4 z-40">
            <Card className="glass-card border border-blue-500/20 p-5 rounded-3xl w-full bg-black/80 backdrop-blur-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-400 text-[10px] uppercase font-bold tracking-widest mb-1">Route Ready</p>
                  <h3 className="text-xl font-bold tracking-tight">To {routeTo}</h3>
                  <p className="text-white/70 text-sm mt-0.5 flex items-center gap-2">
                    5 min walk <span className="w-1 h-1 rounded-full bg-white/30" /> 320m
                  </p>
                </div>
                <button onClick={() => setRouteGenerated(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 mb-5">
                <div className="flex items-center gap-3">
                  <Accessibility className={cn("w-5 h-5", routeAccessible ? "text-blue-400" : "text-white/40")} />
                  <div>
                    <p className="text-sm font-medium">Accessible Route</p>
                    <p className="text-[10px] text-white/50">Avoids stairs and escalators</p>
                  </div>
                </div>
                <button onClick={() => setRouteAccessible(!routeAccessible)} className={cn("w-12 h-6 rounded-full transition-colors relative", routeAccessible ? "bg-blue-500" : "bg-white/20")}>
                  <div className={cn("w-5 h-5 bg-white rounded-full absolute top-[2px] transition-all", routeAccessible ? "left-[26px]" : "left-[2px]")} />
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => navigate(`/route/detail?dest=${encodeURIComponent(routeTo)}&mode=${routeAccessible ? 'accessible' : 'standard'}`)} className="flex-[2] bg-blue-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                  <Navigation className="w-4 h-4" /> View Steps
                </button>
                <button className="flex-1 bg-white/10 border border-white/10 text-white py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors flex items-center justify-center">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => navigate('/report')} className="flex-1 bg-white/10 border border-white/10 text-red-400 py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Live Detail Sheet */}
        {mode === 'live' && selectedItem && (
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="absolute bottom-28 left-0 w-full px-4 z-40">
            <Card className="glass-card border border-red-500/30 p-5 rounded-3xl w-full bg-red-950/40 backdrop-blur-2xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="p-2.5 bg-red-500/20 rounded-full h-fit">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-red-100">{selectedItem.name}</h3>
                    <p className="text-red-300/70 text-sm mt-0.5">{selectedItem.desc}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => navigate('/copilot')} className="flex-1 bg-red-500/20 text-red-200 py-3 rounded-xl font-semibold text-sm hover:bg-red-500/30 transition-colors border border-red-500/30">
                  Ask Copilot for Help
                </button>
              </div>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Live Summary Bar (Shows when live mode but no marker selected) */}
      <AnimatePresence>
        {mode === 'live' && !selectedItem && activeAlertsCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-28 left-0 w-full px-6 z-30 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full py-2.5 px-4 flex items-center justify-between shadow-xl shadow-black/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold">{activeAlertsCount} Active Alert{activeAlertsCount > 1 ? 's' : ''}</span>
              </div>
              <span className="text-xs text-white/50">Check alerts for details</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
