import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { useIncidentService } from '@/services/incidentService'
import { useAuthService } from '@/services/authService'
import { cn } from '@/lib/utils'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export function ReportIncident() {
  const navigate = useNavigate()
  const { reportIncident } = useIncidentService()
  const { matchId, stadiumId, userId, role } = useAuthService()
  
  const [type, setType] = useState('medical')
  const [zone, setZone] = useState('Section 214')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('urgent')
  const [contactPref, setContactPref] = useState('in_app')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || isSubmitting || !matchId || !stadiumId || !userId || !role) return
    setIsSubmitting(true)

    try {
      await reportIncident({
        type,
        zone,
        description
      }, matchId, stadiumId, userId, role)
      
      // Simple success alert, then navigate back
      alert('Incident reported successfully. Help is on the way.')
      navigate(-1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative pb-32 overflow-hidden">
      {/* Background glow effects removed */}
      
      {/* Header */}
      <header className="px-6 pt-12 pb-4 border-b border-white/5 flex items-center gap-4 relative z-10">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <div>
          <h1 className="text-xl font-medium tracking-tight">Report Incident</h1>
          <p className="text-xs text-white/50">Notify operations immediately</p>
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 relative z-10"
      >
        <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex gap-4 items-start text-white">
          <AlertTriangle className="w-5 h-5 shrink-0 text-white/70 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">For immediate life-threatening emergencies, please call local emergency services directly.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <motion.div variants={itemVariants} className="space-y-3">
            <label className="text-sm font-medium text-white/70 tracking-tight">Type of Incident</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'medical', label: 'Medical' },
                { id: 'security', label: 'Security' },
                { id: 'lost_person', label: 'Lost Person' },
                { id: 'accessibility', label: 'Accessibility' },
                { id: 'maintenance', label: 'Maintenance' },
                { id: 'crowd', label: 'Crowd/Queue' },
                { id: 'suspicious_item', label: 'Suspicious Item' },
                { id: 'other', label: 'Other' }
              ].map((t) => (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "relative p-3.5 rounded-2xl border cursor-pointer text-center transition-all duration-300 overflow-hidden font-medium text-sm tracking-tight",
                    type === t.id 
                      ? "border-white/50 text-white bg-white/5" 
                      : "border-white/5 hover:border-white/20 text-white/70"
                  )}
                >
                  {type === t.id && (
                    <motion.div 
                      layoutId="incidentTypeBg" 
                      className="absolute inset-0 bg-white/10" 
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <label className="text-sm font-medium text-white/70 tracking-tight">Location</label>
            <Input 
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="glass-input h-14 rounded-2xl px-5 text-base"
              placeholder="e.g. Gate C, Section 102"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <label className="text-sm font-medium text-white/70 tracking-tight">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-2xl p-5 text-base min-h-[120px] resize-none text-white placeholder:text-white/30"
              placeholder="Please describe what happened in detail..."
            />
          </motion.div>

          {/* Severity */}
          <motion.div variants={itemVariants} className="space-y-3">
            <label className="text-sm font-medium text-white/70 tracking-tight">Severity</label>
            <div className="grid grid-cols-2 gap-3">
              {['urgent', 'not_urgent'].map((s) => (
                <div 
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "p-3.5 rounded-xl border cursor-pointer text-center font-medium text-sm transition-all",
                    severity === s 
                      ? s === 'urgent' ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-white/10 border-white/50 text-white"
                      : "bg-white/5 border-white/5 text-white/50"
                  )}
                >
                  {s === 'urgent' ? 'Urgent' : 'Not Urgent'}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact Preference */}
          <motion.div variants={itemVariants} className="space-y-3">
            <label className="text-sm font-medium text-white/70 tracking-tight">Contact Preference (Optional)</label>
            <div className="grid grid-cols-2 gap-3">
              {['in_app', 'call'].map((c) => (
                <div 
                  key={c}
                  onClick={() => setContactPref(c)}
                  className={cn(
                    "p-3.5 rounded-xl border cursor-pointer text-center font-medium text-sm transition-all",
                    contactPref === c 
                      ? "bg-white/10 border-white/50 text-white" 
                      : "bg-white/5 border-white/5 text-white/50"
                  )}
                >
                  {c === 'in_app' ? 'In-App Only' : 'Call Me'}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!description.trim() || isSubmitting}
              className="w-full relative overflow-hidden bg-white text-black font-semibold py-4 rounded-2xl disabled:opacity-50 hover:bg-white/90 transition-all tracking-tight text-lg"
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
                  </motion.div>
                ) : (
                  <motion.span 
                    key="text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Submit Report
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
