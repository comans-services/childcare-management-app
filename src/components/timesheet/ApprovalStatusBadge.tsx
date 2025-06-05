
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Lock } from "lucide-react";
import { TimesheetEntry } from "@/lib/timesheet-service";

interface ApprovalStatusBadgeProps {
  entry: TimesheetEntry;
  showIcon?: boolean;
}

const ApprovalStatusBadge: React.FC<ApprovalStatusBadgeProps> = ({ 
  entry, 
  showIcon = true 
}) => {
  const getStatusConfig = () => {
    switch (entry.approval_status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          text: 'Pending Approval',
          className: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'approved':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          text: 'Approved',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          text: 'Rejected',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          text: 'Approved',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
    }
  };

  // Don't show badge for approved non-weekend entries
  if (entry.approval_status === 'approved' && !entry.requires_approval) {
    return null;
  }

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} text-xs`}>
      {showIcon && <IconComponent className="h-3 w-3 mr-1" />}
      {config.text}
    </Badge>
  );
};

export default ApprovalStatusBadge;
