import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// We don't throw here anymore so the app can at least render (with mock data)
// even if the environment variables are missing.
export const supabase = createClient(supabaseUrl, supabaseKey)
