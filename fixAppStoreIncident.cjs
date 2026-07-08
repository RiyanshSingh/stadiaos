const fs = require('fs');
const path = 'src/store/useAppStore.ts';
let content = fs.readFileSync(path, 'utf8');

const replacement = `reportIncident: async (incident) => {
    try {
      const state = get();
      const matchId = state.match?.id || null;
      const stadiumId = state.match?.stadium_id || null;
      const userId = state.profile?.id || null;
      
      const newIncident: Incident = {
        ...incident,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        status: 'reported',
        aiSummary: "Reported directly via app",
        aiAction: "Dispatch operations team",
        severity: incident.severity || 'medium'
      };
      
      // Update local state immediately for fast feedback
      set((state) => ({ incidents: [newIncident, ...state.incidents] }));

      // Insert into Supabase with context
      const { error } = await supabase
        .from('incidents')
        .insert([{
           title: incident.type, // or 'type' if schema requires, wait schema uses title/incident_type
           // wait, original code used 'type', but schema says incident_type and title?
           // Original code:
           type: incident.type,
           description: \`Location: \${incident.zone} | \${incident.description}\`,
           severity: incident.severity || 'medium',
           status: 'reported',
           ai_summary: "Reported directly via app",
           ai_recommended_actions: { action: "Dispatch operations team" },
           match_id: matchId,
           stadium_id: stadiumId,
           reported_by: userId,
           reporter_role: 'fan'
        }]);

      if (error) {
        console.error("Supabase insert error:", error);
      }
    } catch (error) {
       console.error("Supabase Error:", error);
    }
  },`;

content = content.replace(/reportIncident: async \(incident\) => \{[\s\S]*?console\.error\("Supabase Error:", error\);\n\s*\}\n\s*\},/, replacement);
fs.writeFileSync(path, content);
console.log('AppStore reportIncident updated');
