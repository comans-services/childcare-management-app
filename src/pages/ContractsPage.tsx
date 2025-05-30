
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, AlertTriangle, CheckCircle, Search, FileText, Filter, RefreshCw, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Contract, fetchContracts } from "@/lib/contract-service";
import ContractList from "@/components/contracts/ContractList";
import AddEditContractDialog from "@/components/contracts/AddEditContractDialog";
import DeleteContractDialog from "@/components/contracts/DeleteContractDialog";
import ContractFilters from "@/components/contracts/ContractFilters";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useDebounce } from "@/hooks/useDebounce";

const ContractsPage = () => {
  const { user } = useAuth();
  const [isAddContractOpen, setIsAddContractOpen] = useState(false);
  const [isDeleteContractOpen, setIsDeleteContractOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  
  const [filters, setFilters] = useState({
    status: 'all',
    customerId: 'all',
    searchTerm: '',
    isActive: undefined as boolean | undefined
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const { 
    data: contracts = [], 
    isLoading, 
    refetch,
    error,
    isFetching
  } = useQuery({
    queryKey: ["contracts", { ...filters, searchTerm: debouncedSearchTerm }],
    queryFn: () => fetchContracts({
      status: filters.status === 'all' ? '' : filters.status,
      customerId: filters.customerId === 'all' ? '' : filters.customerId,
      searchTerm: debouncedSearchTerm,
      isActive: filters.isActive
    }),
    enabled: !!user
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching contracts:", error);
      toast({
        title: "Error fetching contracts",
        description: "There was an issue loading your contracts. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ 
      ...prev, 
      searchTerm: e.target.value 
    }));
  };

  const clearSearch = () => {
    setFilters(prev => ({ 
      ...prev, 
      searchTerm: '' 
    }));
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      customerId: 'all',
      searchTerm: '',
      isActive: undefined
    });
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setIsAddContractOpen(true);
  };
  
  const handleDeleteClick = (contract: Contract) => {
    setContractToDelete(contract);
    setIsDeleteContractOpen(true);
  };

  const closeAddEditDialog = () => {
    setIsAddContractOpen(false);
    setEditingContract(null);
    refetch();
  };

  const closeDeleteDialog = () => {
    setIsDeleteContractOpen(false);
    setContractToDelete(null);
    refetch();
  };

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

  // Check if we have active search or filters
  const hasActiveFilters = filters.searchTerm !== '' || filters.status !== 'all' || filters.customerId !== 'all' || filters.isActive !== undefined;
  const isSearching = isFetching && debouncedSearchTerm !== filters.searchTerm;

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Contracts</h1>
          <p className="text-gray-600">Manage and monitor service contracts</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()}
            variant="outline"
            title="Refresh contracts"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={() => setIsAddContractOpen(true)} 
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Contract
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts, customers, descriptions..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="pl-8 pr-10"
          />
          {filters.searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isSearching && (
            <div className="absolute right-8 top-2.5">
              <Clock className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {isFilterOpen ? "Hide Filters" : "Show Filters"}
        </Button>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            onClick={resetFilters}
            className="text-sm"
          >
            Clear All
          </Button>
        )}
      </div>

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
            <CardDescription>
              {hasActiveFilters ? "Filtered contracts" : "Manage your customer service contracts"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {contracts.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
                {hasActiveFilters && " found"}
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
              <p className="text-gray-500 mb-4">
                {hasActiveFilters ? "No contracts match your search criteria" : "No contracts found"}
              </p>
              <div className="space-y-2">
                {hasActiveFilters ? (
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                  >
                    Clear Search & Filters
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddContractOpen(true)}
                  >
                    Add Your First Contract
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddEditContractDialog 
        isOpen={isAddContractOpen} 
        onClose={closeAddEditDialog} 
        existingContract={editingContract}
      />
      
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
