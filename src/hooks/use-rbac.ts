
import { useAuth } from "@/context/AuthContext";
import { 
  isAdminUser, 
  isStaffUser, 
  canAccessProjects, 
  canAccessContracts, 
  canAccessTeamManagement, 
  canAccessCustomers,
  canManageUserRoles,
  UserRole 
} from "@/lib/rbac-service";

export const useRBAC = () => {
  const { userRole } = useAuth();

  return {
    userRole,
    isAdmin: isAdminUser(userRole),
    isStaff: isStaffUser(userRole),
    canAccessProjects: canAccessProjects(userRole),
    canAccessContracts: canAccessContracts(userRole),
    canAccessTeamManagement: canAccessTeamManagement(userRole),
    canAccessCustomers: canAccessCustomers(userRole),
    canManageUserRoles: canManageUserRoles(userRole),
  };
};
