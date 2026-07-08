import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ShieldAlert } from 'lucide-react';
import { supabase } from '@/services/supabase';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (matchId: string) => void;
  stadiumId: string | null;
}

export function CreateMatchModal({ isOpen, onClose, onSuccess, stadiumId }: CreateMatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [startTime, setStartTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!title || !stadiumId || !startTime) {
        throw new Error('Please fill in all required fields.');
      }
      
      const today = new Date().toISOString().split('T')[0];
      const startIso = new Date(`${today}T${startTime}`).toISOString();

      const { data, error: insertError } = await supabase
        .from('matches')
        .insert([{
          title,
          stadium_id: stadiumId,
          home_team: homeTeam,
          away_team: awayTeam,
          match_date: today,
          start_time: startIso,
          status: 'scheduled'
        }])
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      if (data) {
        onSuccess(data.id);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#111] border border-white/10 p-6 rounded-3xl shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold tracking-tight mb-1 text-white">Create New Match</h2>
          <p className="text-white/50 text-sm mb-6">Initialize a new operations context for an upcoming event.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 items-center">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest pl-1">Match Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g. World Cup Final" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest pl-1">Home Team</label>
                <input value={homeTeam} onChange={e => setHomeTeam(e.target.value)} type="text" placeholder="Team A" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest pl-1">Away Team</label>
                <input value={awayTeam} onChange={e => setAwayTeam(e.target.value)} type="text" placeholder="Team B" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30" />
              </div>
            </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest pl-1">Start Time *</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/70" />
                  <input required value={startTime} onChange={e => setStartTime(e.target.value)} type="time" className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/30" style={{ colorScheme: 'dark' }} />
                </div>
              </div>

            <button disabled={loading} type="submit" className="w-full mt-6 bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-white/90 transition-colors disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Match'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
