import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

if (!apiKey) {
  console.warn('VITE_GROQ_API_KEY is not set in the environment variables.');
}

// We use dangerouslyAllowBrowser because this is an MVP hackathon project.
// In production, Groq API calls should be routed through a secure backend (e.g., Supabase Edge Functions).
export const groq = new Groq({
  apiKey: apiKey || 'mock-key',
  dangerouslyAllowBrowser: true,
});
