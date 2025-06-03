import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase.mensajeria';

// Usar variables de entorno globales para SSO real
const supabaseUrl = (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY : process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
