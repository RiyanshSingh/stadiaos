import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket as TicketIcon, MapPin, ChevronRight, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '@/services/supabase'
import { useAuthService } from '@/services/authService'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { GLOBAL_FOOTBALL_STADIUMS, DEFAULT_STADIUM_TEMPLATE, SECTION_GATE_MAP } from '@/lib/constants/stadiumData'
import { validateTicketData } from '@/lib/ticketValidation'
import { requireFanSession } from '@/lib/authGuards'

export function TicketSetupView() {
  const navigate = useNavigate()
  const { userId, role } = useAuthService()
  const { loadBootstrap } = useAppStore()
  
  const [selectedStadiumName, setSelectedStadiumName] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [row, setRow] = useState('')
  const [seat, setSeat] = useState('')
  
  const selectedGate = SECTION_GATE_MAP[selectedSection] || ''
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Redirect ops managers
  useEffect(() => {
    if (role === 'ops_manager') navigate('/ops', { replace: true })
  }, [role, navigate])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !selectedStadiumName) return
    setLoading(true)
    setSubmitError(null)

    try {
      // 0. Validation and Security checks
      const sessionUserId = await requireFanSession();
      validateTicketData(selectedStadiumName, selectedSection, row, seat);

      // 1. Ensure Stadium Exists
      let { data: stads } = await supabase.from('stadiums').select('id').eq('name', selectedStadiumName)
      let stadId = stads?.[0]?.id
      
      if (!stadId) {
        const { data: newStad } = await supabase.from('stadiums').insert([{ name: selectedStadiumName, city: 'Global', country: 'Global', capacity: 50000 }]).select('id').single()
        stadId = newStad?.id
      }
      
      if (!stadId) throw new Error("Failed to resolve stadium")

      // 2. Ensure Match Exists
      let { data: matches } = await supabase.from('matches').select('id').eq('stadium_id', stadId).order('created_at', { ascending: false })
      let matchId = matches?.[0]?.id
      
      if (!matchId) {
         const { data: newMatch } = await supabase.from('matches').insert([{ 
           stadium_id: stadId, 
           title: `${selectedStadiumName} Match`, 
           home_team: 'Home Team', 
           away_team: 'Away Team', 
           match_date: new Date().toISOString().split('T')[0], 
           start_time: new Date().toISOString(),
           status: 'scheduled'
         }]).select('id').single()
         matchId = newMatch?.id
      }

      if (!matchId) throw new Error("Failed to resolve match")

      // 3. Create Ticket
      const { error } = await supabase.from('tickets').insert([{
        user_id: sessionUserId,
        match_id: matchId,
        seat_section: selectedSection,
        seat_row: row,
        seat_number: seat,
        assigned_gate_zone_id: null
      }])
      
      if (error) throw error
      
      // Load the freshly inserted ticket into global state before navigating
      await loadBootstrap(sessionUserId)
      
      // Inject the selected gate into the local state so the user sees it in this session
      useAppStore.setState(state => ({
        ticket: state.ticket ? { ...state.ticket, gate: selectedGate, stadiumName: selectedStadiumName } : null
      }))
      
      // Success, route to dashboard
      navigate('/', { replace: true })
    } catch (err: any) {
      console.error(err)
      setSubmitError(err?.message || 'Failed to save ticket. Please try again.')
      setLoading(false)
    }
  }

  const allSections = [
    ...DEFAULT_STADIUM_TEMPLATE.sections.north.lower, ...DEFAULT_STADIUM_TEMPLATE.sections.north.middle, ...DEFAULT_STADIUM_TEMPLATE.sections.north.upper,
    ...DEFAULT_STADIUM_TEMPLATE.sections.east.lower, ...DEFAULT_STADIUM_TEMPLATE.sections.east.middle, ...DEFAULT_STADIUM_TEMPLATE.sections.east.upper,
    ...DEFAULT_STADIUM_TEMPLATE.sections.south.lower, ...DEFAULT_STADIUM_TEMPLATE.sections.south.middle, ...DEFAULT_STADIUM_TEMPLATE.sections.south.upper,
    ...DEFAULT_STADIUM_TEMPLATE.sections.west.lower, ...DEFAULT_STADIUM_TEMPLATE.sections.west.middle, ...DEFAULT_STADIUM_TEMPLATE.sections.west.upper,
  ]

  const getSectionTier = (section: string) => {
    if (['N1', 'E1', 'S1', 'W1'].some(prefix => section.startsWith(prefix))) return 'lower'
    if (['N2', 'E2', 'S2', 'W2'].some(prefix => section.startsWith(prefix))) return 'middle'
    if (['N3', 'E3', 'S3', 'W3'].some(prefix => section.startsWith(prefix))) return 'upper'
    return 'lower'
  }

  const activeTier = selectedSection ? getSectionTier(selectedSection) : 'lower'
  const availableRows = selectedSection ? DEFAULT_STADIUM_TEMPLATE.rowsByTier[activeTier] : []

  const getSeatMax = (tier: string, rowCode: string) => {
    const rules = DEFAULT_STADIUM_TEMPLATE.seatRules[tier as keyof typeof DEFAULT_STADIUM_TEMPLATE.seatRules]
    const rule = rules.find(r => r.rows.includes(rowCode))
    return rule ? rule.seatCount : 20
  }

  const maxSeats = (selectedSection && row) ? getSeatMax(activeTier, row) : 0
  const availableSeats = Array.from({ length: maxSeats }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-x-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />
      
      <header className="px-6 pt-12 pb-6 relative z-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-4">
          <TicketIcon className="w-6 h-6 text-white/80" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matchday Setup</h1>
        <p className="text-[13px] text-white/50 font-medium">Configure your active ticket to enter the Fan App.</p>
      </header>

      <main className="flex-1 px-6 pb-20 relative z-10 max-w-lg mx-auto w-full">
        
        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-8 px-8 relative">
          <div className="absolute top-1/2 left-8 right-8 h-[1px] bg-white/10 -translate-y-1/2 -z-10" />
          {[1, 2].map(num => (
            <div key={num} className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border transition-colors bg-[#0a0a0a]", 
              step >= num ? "text-white border-white" : "text-white/70 border-white/10"
            )}>
              {num}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-4">Select Stadium</h2>
              <div className="grid gap-3">
                {GLOBAL_FOOTBALL_STADIUMS.map(stadName => (
                  <button 
                    key={stadName} 
                    onClick={() => { setSelectedStadiumName(stadName); setStep(2); }}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                      selectedStadiumName === stadName ? "bg-white/10 border-white/30" : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]"
                    )}
                  >
                    <div>
                      <p className="font-bold text-[15px] tracking-tight">{stadName}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white/60 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep(1)} aria-label="Go back to stadium selection" className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-4 hover:text-white transition-colors flex items-center gap-1">
                ← Back to Stadiums
              </button>
              
              <Card className="glass-card p-4 rounded-2xl border border-white/10 bg-white/5 mb-6 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-white/50" />
                <div>
                  <p className="text-[10px] text-white/70 uppercase font-bold tracking-widest">Active Stadium</p>
                  <p className="font-bold text-[14px]">{selectedStadiumName}</p>
                </div>
              </Card>

              <h2 className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-4">Enter Seat Details</h2>
              <form onSubmit={handleSave} className="space-y-4">

                {submitError && (
                  <div role="alert" className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200/90 text-[13px] font-medium">
                    {submitError}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="seat-section" className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-1">Section</label>
                    <div className="relative">
                      <select 
                        id="seat-section"
                        required
                        value={selectedSection}
                        onChange={(e) => { setSelectedSection(e.target.value); setRow(''); setSeat(''); }}
                        className="w-full h-12 bg-black/50 border border-white/10 rounded-2xl px-4 text-[14px] font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20"
                      >
                        <option value="" disabled>Select Sec</option>
                        {allSections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronRight className="w-4 h-4 text-white/60 absolute right-4 top-4 pointer-events-none rotate-90" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-1">Entry Gate</label>
                    <div className="relative">
                      <input 
                        readOnly
                        value={selectedGate}
                        placeholder="Auto-assigned"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-[14px] font-medium text-white/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="seat-row" className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-1">Row</label>
                    <div className="relative">
                      <select 
                        id="seat-row"
                        required
                        value={row}
                        onChange={(e) => { setRow(e.target.value); setSeat(''); }}
                        disabled={!selectedSection}
                        className="w-full h-12 bg-black/50 border border-white/10 rounded-2xl px-4 text-[14px] font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      >
                        <option value="" disabled>Select Row</option>
                        {availableRows.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronRight className="w-4 h-4 text-white/60 absolute right-4 top-4 pointer-events-none rotate-90" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="seat-number" className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-1">Seat</label>
                    <div className="relative">
                      <select 
                        id="seat-number"
                        required
                        value={seat}
                        onChange={(e) => setSeat(e.target.value)}
                        disabled={!row}
                        className="w-full h-12 bg-black/50 border border-white/10 rounded-2xl px-4 text-[14px] font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      >
                        <option value="" disabled>Select Seat</option>
                        {availableSeats.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronRight className="w-4 h-4 text-white/60 absolute right-4 top-4 pointer-events-none rotate-90" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full h-12 mt-6 bg-white text-black rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                    loading ? "opacity-70 cursor-not-allowed" : "hover:bg-white/90"
                  )}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Save & Enter App <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
