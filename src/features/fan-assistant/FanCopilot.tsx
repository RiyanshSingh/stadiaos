import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, Mic, Paperclip, MapPin, 
  AlertTriangle, Navigation2, 
  Coffee, ArrowRight, ChevronLeft, ShieldAlert
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { useIncidentService } from '@/services/incidentService'
import type { CopilotMessage } from '@/lib/types/copilot'

export function FanCopilot() {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  
  const { match, ticket, profile } = useAppStore()
  const { reportIncident } = useIncidentService()

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome-1',
      role: 'copilot',
      type: 'text',
      content: "Hi! I'm your StadiaOS Copilot. I can guide you to your seat, find the nearest facilities, or help with emergencies. How can I assist you today?"
    }
  ])
  const [isSending, setIsSending] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const activeMatchStatus = match?.status || 'Live'
  const currentSection = ticket?.seat_section || 'Unknown'
  const currentZoneId = match?.title || 'Event'
  const ticketValid = !!ticket

  const starterPrompts = [
    { label: "Nearest washroom", icon: Coffee },
    { label: "Take me to my seat", icon: Navigation2 },
    { label: "Any alerts right now?", icon: AlertTriangle },
    { label: "Report medical issue", icon: ShieldAlert },
    { label: "Accessible route to gate", icon: Navigation2 }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending])

  const handleSend = async (text: string) => {
    if (!text.trim() || !match || !profile || isSending) return;
    
    setHasStarted(true);
    const userMsg: CopilotMessage = { id: Math.random().toString(36).substr(2, 9), role: 'user', type: 'text', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const { copilotResolver } = await import('@/services/copilotResolver');
      const response = await copilotResolver.processUserMessage(text, match.id, match.stadium_id);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error(error);
      const errorMsg: CopilotMessage = { id: Math.random().toString(36).substr(2, 9), role: 'copilot', type: 'text', content: 'Sorry, I encountered a network error. Please try again.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  }

  const handleIncidentSubmit = async (data: any) => {
    if (!match || !profile) return;
    
    const confirmMsg: CopilotMessage = { id: Math.random().toString(36).substr(2, 9), role: 'copilot', type: 'text', content: 'I have submitted your incident report to the command center. Security and medical staff have been notified.' };
    setMessages(prev => [...prev, confirmMsg]);

    try {
      await reportIncident(
        { type: data.incidentType, zone: data.locationLabel || (ticketValid ? `Sec ${ticket.seat_section}, Row ${ticket.seat_row}` : 'Unknown'), description: `${ticketValid ? 'Reported from Sec ' + ticket.seat_section + ', Row ' + ticket.seat_row + ' | ' : ''}${data.description}` },
        match.id,
        match.stadium_id
      );
    } catch (e) {
      console.error(e);
    }
  }

  const renderCard = (msg: CopilotMessage) => {
    switch (msg.type) {
      case 'route_card':
        return (
          <Card className="glass-card border border-white/10 p-5 rounded-3xl rounded-tl-sm bg-white/[0.03] mt-2 w-full max-w-[90%] shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/5"><Navigation2 className="w-4 h-4 text-white" /></div>
              <div>
                <p className="text-[15px] font-bold tracking-tight text-white/90">{msg.data.destinationLabel || msg.data.destination}</p>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mt-0.5">Route Ready</p>
              </div>
            </div>
            <div className="flex gap-6 mb-5 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Est. Time</p>
                <p className="text-[15px] font-bold text-white/90">{msg.data.eta}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Distance</p>
                <p className="text-[15px] font-bold text-white/90">{msg.data.distance}</p>
              </div>
            </div>
            <Link to={`/route/detail?dest=${encodeURIComponent(msg.data.destinationLabel || msg.data.destination || '')}&mode=${msg.data.routeMode || 'standard'}`}>
              <button className="w-full h-12 bg-white text-black rounded-xl text-[13px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
                Open in Map <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </Card>
        )
      case 'facility_card':
        return (
          <Card className="glass-card border border-white/10 p-5 rounded-3xl rounded-tl-sm bg-white/[0.03] mt-2 w-full max-w-[90%] shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/5"><Coffee className="w-4 h-4 text-white" /></div>
              <div>
                <p className="text-[15px] font-bold tracking-tight text-white/90">{msg.data.name}</p>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mt-0.5">Facility Located</p>
              </div>
            </div>
            <div className="flex justify-between items-center mb-5 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Wait Time</p>
                <p className="text-[15px] font-bold text-white/90">{msg.data.wait}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Crowd</p>
                <p className="text-[15px] font-bold text-white/90">{msg.data.crowd}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/map" className="flex-1">
                <button className="w-full h-12 bg-white text-black rounded-xl text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
                  Route
                </button>
              </Link>
              <Link to="/facilities" className="flex-1">
                <button className="w-full h-12 bg-white/10 text-white rounded-xl text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 border border-white/10 hover:bg-white/20 transition-colors">
                  Details
                </button>
              </Link>
            </div>
          </Card>
        )
      case 'incident_card':
        return (
          <Card className="glass-card border border-red-500/30 p-5 rounded-3xl rounded-tl-sm bg-red-950/20 mt-2 w-full max-w-[90%] shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/20"><ShieldAlert className="w-4 h-4 text-red-400" /></div>
              <div>
                <p className="text-[15px] font-bold tracking-tight text-red-100">{msg.data.type}</p>
                <p className="text-[10px] text-red-400/80 uppercase tracking-widest font-bold mt-0.5">Draft Incident Report</p>
              </div>
            </div>
            <div className="mb-5 p-4 bg-red-950/40 rounded-2xl border border-red-500/10">
              <p className="text-[10px] text-red-400/80 uppercase tracking-widest font-bold mb-1">Location</p>
              <p className="text-[15px] font-medium text-white/90">{msg.data.locationLabel}</p>
            </div>
            <button onClick={() => handleIncidentSubmit(msg.data)} className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors">
              Submit Report <AlertTriangle className="w-4 h-4" />
            </button>
          </Card>
        )
      case 'alert_card':
        return (
          <Card className="glass-card border border-white/20 p-5 rounded-3xl rounded-tl-sm bg-white/[0.05] mt-2 w-full max-w-[90%] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20"><AlertTriangle className="w-4 h-4 text-white" /></div>
              <div>
                <p className="text-[15px] font-bold tracking-tight text-white/90">{msg.data.issue}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mt-0.5">Active Advisory</p>
              </div>
            </div>
            <div className="mb-5 relative z-10">
              <p className="text-[14px] font-medium text-white/70 leading-relaxed">{msg.data.recommendation}</p>
            </div>
            <Link to="/alerts" className="relative z-10">
              <button className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors">
                View Live Alerts <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      
      {/* HEADER & CONTEXT BAR */}
      <div className="absolute top-0 left-0 right-0 pt-12 px-5 pb-12 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent z-30 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex-shrink-0 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10 shadow-lg backdrop-blur-md">
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </button>
          
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2 w-max">
              <div className="flex items-center h-8 gap-2 px-3 rounded-full bg-white/10 text-[10px] font-bold tracking-widest uppercase text-white shadow-lg backdrop-blur-md border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" /> Match: {activeMatchStatus}
              </div>
              <div className="flex items-center h-8 gap-2 px-3 rounded-full bg-white/5 text-[10px] font-bold tracking-widest uppercase text-white/70 shadow-lg backdrop-blur-md border border-white/5">
                <MapPin className="w-3 h-3 text-white/70" /> {currentZoneId}
              </div>
              <div className="flex items-center h-8 gap-2 px-3 rounded-full bg-white/5 text-[10px] font-bold tracking-widest uppercase text-white/70 shadow-lg backdrop-blur-md border border-white/5">
                Sec {currentSection}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT THREAD */}
      <div
        className="flex-1 overflow-y-auto px-5 pt-[100px] pb-32"
        role="log"
        aria-label="Conversation with Copilot"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="space-y-6">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              {msg.type === 'text' && (
                <div className={cn(
                  "px-5 py-3.5 rounded-3xl max-w-[85%] text-[15px] leading-relaxed shadow-sm font-medium tracking-tight",
                  msg.role === 'user' 
                    ? "bg-white text-black rounded-br-sm" 
                    : "bg-white/10 border border-white/5 rounded-tl-sm text-white/90"
                )}>
                  {msg.content}
                </div>
              )}

              {msg.id === 'welcome-1' && !hasStarted && (
                <div className="mt-4 w-full">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/60 ml-1 mb-2">Try asking</p>
                  <div className="flex flex-col gap-2">
                    {starterPrompts.map((prompt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSend(prompt.label)}
                        className="w-full text-left px-5 py-4 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl flex items-center gap-4 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                          <prompt.icon className="w-4 h-4 text-white/60" />
                        </div>
                        <span className="text-[14px] font-medium text-white/80 tracking-tight">{prompt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {msg.type !== 'text' && msg.role === 'copilot' && (
                <>
                  <div className="px-5 py-3.5 rounded-3xl rounded-tl-sm max-w-[85%] text-[15px] font-medium tracking-tight leading-relaxed bg-white/10 border border-white/5 text-white/90 shadow-sm mb-1.5">
                    {msg.content}
                  </div>
                  {renderCard(msg)}
                </>
              )}
            </motion.div>
          ))}
          
          {isSending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start">
              <div className="px-5 py-4 rounded-3xl rounded-tl-sm bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>


      {/* COMPOSER */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-black via-black/95 to-transparent z-40">
        <div className="flex items-end gap-3 p-2 bg-white/[0.03] border border-white/10 rounded-[2rem] backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <button aria-label="Attach file" className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white/80 transition-colors shrink-0">
            <Paperclip className="w-5 h-5" aria-hidden="true" />
          </button>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Copilot..."
            aria-label="Message Copilot"
            aria-disabled={isSending}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
            className="flex-1 bg-transparent text-[15px] font-medium text-white placeholder:text-white/60 focus:outline-none resize-none py-3.5 min-h-[48px] max-h-[120px]"
            rows={1}
            disabled={isSending}
          />
          {input.trim() ? (
            <button 
              onClick={() => handleSend(input)} 
              disabled={isSending}
              aria-label="Send message"
              className="w-10 h-10 shrink-0 bg-white text-black rounded-full flex items-center justify-center hover:bg-white/90 transition-colors shadow-lg disabled:opacity-50"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button aria-label="Voice input" className="w-10 h-10 shrink-0 flex items-center justify-center text-white/70 hover:text-white/80 transition-colors">
              <Mic className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
