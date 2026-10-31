import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mjoumzpaefajbukdford.supabase.co',
  'sb_publishable_0Y6Yj4rpurV96Qy9lUGjCA_0rnLxnmo'
);

async function test(domain: string) {
  try {
    const res = await supabase.auth.signUp({
      email: `user_${Date.now()}@${domain}`,
      password: 'TestPassword123!',
      options: {
        data: {
          username: `user_${Date.now()}`,
          display_name: 'Test Student'
        }
      }
    });
    console.log(`Domain ${domain}: User=${res.data?.user?.id}, Session=${!!res.data?.session}, Error=${res.error?.message}`);
  } catch (err: any) {
    console.log(`Domain ${domain}: Threw ${err.message}`);
  }
}

async function run() {
  await test('carchaos.internal');
  await test('carchaos.app');
  await test('carchaos.org');
}

run();
