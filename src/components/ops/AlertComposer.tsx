import { useState } from 'react';
import { Megaphone, Send, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { opsService } from '@/services/opsService';
import { useAuthService } from '@/services/authService';

export function AlertComposer() {
  const { matchId, opsStadiumId: stadiumId } = useAuthService();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!matchId || !stadiumId || !title.trim() || !content.trim() || publishing) return;
    
    setPublishing(true);
    setErrorMsg(null);
    try {
      await opsService.publishPublicAdvisory(matchId, stadiumId, title, content);
      setSuccess(true);
      setTitle('');
      setContent('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to publish advisory');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section aria-label="Advisory Broadcast Form">
      <h2 className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-4 px-2">Public Advisory Broadcast</h2>
      
      <Card className="glass-card p-6 border border-white/5 rounded-3xl bg-white/[0.02]">
        <div className="space-y-6">
          {errorMsg && (
            <div role="alert" className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200/90 text-[13px] font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="advisory-title" className="text-[10px] text-white/60 uppercase tracking-widest font-bold block mb-2">Headline</label>
            <input 
              id="advisory-title"
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Delays on East Concourse" 
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white font-medium w-full focus:outline-none focus:border-white/30 transition-colors placeholder-white/40"
            />
          </div>
          <div>
            <label htmlFor="advisory-content" className="text-[10px] text-white/60 uppercase tracking-widest font-bold block mb-2">Message</label>
            <textarea 
              id="advisory-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Provide context and instructions for fans..." 
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white font-medium w-full h-24 resize-none focus:outline-none focus:border-white/30 transition-colors placeholder-white/40 custom-scrollbar"
            />
          </div>
          
          <button 
            onClick={handlePublish}
            disabled={!title.trim() || !content.trim() || publishing || success}
            className="w-full h-12 bg-white text-black font-bold rounded-xl text-[13px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 disabled:bg-white/10 disabled:text-white transition-all"
          >
            {publishing ? 'Broadcasting...' : success ? <><CheckCircle2 className="w-4 h-4" /> Broadcast Sent</> : <><Send className="w-4 h-4" /> Broadcast Advisory</>}
          </button>
        </div>
      </Card>
    </section>
  );
}
