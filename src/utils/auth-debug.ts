
/**
 * Utility functions for debugging authentication state and user roles
 */

export const logAuthState = (context: string) => {
  const authData = localStorage.getItem('supabase.auth.token');
  const sessionData = sessionStorage?.getItem('supabase.auth.token');
  
  console.log(`=== AUTH DEBUG - ${context.toUpperCase()} ===`);
  console.log('Current URL:', window.location.href);
  console.log('localStorage auth keys:', Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth')));
  console.log('sessionStorage auth keys:', Object.keys(sessionStorage || {}).filter(key => key.includes('supabase') || key.includes('auth')));
  console.log('Has localStorage auth token:', !!authData);
  console.log('Has sessionStorage auth token:', !!sessionData);
  
  // Parse and log user info if available
  try {
    if (authData) {
      const parsed = JSON.parse(authData);
      console.log('User from localStorage:', {
        id: parsed.user?.id,
        email: parsed.user?.email,
        role: parsed.user?.user_metadata?.role || parsed.user?.app_metadata?.role,
        expires_at: parsed.expires_at
      });
    }
  } catch (error) {
    console.log('Error parsing auth data:', error);
  }
};

export const logUserRoleDetection = (userRole: string | null, source: string) => {
  console.log(`=== USER ROLE DEBUG - ${source.toUpperCase()} ===`);
  console.log('Detected user role:', userRole);
  console.log('Is admin?:', userRole === 'admin');
  console.log('Is employee?:', userRole === 'employee');
  console.log('Role source:', source);
};
