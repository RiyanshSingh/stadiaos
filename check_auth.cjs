const { createClient } = require('@supabase/supabase-js');
const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function testAuth() {
  console.log('Testing Supabase Auth...');
  const { data, error } = await supabase.auth.signUp({
    email: 'fan@nexora.app',
    password: 'password123'
  });
  console.log('SignUp result:', data, error);
}

testAuth();
