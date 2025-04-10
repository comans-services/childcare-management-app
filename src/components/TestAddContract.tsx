
import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { saveContract } from '@/lib/contract-service';

const TestAddContract = () => {
  const handleAddTestContract = async () => {
    try {
      // Create a test contract
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30); // 30 days from now
      
      const contract = await saveContract({
        name: `Test Contract ${new Date().toLocaleTimeString()}`,
        description: 'This is a test contract added to verify contract creation',
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        is_active: true,
      }, []);
      
      toast({
        title: "Test contract created",
        description: `Contract "${contract.name}" created successfully. Please refresh the page to see it.`,
      });
    } catch (error) {
      console.error("Error creating test contract:", error);
      toast({
        title: "Error",
        description: "Failed to create test contract. Check console for details.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={handleAddTestContract}
      className="mr-2"
    >
      Add Test Contract
    </Button>
  );
};

export default TestAddContract;
