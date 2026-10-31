import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mjoumzpaefajbukdford.supabase.co',
  'sb_publishable_0Y6Yj4rpurV96Qy9lUGjCA_0rnLxnmo'
);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles table check:', { error: error?.message, hasData: !!data });
}

check();
