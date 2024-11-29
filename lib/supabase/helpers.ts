import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import type { Profile } from '@/lib/types'

const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Auth Helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) throw error
  return user
}

export const getCurrentProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) throw error
  return data as Profile
}

export const checkRole = async (allowedRoles: string[]) => {
  const profile = await getCurrentProfile()
  if (!profile) return false
  return allowedRoles.includes(profile.role)
}

// Database Helpers
export const getProfileById = async (id: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Profile
}

// Error Handling Helper
export const handleSupabaseError = (error: any) => {
  if (error.code === 'PGRST116') {
    return 'Resource not found'
  }
  if (error.code === '23505') {
    return 'This record already exists'
  }
  return error.message || 'An unexpected error occurred'
} 