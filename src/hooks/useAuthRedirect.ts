
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to manage authentication redirect logic
 * Saves the current path when user needs to authenticate
 * and clears it when appropriate
 */
export const useAuthRedirect = () => {
  const location = useLocation();

  // Save current path as intended destination (except for auth page)
  const saveIntendedPath = (path: string) => {
    if (path !== '/auth') {
      localStorage.setItem('intended_path', path);
      console.log(`Saved intended path: ${path}`);
    }
  };

  // Get the intended path for redirect after authentication
  const getIntendedPath = (): string => {
    const intendedPath = localStorage.getItem('intended_path');
    
    // Default fallback to /timesheet if no intended path
    if (!intendedPath || intendedPath === '/auth') {
      return '/timesheet';
    }
    
    return intendedPath;
  };

  // Clear the intended path after successful redirect
  const clearIntendedPath = () => {
    localStorage.removeItem('intended_path');
    console.log('Cleared intended path');
  };

  return {
    saveIntendedPath,
    getIntendedPath,
    clearIntendedPath,
    currentPath: location.pathname
  };
};
