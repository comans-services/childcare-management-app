import React, { createContext, useContext, useState, ReactNode } from "react";

export interface NavigationContextValue {
  bottomNavVisible: boolean;
  setBottomNavVisible: (visible: boolean) => void;
  hideBottomNav: () => void;
  showBottomNav: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [bottomNavVisible, setBottomNavVisible] = useState(true);

  const hideBottomNav = () => setBottomNavVisible(false);
  const showBottomNav = () => setBottomNavVisible(true);

  const value: NavigationContextValue = {
    bottomNavVisible,
    setBottomNavVisible,
    hideBottomNav,
    showBottomNav,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);

  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }

  return context;
}
