import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nahbadkzhyveuomwaogw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haGJhZGt6aHl2ZXVvbXdhb2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDAxMzksImV4cCI6MjEwODYxNjEzOX0.3enQL0Gu0gsrR9QwEWP76r7-791-oJVh2tw03QoVmEI';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
