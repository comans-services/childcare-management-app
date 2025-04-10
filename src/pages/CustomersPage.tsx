
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Building2, Clock, Edit, Trash2, Phone, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Customer, fetchCustomers, deleteCustomer } from "@/lib/customer-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddEditCustomerDialog from "@/components/customers/AddEditCustomerDialog";
import { Input } from "@/components/ui/input";

const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Fetch all customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Customer deleted",
        description: "The customer has been removed successfully."
      });
      setCustomerToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Could not delete the customer. It might be associated with projects.",
        variant: "destructive"
      });
    }
  });

  // Handle customer edit
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddCustomerOpen(true);
  };
  
  // Handle customer deletion
  const handleDeleteCustomer = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-gray-600">Manage customer information</p>
        </div>
        
        <Button 
          onClick={() => {
            setEditingCustomer(null);
            setIsAddCustomerOpen(true);
          }} 
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Manage your customer database</CardDescription>
          <div className="mt-4">
            <div className="relative">
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Clock className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.company || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.email ? (
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {customer.email}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.phone ? (
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {customer.phone}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCustomerToDelete(customer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-gray-500 mb-4">No customers found</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
              >
                Add Your First Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Customer add/edit dialog */}
      <AddEditCustomerDialog 
        isOpen={isAddCustomerOpen} 
        onClose={() => {
          setIsAddCustomerOpen(false);
          setEditingCustomer(null);
        }} 
        existingCustomer={editingCustomer}
      />
      
      {/* Customer delete confirmation dialog */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the customer "{customerToDelete?.name}"? 
              This action cannot be undone and will remove all customer information.
              {customerToDelete?.company && (
                <>
                  <br />
                  <span className="font-medium">Company: {customerToDelete.company}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomersPage;
