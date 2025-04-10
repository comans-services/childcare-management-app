
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, AlertTriangle, CheckCircle, Search, FileText, Filter } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Contract, fetchContracts } from "@/lib/contract-service";
import ContractList from "@/components/contracts/ContractList";
import AddEditContractDialog from "@/components/contracts/AddEditContractDialog";
import DeleteContractDialog from "@/components/contracts/DeleteContractDialog";
import ContractFilters from "@/components/contracts/ContractFilters";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const ContractsPage = () => {
  const { user } = useAuth();
  const [isAddContractOpen, setIsAddContractOpen] = useState(false);
  const [isDeleteContractOpen, setIsDeleteContractOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    customerId: '',
    searchTerm: '',
    isActive: undefined as boolean | undefined
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch all contracts with filters
  const { data: contracts = [], isLoading, refetch } = useQuery({
    queryKey: ["contracts", filters],
    queryFn: () => fetchContracts(filters),
    enabled: !!user
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ 
      ...prev, 
      searchTerm: e.target.value 
    }));
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      customerId: '',
      searchTerm: '',
      isActive: undefined
    });
  };

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
    refetch(); // Refresh the contracts list
  };

  // Close the delete contract dialog and reset state
  const closeDeleteDialog = () => {
    setIsDeleteContractOpen(false);
    setContractToDelete(null);
    refetch(); // Refresh the contracts list
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

      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>

        <Button 
          variant="outline" 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {isFilterOpen ? "Hide Filters" : "Show Filters"}
        </Button>

        {(filters.status || filters.customerId || filters.isActive !== undefined) && (
          <Button 
            variant="ghost" 
            onClick={resetFilters}
            className="text-sm"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {isFilterOpen && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <ContractFilters 
              filters={filters} 
              onFilterChange={handleFilterChange}
            />
          </CardContent>
        </Card>
      )}

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Contracts</CardTitle>
            <CardDescription>Manage your customer service contracts</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {contracts.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
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
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
