
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { formatDateDisplay } from "@/lib/date-utils";
import { Contract, updateContractStatus } from "@/lib/contract-service";
import {
  Edit,
  Trash2,
  Check,
  AlertTriangle,
  X,
  Info,
  FileText
} from "lucide-react";
import CustomerSelector from "../customers/CustomerSelector";

interface ContractListProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
}

const ContractList: React.FC<ContractListProps> = ({
  contracts,
  onEdit,
  onDelete,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Handle changing active status
  const handleStatusChange = async (contract: Contract, isActive: boolean) => {
    try {
      await updateContractStatus(contract.id, isActive);
      
      toast({
        title: `Contract ${isActive ? "activated" : "deactivated"}`,
        description: `${contract.name} has been ${isActive ? "activated" : "deactivated"}.`,
        variant: "default",
      });
      
      // Refresh contracts data
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    } catch (error) {
      console.error("Error updating contract status:", error);
      toast({
        title: "Error",
        description: "Failed to update contract status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Get appropriate badge for contract status
  const getStatusBadge = (contract: Contract) => {
    switch(contract.status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-300"><Check className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'pending_renewal':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-300"><AlertTriangle className="w-3 h-3 mr-1" /> Renewal Due</Badge>;
      case 'renewed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-300"><Info className="w-3 h-3 mr-1" /> Renewed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-300"><X className="w-3 h-3 mr-1" /> Expired</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow
              key={contract.id}
              className={contract.is_active ? "" : "opacity-60"}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  {contract.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {getStatusBadge(contract)}
                  {contract.status === 'pending_renewal' && (
                    <div className="ml-2 text-xs text-orange-600">
                      {contract.days_until_expiry} days
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {contract.customer_name || "No customer assigned"}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {contract.services && contract.services.length > 0 ? (
                    contract.services.slice(0, 3).map((service) => (
                      <Badge key={service.id} variant="secondary" className="text-xs">
                        {service.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No services</span>
                  )}
                  {contract.services && contract.services.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{contract.services.length - 3} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {contract.start_date ? formatDateDisplay(new Date(contract.start_date)) : 'N/A'}
              </TableCell>
              <TableCell>
                <div className={`${contract.status === 'pending_renewal' ? 'text-orange-600' : contract.status === 'expired' ? 'text-red-600' : ''}`}>
                  {contract.end_date ? formatDateDisplay(new Date(contract.end_date)) : 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                <Switch 
                  checked={contract.is_active} 
                  onCheckedChange={(checked) => handleStatusChange(contract, checked)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(contract)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(contract)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContractList;
