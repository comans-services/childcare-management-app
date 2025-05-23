
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
  FileText,
  ChevronDown,
  ChevronUp,
  Upload,
  FileUp,
  Download
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ContractFileUploadDialog from "./ContractFileUploadDialog";
import { supabase } from "@/integrations/supabase/client";

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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // Handle expanding/collapsing a row
  const toggleRowExpansion = (contractId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [contractId]: !prev[contractId]
    }));
  };
  
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

  // Handle file upload click
  const handleFileUploadClick = (contract: Contract) => {
    setSelectedContract(contract);
    setIsFileUploadOpen(true);
  };

  // Handle file download
  const handleFileDownload = async (contract: Contract) => {
    if (!contract.file_url) {
      toast({
        title: "No file available",
        description: "This contract does not have an attached file.",
        variant: "destructive",
      });
      return;
    }

    // Open file URL in a new tab
    window.open(contract.file_url, '_blank');
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
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Services</TableHead>
            <TableHead className="hidden md:table-cell">Start Date</TableHead>
            <TableHead className="hidden md:table-cell">End Date</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <React.Fragment key={contract.id}>
              <TableRow
                className={`${contract.is_active ? "" : "opacity-60"} ${expandedRows[contract.id] ? "bg-muted/30" : ""}`}
              >
                <TableCell className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(contract.id)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedRows[contract.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
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
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {contract.services && contract.services.length > 0 ? (
                      contract.services.slice(0, 2).map((service) => (
                        <Badge key={service.id} variant="secondary" className="text-xs">
                          {service.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">No services</span>
                    )}
                    {contract.services && contract.services.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{contract.services.length - 2} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {contract.start_date ? formatDateDisplay(new Date(contract.start_date)) : 'N/A'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
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
                      onClick={() => handleFileUploadClick(contract)}
                      title="Upload File"
                    >
                      <FileUp className="h-4 w-4 text-blue-500" />
                    </Button>
                    {contract.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFileDownload(contract)}
                        title="Download File"
                      >
                        <Download className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
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
              
              {/* Expandable row with additional details */}
              <TableRow className={expandedRows[contract.id] ? "" : "hidden"}>
                <TableCell colSpan={9} className="bg-muted/20 p-0">
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Contract Details</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Description:</span> {contract.description || 'No description provided'}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {formatDateDisplay(new Date(contract.start_date))} to {formatDateDisplay(new Date(contract.end_date))}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span> {contract.updated_at ? new Date(contract.updated_at).toLocaleDateString() : 'N/A'}
                        </div>

                        {/* File information */}
                        <div>
                          <span className="font-medium">Attached File:</span> {contract.file_name || 'No file attached'}
                          {contract.file_name && (
                            <div className="mt-2 text-xs text-gray-500">
                              <div>Size: {contract.file_size ? `${(contract.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</div>
                              <div>Uploaded: {contract.uploaded_at ? new Date(contract.uploaded_at).toLocaleDateString() : 'Unknown'}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Services</h4>
                      {contract.services && contract.services.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {contract.services.map(service => (
                            <div key={service.id} className="p-2 border rounded-md">
                              <div className="font-medium">{service.name}</div>
                              {service.description && (
                                <div className="text-xs text-gray-500">{service.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500">No services associated with this contract</div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      <ContractFileUploadDialog
        isOpen={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
        contract={selectedContract}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["contracts"] })}
      />
    </div>
  );
};

export default ContractList;
