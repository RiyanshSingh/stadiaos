import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, MapPin, Navigation, ShieldAlert, Activity, Accessibility } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { mapService } from '@/services/mapService'
import { routingService } from '@/services/routing/routingService'
import { useAppStore } from '@/store/useAppStore'
import type { RouteResult, RouteMode } from '@/lib/types/routing'

export function RouteDetailView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { match, ticket } = useAppStore()

  const destLabel = searchParams.get('dest') ?? id ?? 'Destination'
  const initialMode = (searchParams.get('mode') as RouteMode) ?? 'standard'

  const [routeMode, setRouteMode] = useState<RouteMode>(initialMode)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const computeRoute = useCallback(async (mode: RouteMode) => {
    if (!match?.stadium_id) {
      setError('No active match found.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const graph = await mapService.fetchRouteGraph(match.stadium_id)

    let source: any = ticket ? { kind: 'ticket_seat' } : { kind: 'label', label: 'north_concourse' };
    let destination: any = { kind: 'label', label: destLabel };

    if (id === 'seat') {
      source = { kind: 'gate', name: 'gate a' }; // Default entry
      destination = ticket ? { kind: 'ticket_seat' } : { kind: 'label', label: 'section 214' };
    } else if (id === 'exit') {
      destination = { kind: 'gate', name: 'gate c' }; // Preferred exit
    }

    const outcome = routingService.computeRoute(
      {
        source,
        destination,
        mode,
      },
      graph
    )

    if (outcome.ok) {
      setRoute(outcome)
    } else {
      setError((outcome as Extract<typeof outcome, { ok: false }>).reason)
    }
    setLoading(false)
  }, [match?.stadium_id, ticket, destLabel, id])

  useEffect(() => {
    computeRoute(routeMode)
  }, [match?.stadium_id, routeMode, computeRoute])

  const handleToggleAccessible = () => {
    const newMode: RouteMode = routeMode === 'accessible' ? 'standard' : 'accessible'
    setRouteMode(newMode)
    computeRoute(newMode)
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" aria-hidden="true" />
            </button>
            <h1 className="text-xl font-semibold tracking-tight">Route Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <span id="accessible-route-label" className="text-[10px] uppercase tracking-wider font-bold text-white/50">Accessible</span>
            <button
              role="switch"
              aria-checked={routeMode === 'accessible'}
              aria-labelledby="accessible-route-label"
              onClick={handleToggleAccessible}
              className={cn("w-8 h-4 rounded-full relative border border-white/10 transition-colors", routeMode === 'accessible' ? 'bg-blue-500' : 'bg-white/20')}
            >
              <span className="sr-only">{routeMode === 'accessible' ? 'Accessible routing on' : 'Accessible routing off'}</span>
              <div className={cn("w-3 h-3 bg-white rounded-full absolute top-[1px] transition-all", routeMode === 'accessible' ? 'left-[18px]' : 'left-[1px]')} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">

        {loading && (
          <div role="status" aria-label="Loading route" className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" aria-hidden="true" />
          </div>
        )}

        {error && !loading && (
          <Card className="glass-card p-5 rounded-3xl border border-red-500/20 bg-red-950/20 text-center">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </Card>
        )}

        {route && !loading && (
          <>
            {/* Route Summary */}
            <Card className="glass-card p-5 rounded-3xl border border-white/10 bg-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Destination</p>
                  <h2 className="text-xl font-bold tracking-tight">{route.destinationLabel}</h2>
                  <p className="text-xs text-white/50 mt-0.5">from {route.sourceLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Est. Time</p>
                  <h2 className="text-xl font-bold tracking-tight text-blue-400">{route.etaMinutes} min</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">Distance</p>
                    <p className="text-xs font-bold">{route.distanceMeters}m</p>
                  </div>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center gap-2">
                  <Accessibility className={cn("w-4 h-4", route.routeMode === 'accessible' ? 'text-blue-400' : 'text-white/70')} />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">Mode</p>
                    <p className="text-xs font-bold capitalize">{route.routeMode}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step by step */}
            <section>
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 px-1">Directions</h3>
              <Card className="glass-card p-5 rounded-2xl border-white/10 bg-white/5">
                <div className="space-y-0">
                  {route.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== route.steps.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-white/10" />
                      )}
                      <div className="flex flex-col items-center pb-6">
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center relative z-10">
                          {step.type === 'arrive' ? (
                            <MapPin className="w-4 h-4 text-blue-400" />
                          ) : step.type === 'escalator' || step.type === 'elevator' || step.type === 'stairs' ? (
                            <Activity className="w-4 h-4 text-white/70" />
                          ) : (
                            <Navigation className="w-4 h-4 text-white/70" />
                          )}
                        </div>
                      </div>
                      <div className="pt-1.5 pb-6">
                        <p className="font-medium text-sm text-white/90">{step.instruction}</p>
                        {step.distance && <p className="text-xs text-white/50 mt-1">{step.distance}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* Actions */}
            <section className="space-y-3">
              <button onClick={() => navigate(`/map?dest=${encodeURIComponent(destLabel)}&mode=${routeMode}&start=true`)} className="w-full py-4 bg-white text-black font-semibold rounded-2xl text-sm transition-all hover:bg-white/90">
                Start Live Navigation
              </button>
              <button onClick={() => navigate('/report')} className="w-full py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl text-sm transition-all hover:bg-white/10 flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Report Blocked Path
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
