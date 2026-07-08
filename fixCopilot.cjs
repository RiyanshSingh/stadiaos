const fs = require('fs');
const path = 'src/features/fan-assistant/FanCopilot.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix currentZoneId hardcode
content = content.replace(
  "const currentZoneId = 'MetLife'",
  "const currentZoneId = match?.title || 'Event'"
);

// Fix Incident Location payload
const newIncidentPayload = `        { type: data.incidentType, zone: data.locationLabel || (ticketValid ? \`Sec \${ticket.seat_section}, Row \${ticket.seat_row}\` : 'Unknown'), description: \`\${ticketValid ? 'Reported from Sec ' + ticket.seat_section + ', Row ' + ticket.seat_row + ' | ' : ''}\${data.description}\` },`;
content = content.replace(/\{ type: data\.incidentType, zone: data\.locationLabel, description: data\.description \},/, newIncidentPayload);

fs.writeFileSync(path, content);
console.log('FanCopilot updated');
