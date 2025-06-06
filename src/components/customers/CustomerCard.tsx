
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, Edit } from "lucide-react";
import { Customer } from "@/lib/customer-service";

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDoubleRightClick: (customer: Customer, event: React.MouseEvent) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onEdit, 
  onDoubleRightClick 
}) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onContextMenu={(e) => onDoubleRightClick(customer, e)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate">
            {customer.name}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(customer)}
            className="flex-shrink-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Email */}
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {customer.email ? (
            <a 
              href={`mailto:${customer.email}`}
              className="text-blue-600 hover:underline text-sm truncate"
            >
              {customer.email}
            </a>
          ) : (
            <span className="text-muted-foreground text-sm">No email</span>
          )}
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {customer.phone ? (
            <a 
              href={`tel:${customer.phone}`}
              className="text-blue-600 hover:underline text-sm"
            >
              {customer.phone}
            </a>
          ) : (
            <span className="text-muted-foreground text-sm">No phone</span>
          )}
        </div>

        {/* Company */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {customer.company ? (
            <Badge variant="secondary" className="text-xs">
              {customer.company}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">No company</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
