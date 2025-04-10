
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Contract, fetchContracts } from "@/lib/contract-service";
import ContractList from "@/components/contracts/ContractList";
import AddEditContractDialog from "@/components/contracts/AddEditContractDialog";
import DeleteContractDialog from "@/components/contracts/DeleteContractDialog";

const ContractsPage = () => {
  const { user } = useAuth();
  const [isAddContractOpen, setIsAddContractOpen] = useState(false);
  const [isDeleteContractOpen, setIsDeleteContractOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

  // Fetch all contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: fetchContracts,
    enabled: !!user
  });

  // Handle contract edit
  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setIsAddContractOpen(true);
  };
  
  // Handle contract deletion click
  const handleDeleteClick = (contract: Contract) => {
    setContractToDelete(contract);
    setIsDeleteContractOpen(true);
  };

  // Close the add/edit contract dialog and reset state
  const closeAddEditDialog = () => {
    setIsAddContractOpen(false);
    setEditingContract(null);
  };

  // Close the delete contract dialog and reset state
  const closeDeleteDialog = () => {
    setIsDeleteContractOpen(false);
    setContractToDelete(null);
  };

  // Calculate contract statistics
  const calculateContractStats = () => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.is_active).length;
    
    const pendingRenewal = contracts.filter(c => c.status === 'pending_renewal').length;
    const expiredContracts = contracts.filter(c => c.status === 'expired').length;
    
    return {
      totalContracts,
      activeContracts,
      pendingRenewal,
      expiredContracts
    };
  };

  const stats = calculateContractStats();

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Contracts</h1>
          <p className="text-gray-600">Manage and monitor service contracts</p>
        </div>
        
        <Button 
          onClick={() => setIsAddContractOpen(true)} 
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Contract
        </Button>
      </div>

      {!isLoading && contracts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Contract Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeContracts} / {stats.totalContracts}
              </div>
              <p className="text-sm text-muted-foreground">
                Active contracts
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-orange-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pending Renewal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {stats.pendingRenewal}
              </div>
              <p className="text-sm text-muted-foreground">
                Contracts expiring within 3 months
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-red-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-500">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.expiredContracts}
              </div>
              <p className="text-sm text-muted-foreground">
                Expired contracts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>Manage your customer service contracts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Clock className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : contracts.length > 0 ? (
            <ContractList 
              contracts={contracts} 
              onEdit={handleEditContract} 
              onDelete={handleDeleteClick} 
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">No contracts found</p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddContractOpen(true)}
              >
                Add Your First Contract
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Contract add/edit dialog */}
      <AddEditContractDialog 
        isOpen={isAddContractOpen} 
        onClose={closeAddEditDialog} 
        existingContract={editingContract}
      />
      
      {/* Contract delete confirmation dialog */}
      {contractToDelete && (
        <DeleteContractDialog 
          isOpen={isDeleteContractOpen}
          onClose={closeDeleteDialog}
          contract={contractToDelete}
        />
      )}
    </div>
  );
};

export default ContractsPage;
