const fs = require('fs');

const path = 'seed.sql';
let content = fs.readFileSync(path, 'utf8');

const additionalStadiums = `
('11111111-2222-2222-2222-222222222221', 'Wembley Stadium', 'London', 'UK', 90000, ''),
('11111111-2222-2222-2222-222222222222', 'Camp Nou', 'Barcelona', 'Spain', 99354, ''),
('11111111-2222-2222-2222-222222222223', 'Santiago Bernabéu', 'Madrid', 'Spain', 81044, ''),
('11111111-2222-2222-2222-222222222224', 'Old Trafford', 'Manchester', 'UK', 74310, ''),
('11111111-2222-2222-2222-222222222225', 'Anfield', 'Liverpool', 'UK', 61276, ''),
('11111111-2222-2222-2222-222222222226', 'Etihad Stadium', 'Manchester', 'UK', 53400, ''),
('11111111-2222-2222-2222-222222222227', 'Allianz Arena', 'Munich', 'Germany', 75000, ''),
('11111111-2222-2222-2222-222222222228', 'Signal Iduna Park', 'Dortmund', 'Germany', 81365, ''),
('11111111-2222-2222-2222-222222222229', 'San Siro', 'Milan', 'Italy', 80018, ''),
('11111111-2222-2222-2222-22222222222a', 'Parc des Princes', 'Paris', 'France', 47929, ''),
('11111111-2222-2222-2222-22222222222b', 'Johan Cruyff Arena', 'Amsterdam', 'Netherlands', 55500, ''),
('11111111-2222-2222-2222-22222222222c', 'Lusail Stadium', 'Lusail', 'Qatar', 88966, ''),
('11111111-2222-2222-2222-22222222222d', 'Maracanã', 'Rio de Janeiro', 'Brazil', 78838, ''),
('11111111-2222-2222-2222-22222222222e', 'Estadio Azteca', 'Mexico City', 'Mexico', 87523, ''),
('11111111-2222-2222-2222-22222222222f', 'Tottenham Hotspur Stadium', 'London', 'UK', 62850, ''),
('11111111-3333-3333-3333-333333333330', 'Stamford Bridge', 'London', 'UK', 40341, ''),
('11111111-3333-3333-3333-333333333331', 'Emirates Stadium', 'London', 'UK', 60704, ''),
('11111111-3333-3333-3333-333333333332', 'Stadio Olimpico', 'Rome', 'Italy', 70634, ''),
('11111111-3333-3333-3333-333333333333', 'Celtic Park', 'Glasgow', 'Scotland', 60411, ''),
('11111111-3333-3333-3333-333333333334', 'Ibrox', 'Glasgow', 'Scotland', 50817, ''),
('11111111-3333-3333-3333-333333333335', 'Wanda Metropolitano', 'Madrid', 'Spain', 70460, '')
`;

content = content.replace(
  "('11111111-1111-1111-1111-111111111111', 'Luzhniki Stadium', 'Moscow', 'Russia', 81000, 'Main stadium for the event');",
  "('11111111-1111-1111-1111-111111111111', 'Luzhniki Stadium', 'Moscow', 'Russia', 81000, 'Main stadium for the event'),\n" + additionalStadiums.trim() + ";"
);

let matchesBlock = "('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Final Match', 'Team A', 'Team B', '2026-07-15', '2026-07-15T18:00:00Z', 'scheduled'),\n('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Semi-Final Match', 'Team C', 'Team D', '2026-07-10', '2026-07-10T18:00:00Z', 'scheduled')";

// Generate a match for each additional stadium
const extraMatches = [];
for (let i = 1; i <= 21; i++) {
  const hexChar = i < 16 ? i.toString(16) : (i === 16 ? '0' : (i-16).toString());
  const stadiumIdSuffix = i < 16 ? `2222-2222-2222-22222222222${hexChar}` : `3333-3333-3333-33333333333${hexChar}`;
  const stadiumId = `11111111-${stadiumIdSuffix}`;
  
  const matchId = `22222222-3333-3333-3333-3333333333${i < 10 ? '0'+i : i}`;
  extraMatches.push(`('${matchId}', '${stadiumId}', 'Upcoming Match', 'Home Team', 'Away Team', '2026-08-01', '2026-08-01T20:00:00Z', 'scheduled')`);
}

content = content.replace(
  matchesBlock + ";",
  matchesBlock + ",\n" + extraMatches.join(',\n') + ";"
);

fs.writeFileSync(path, content);
console.log('seed.sql updated with 20+ stadiums and matches');
