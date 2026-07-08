const { createClient } = require('@supabase/supabase-js');
const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function runSeed() {
  // Insert Semi-Final Match
  let res = await supabase.from('matches').insert([{
    id: '22222222-2222-2222-2222-222222222223',
    stadium_id: '11111111-1111-1111-1111-111111111111',
    title: 'Semi-Final Match',
    home_team: 'Team C',
    away_team: 'Team D',
    match_date: '2026-07-10',
    start_time: '2026-07-10T18:00:00Z',
    status: 'scheduled'
  }]);
  console.log('Match insert:', res.error ? res.error : 'Success');

  // Insert Accessible Fan
  res = await supabase.from('profiles').insert([{
    id: '44444444-4444-4444-4444-444444444445',
    full_name: 'Accessible Fan',
    email: 'accessible@nexora.app',
    role: 'fan'
  }]);
  console.log('Profile insert:', res.error ? res.error : 'Success');

  // Insert Ticket for Accessible Fan
  res = await supabase.from('tickets').insert([{
    id: '77777777-7777-7777-7777-777777777778',
    user_id: '44444444-4444-4444-4444-444444444445',
    match_id: '22222222-2222-2222-2222-222222222223',
    seat_section: '102',
    seat_row: 'A',
    seat_number: '1'
  }]);
  console.log('Ticket insert:', res.error ? res.error : 'Success');
}

runSeed();
