
/**
 * Validates the educator-to-child ratio based on age groups
 * Children from birth to 36 months: 1 educator for every 4 children (1:4)
 * Children aged 36 months to preschool age: 1 educator for every 15 children (1:15)
 */
export const validateEducatorChildRatio = (
  numEducators: number,
  childrenUnder3: number,
  childrenOver3: number
): { isValid: boolean; message: string } => {
  // Calculate required educators for each age group
  const educatorsForUnder3 = Math.ceil(childrenUnder3 / 4);
  const educatorsForOver3 = Math.ceil(childrenOver3 / 15);
  const totalEducatorsRequired = educatorsForUnder3 + educatorsForOver3;

  if (numEducators >= totalEducatorsRequired) {
    return { isValid: true, message: 'Educator-to-child ratio is valid.' };
  }

  return {
    isValid: false,
    message: `Warning: You need at least ${totalEducatorsRequired} educators for ${childrenUnder3} children under 3 and ${childrenOver3} children over 3. Current staff: ${numEducators}.`,
  };
};

/**
 * This function would normally access the client's MAC address and verify it
 * against the allowed MAC address for a specific room. However, due to browser
 * security limitations, directly accessing MAC addresses is not possible.
 *
 * In a real implementation, this would use server-side verification or
 * alternative device fingerprinting that doesn't rely on MAC addresses.
 *
 * For demo purposes, this simulates the MAC address check.
 */
export const verifyRoomAccess = (roomId: string): boolean => {
  // In a real app, this would verify the actual device MAC address
  // For demo purposes, we'll simulate access control

  // For demo, we'll say the current device is allowed for all rooms
  const ROOM_ALLOWED = true;

  return ROOM_ALLOWED;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};
