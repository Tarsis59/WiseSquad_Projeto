import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('URL or Key missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data: sample, error: queryError } = await supabase.from('blog_posts').select('*').limit(1);
  if (queryError) {
      console.error(queryError);
      return;
  }
  console.log('Columns:', Object.keys(sample[0] || {}));
}

checkColumns();
