/**
 * Haptic feedback utility using the Vibration API
 * Provides tactile feedback for touch interactions on mobile devices
 */

export const haptics = {
  /**
   * Light haptic feedback (10ms)
   * Use for: Button taps, selection changes
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium haptic feedback (20ms)
   * Use for: Navigation changes, toggle switches
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy haptic feedback (30ms, pause, 30ms)
   * Use for: Important confirmations, warnings
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },

  /**
   * Success haptic pattern (10ms, pause, 10ms)
   * Use for: Successful actions, form submissions
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error haptic pattern (50ms, pause, 50ms)
   * Use for: Errors, failed validations
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  },

  /**
   * Selection haptic feedback (5ms)
   * Use for: Selecting items from a list, swiping
   */
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },

  /**
   * Check if vibration is supported
   */
  isSupported: (): boolean => {
    return 'vibrate' in navigator;
  },
};
