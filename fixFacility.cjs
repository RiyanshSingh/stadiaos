const fs = require('fs');
const path = 'src/services/facilityService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'async fetchFacilities(stadiumId: string, matchId: string): Promise<Facility[]> {',
  `async fetchFacilities(stadiumId: string, matchId: string): Promise<Facility[]> {
    // HYBRID TEMPLATE ARCHITECTURE
    const TEMPLATE_STADIUM_ID = '11111111-1111-1111-1111-111111111111';
    const activeStadiumId = TEMPLATE_STADIUM_ID;
`
);
content = content.replace(
  /.eq\('stadium_id', stadiumId\)/g,
  `.eq('stadium_id', activeStadiumId)`
);

fs.writeFileSync(path, content);
console.log('facilityService updated');
