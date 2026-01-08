/**
 * Supabase Client Configuration
 * 
 * Provides authenticated Supabase client for frontend operations.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
    )
}

export const supabase: SupabaseClient = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)

/**
 * Get the current session access token for API calls.
 */
export async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
}

/**
 * Create headers with authorization for API calls.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken()
    return token
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' }
}
