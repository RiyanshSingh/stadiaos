import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, MapPin, MessageSquare, Shield, Send, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIncidentService } from '@/services/incidentService';
import { useAuthService } from '@/services/authService';
import { cn } from '@/lib/utils';
import type { IncidentStatus, IncidentSeverity } from '@/lib/types/domain';

export function IncidentTriageDesk() {
  const { incidents, updateIncidentStatus, assignIncidentTeam, addIncidentNote } = useIncidentService();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const { matchId } = useAuthService();

  const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed');

  if (!matchId) return null;

  const handleStatusChange = async (id: string, current: IncidentStatus, next: IncidentStatus) => {
    await updateIncidentStatus(id, current, next);
  };

  const handleAssign = async (id: string, team: string) => {
    await assignIncidentTeam(id, team);
  };

  const handleAddNote = async (id: string) => {
    if (!noteText.trim()) return;
    await addIncidentNote(id, noteText);
    setNoteText('');
  };

  const resolveLocation = (desc: string) => {
    const loc = desc.split('|')[0];
    if (!loc || loc.trim() === 'Location:') return 'Unknown Location';
    return loc.replace('Location: ', '').trim();
  }

  const resolveDescription = (desc: string) => {
    const parts = desc.split('|');
    if (parts.length > 1) return parts.slice(1).join('|').trim();
    return desc;
  }

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString;
    }
  }

  return (
    <section aria-label="Incident Triage Feed">
      <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-4 px-2">Incident Triage Feed</h2>
      
      <AnimatePresence mode="popLayout">
        {activeIncidents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-16 px-6 glass-card border border-white/5 rounded-3xl bg-white/[0.02] flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white/70" />
            </div>
            <p className="text-[13px] font-bold text-white/70 uppercase tracking-widest">Triage Queue Clear</p>
            <p className="text-[13px] font-medium text-white/60 mt-2">No active incidents require attention.</p>
          </motion.div>
        ) : (
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {activeIncidents.map((incident, idx) => {
              const isExpanded = expandedId === incident.id;
              const isCritical = incident.severity === 'critical' || incident.severity === 'high';
              
              return (
                <motion.div 
                  key={incident.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ delay: Math.min(idx * 0.1, 0.5) }}
                >
                  <Card 
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    className={cn(
                      "glass-card border bg-white/[0.03] rounded-3xl transition-colors overflow-hidden group cursor-pointer text-left w-full",
                      isCritical ? 'border-white/20 hover:bg-white/[0.05]' : 'border-white/5 hover:bg-white/[0.04]'
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : incident.id);
                      }
                    }}
                  >
                    <div className="p-6">
                      
                      {/* Top Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                            isCritical ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-white/60 border-white/10'
                          )}>
                            {incident.severity}
                          </span>
                          <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                            incident.status === 'in_progress' ? 'bg-white/10 text-white border-white/20' : 
                            incident.status === 'assigned' ? 'bg-white/10 text-white/80 border-white/20' :
                            'bg-white/5 text-white/60 border-transparent'
                          )}>
                            {incident.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                          {formatTime(incident.created_at)}
                        </span>
                      </div>
                      
                      {/* Headline Block */}
                      <div className="mb-2">
                        <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold mb-1.5">{(incident.incident_type || 'General').replace('_', ' ')}</p>
                        <h3 className="font-bold text-[17px] tracking-tight text-white/90 leading-snug">
                          {incident.title || resolveDescription(incident.description) || 'Incident Reported'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/60 mt-3">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{resolveLocation(incident.description)}</span>
                      </div>

                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          className="mt-6 pt-6 border-t border-white/10 space-y-8"
                          onClick={e => e.stopPropagation()} 
                        >
                          {/* AI Analysis */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-3">
                              <Sparkles className="w-3.5 h-3.5 text-white/60" />
                              <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/60">AI Analysis</h4>
                            </div>
                            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                              <p className="text-[13px] text-white/70 leading-relaxed font-medium">
                                {incident.ai_summary || 'Analysis pending or not provided by reporter.'}
                              </p>
                            </div>
                          </div>

                          {/* Action Groups */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-3">Assign Team</h4>
                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={() => handleAssign(incident.id, 'security')}
                                  className={cn("flex-1 h-10 rounded-xl border flex items-center justify-center gap-2 transition-colors text-[11px] font-bold uppercase tracking-widest", 
                                    incident.assigned_team === 'security' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                                  )}
                                >
                                  <Shield className="w-3.5 h-3.5" /> Security
                                </button>
                                <button 
                                  onClick={() => handleAssign(incident.id, 'medical')}
                                  className={cn("flex-1 h-10 rounded-xl border flex items-center justify-center gap-2 transition-colors text-[11px] font-bold uppercase tracking-widest", 
                                    incident.assigned_team === 'medical' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                                  )}
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" /> Medical
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-3">Update Status</h4>
                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={() => handleStatusChange(incident.id, incident.status, 'in_progress')}
                                  disabled={incident.status === 'in_progress'}
                                  className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90 disabled:opacity-40 disabled:hover:bg-white/5 transition-colors text-[11px] font-bold uppercase tracking-widest"
                                >
                                  In Progress
                                </button>
                                <button 
                                  onClick={() => {
                                    handleStatusChange(incident.id, incident.status, 'resolved');
                                    setExpandedId(null);
                                  }}
                                  className="flex-1 h-10 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors text-[11px] font-bold uppercase tracking-widest"
                                >
                                  Resolve
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Note */}
                          <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-3">Ops Log Note</h4>
                            <div className="flex gap-2">
                              <label htmlFor={`note-${incident.id}`} className="sr-only">Incident Note</label>
                              <input 
                                id={`note-${incident.id}`}
                                type="text" 
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Record an update or action taken..." 
                                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-[13px] w-full focus:outline-none focus:border-white/30 text-white placeholder-white/40 font-medium"
                                onKeyDown={e => { if (e.key === 'Enter') handleAddNote(incident.id) }}
                              />
                              <button 
                                aria-label="Send note"
                                onClick={() => handleAddNote(incident.id)}
                                disabled={!noteText.trim()}
                                className="w-12 shrink-0 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10 disabled:opacity-50"
                              >
                                <Send className="w-4 h-4 text-white/80" />
                              </button>
                            </div>
                          </div>

                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
