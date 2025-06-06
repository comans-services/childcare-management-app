
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-mobile';

export interface LayoutPreferences {
  gridDensity: 'compact' | 'comfortable' | 'spacious';
  sidebarCollapsed: boolean;
  viewMode: 'grid' | 'list';
  cardsPerRow: number;
}

const STORAGE_KEY = 'layout-preferences';

const getDefaultPreferences = (screenWidth: number): LayoutPreferences => {
  // Smart defaults based on screen size
  if (screenWidth < 768) {
    return {
      gridDensity: 'compact',
      sidebarCollapsed: true,
      viewMode: 'list',
      cardsPerRow: 1,
    };
  } else if (screenWidth < 1024) {
    return {
      gridDensity: 'comfortable',
      sidebarCollapsed: false,
      viewMode: 'grid',
      cardsPerRow: 2,
    };
  } else if (screenWidth < 1440) {
    return {
      gridDensity: 'comfortable',
      sidebarCollapsed: false,
      viewMode: 'grid',
      cardsPerRow: 3,
    };
  } else {
    return {
      gridDensity: 'spacious',
      sidebarCollapsed: false,
      viewMode: 'grid',
      cardsPerRow: 4,
    };
  }
};

export const useLayoutPreferences = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [preferences, setPreferences] = useState<LayoutPreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall back to defaults if parsing fails
      }
    }
    return getDefaultPreferences(window.innerWidth);
  });

  // Update defaults when screen size changes significantly
  useEffect(() => {
    const handleResize = () => {
      const newDefaults = getDefaultPreferences(window.innerWidth);
      
      // Only update if user hasn't customized preferences
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setPreferences(newDefaults);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = <K extends keyof LayoutPreferences>(
    key: K,
    value: LayoutPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPreferences(getDefaultPreferences(window.innerWidth));
  };

  return {
    preferences,
    updatePreference,
    resetToDefaults,
    isMobile,
  };
};
