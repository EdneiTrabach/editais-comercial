import { supabase } from '@/lib/supabase'

export const debugAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.group('Debug Auth')
    console.log('Sessão:', !!session)
    console.log('User:', user?.email)
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      console.log('Role:', profile?.role)
      console.log('StoredRole:', localStorage.getItem('userRole'))
    }
    console.groupEnd()
    
    return { session, user }
  } catch (error) {
    console.error('Erro no debug:', error)
    return { session: null, user: null }
  }
}