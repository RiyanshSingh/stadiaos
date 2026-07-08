const fs = require('fs');

const path = 'src/services/bootstrapService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `        let matchData = null;
        if (ticketData?.matches) {
           // Restructure match data to fit domain type if needed, or just pass it
           matchData = ticketData.matches;
           matchData.stadium_name = matchData.stadiums?.name;
        }`,
  `        let matchData = null;
        if (ticketData) {
           const { data: mData } = await supabase.from('matches').select('*').eq('id', ticketData.match_id).single();
           if (mData) {
             const { data: sData } = await supabase.from('stadiums').select('name').eq('id', mData.stadium_id).single();
             matchData = { ...mData, title: mData.title || (sData ? sData.name + ' Match' : 'Match') };
             matchData.stadium_name = sData?.name;
           }
        }`
);

fs.writeFileSync(path, content);
console.log('bootstrapService fixed');
