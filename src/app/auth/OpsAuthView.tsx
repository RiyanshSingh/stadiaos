import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Loader2, AlertTriangle, Fingerprint } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import { useAuthService } from '@/services/authService'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function OpsAuthView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId, role, initAuth } = useAuthService()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [_fullName, _setFullName] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // No onboarding for Ops

  // Auto-redirect if already logged in and role resolved
  useEffect(() => {
    if (userId && role) {
      if (role === 'ops_manager') {
        const from = (location.state as any)?.from?.pathname;
        navigate(from && from.startsWith('/ops') ? from : '/ops', { replace: true });
      } else if (role === 'fan') {
        // Log them out!
        supabase.auth.signOut().then(() => {
          initAuth();
          setError('Fans are not authorized for Ops access. Please log out and use the Fan portal.');
        });
      }
    }
  }, [userId, role, navigate, location, initAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-xl">
              <ShieldAlert className="w-8 h-8 text-white/90" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Command Center</h1>
            <p className="text-[13px] text-white/50 uppercase tracking-widest font-bold">
              Ops Identity Gateway
            </p>
          </div>

          <Card className="glass-card p-6 rounded-[2rem] border border-white/10 bg-white/[0.02] shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-[13px] text-red-200/90 leading-tight font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 mb-2">
                      <ShieldAlert className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-[13px] text-green-200/90 leading-tight font-medium">{successMsg}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>



              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-1">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-black/50 border border-white/10 rounded-2xl px-4 text-[15px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="fan@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="auth-password" className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-1">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-black/50 border border-white/10 rounded-2xl px-4 text-[15px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full h-12 mt-2 bg-white text-black rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                  loading ? "opacity-70 cursor-not-allowed" : "hover:bg-white/90"
                )}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Authenticate
                  </>
                )}
              </button>
            </form>


          </Card>
          
          <div className="mt-8 text-center text-[11px] text-white/60 uppercase tracking-widest font-bold">
            <p>Secure StadiaOS Access</p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
