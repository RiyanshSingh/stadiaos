export const VENUE_FAQ: Record<string, string> = {
  'allowed items': 'You can bring in clear bags up to 12"x6"x12" and small clutch purses up to 4.5"x6.5". Small personal power banks are permitted.',
  'bag policy': 'Only clear bags up to 12"x6"x12" and small clutch purses up to 4.5"x6.5" are allowed inside the venue.',
  'power bank': 'Small personal power banks are permitted in the stadium. Ensure they fit within the allowed bag dimensions.',
  'accessibility': 'Accessible seating and pathways are available throughout the venue. Elevators are located near Gates A, C, and F. For immediate assistance, please use the Report feature in the app.',
  'lost and found': 'Lost & Found is located at the Guest Services desk near Gate C. Any found items are held there until the end of the event.',
  'emergency assistance': 'In case of an emergency, please use the Copilot to report an incident or approach the nearest staff member. Medical stations are located near Sections 105, 214, and 330.',
};

export function getVenueFaqAnswer(question: string): string {
  const normalized = question.toLowerCase();
  for (const [key, answer] of Object.entries(VENUE_FAQ)) {
    if (normalized.includes(key)) {
      return answer;
    }
  }
  return "I don't have the specific policy for that. Please check with a guest services staff member near any main gate.";
}
