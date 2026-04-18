import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://fcrtzswemstynglxcele.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'PLACEHOLDER_KEY_MISSING'; // Use string literal to avoid crash if env is missing

if (supabaseAnonKey === 'PLACEHOLDER_KEY_MISSING') {
  console.warn("CRITICAL: Supabase Anon Key is missing. Database operations will fail. Please add VITE_SUPABASE_ANON_KEY to your environment variables in Settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Tables = {
  users: {
    uid: string;
    email: string;
    display_name: string;
    role: string;
    purchased_bundle_ids: string[];
    favorite_ids: string[];
    created_at?: string;
  };
  contents: {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    author: string;
    category: string;
    is_free: boolean;
    bundle_id?: string;
    file_id_primary?: string;
    file_id_backup?: string;
    preview_id?: string;
    user_id: string;
    status: string;
    created_at?: string;
  };
  bundles: {
    id: string;
    name: string;
    price: number;
    description: string;
    content_ids: string[];
  };
};
