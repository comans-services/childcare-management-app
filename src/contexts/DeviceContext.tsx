import React, { createContext, useContext, ReactNode } from "react";
import { useResponsive, ResponsiveState } from "@/hooks/use-responsive";
import { useTouchDetection, TouchCapabilities } from "@/hooks/use-touch-detection";
import { useViewport, ViewportState } from "@/hooks/use-viewport";

export interface DeviceContextValue {
  responsive: ResponsiveState;
  touch: TouchCapabilities;
  viewport: ViewportState;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export interface DeviceProviderProps {
  children: ReactNode;
}

export function DeviceProvider({ children }: DeviceProviderProps) {
  const responsive = useResponsive();
  const touch = useTouchDetection();
  const viewport = useViewport();

  const value: DeviceContextValue = {
    responsive,
    touch,
    viewport,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextValue {
  const context = useContext(DeviceContext);

  if (context === undefined) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }

  return context;
}

// Convenience hooks for specific device capabilities
export function useDeviceResponsive(): ResponsiveState {
  const { responsive } = useDevice();
  return responsive;
}

export function useDeviceTouch(): TouchCapabilities {
  const { touch } = useDevice();
  return touch;
}

export function useDeviceViewport(): ViewportState {
  const { viewport } = useDevice();
  return viewport;
}
