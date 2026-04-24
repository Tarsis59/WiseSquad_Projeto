import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'blog_posts',
  'linkedin_posts',
  'youtube_scripts',
  'reels_copies',
  'short_video_scripts',
  'substack_posts'
];

async function addStatusColumn() {
  for (const table of tables) {
    console.log(`Adding status to ${table}...`);
    const { error } = await supabase.rpc('exec_sql', { 
        sql_query: `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';` 
    });
    if (error) {
        console.error(`Error adding status to ${table}:`, error);
        // Fallback: Try a raw query via postgrest if possible (unlikely)
    } else {
        console.log(`Success for ${table}`);
    }
  }
}

addStatusColumn();
