export function parseGroqRecommendations(content: string, matchId: string): any[] {
  try {
    const parsed = JSON.parse(content || '{"recommendations":[]}');
    const recs = parsed.recommendations || parsed;
    return (Array.isArray(recs) ? recs : []).map((r: any, idx: number) => ({
      id: `gen-${idx}`,
      match_id: matchId,
      stadium_id: '11111111-1111-1111-1111-111111111111',
      recommendation_type: r.recommendation_type || 'general',
      title: r.title || 'Tip',
      content: r.content || 'Enjoy the match!',
      created_at: new Date().toISOString()
    }));
  } catch (e) {
    console.error('Failed to parse Groq recommendations:', e);
    return [];
  }
}
