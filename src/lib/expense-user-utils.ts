/**
 * Helper function to extract user name from various expense user_name formats
 */
export const extractUserName = (user_name: any): string => {
  if (!user_name) {
    return 'Unknown User';
  }

  // Handle array format (legacy)
  if (Array.isArray(user_name)) {
    const firstUser = user_name[0];
    if (firstUser && typeof firstUser === 'object' && firstUser.full_name) {
      return firstUser.full_name;
    }
    return 'Unknown User';
  }

  // Handle object format
  if (typeof user_name === 'object' && user_name.full_name) {
    return user_name.full_name;
  }

  // Handle string format
  if (typeof user_name === 'string') {
    return user_name;
  }

  return 'Unknown User';
};