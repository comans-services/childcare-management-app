import { useAuth } from "@/context/AuthContext";

/**
 * Hook to check user's employment type
 */
export const useEmploymentType = () => {
  const { employmentType } = useAuth();

  const isFullTime = employmentType === "full-time";
  const isPartTime = employmentType === "part-time";

  return {
    employmentType,
    isFullTime,
    isPartTime,
  };
};