import React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { haptics } from "@/lib/haptics";

export interface FilterValues {
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  employmentType?: string;
  [key: string]: any;
}

export interface MobileReportFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function MobileReportFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  children,
}: MobileReportFiltersProps) {
  const [open, setOpen] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<FilterValues>(filters);

  // Sync local filters with prop filters when opened
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleApply = () => {
    haptics.medium();
    onFiltersChange(localFilters);
    onApply();
    setOpen(false);
  };

  const handleClear = () => {
    haptics.light();
    setLocalFilters({});
    onClear();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      haptics.light();
    }
    setOpen(newOpen);
  };

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(
    key => filters[key] !== undefined && filters[key] !== null && filters[key] !== ''
  ).length;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 relative"
          size="default"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        {/* Filter content - scrollable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Render filter children */}
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                value: localFilters[child.props.name],
                onChange: (value: any) => {
                  setLocalFilters(prev => ({
                    ...prev,
                    [child.props.name]: value,
                  }));
                },
              });
            }
            return child;
          })}
        </div>

        {/* Footer with actions */}
        <SheetFooter className="flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Helper filter input components
export interface FilterInputProps {
  name: string;
  label: string;
  value?: any;
  onChange?: (value: any) => void;
}

export function FilterDateInput({ name, label, value, onChange }: FilterInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        type="date"
        value={value ? new Date(value).toISOString().split('T')[0] : ''}
        onChange={(e) => onChange?.(e.target.value ? new Date(e.target.value) : undefined)}
        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

export function FilterSelectInput({ name, label, value, onChange, options }: FilterInputProps & { options: Array<{ value: string; label: string }> }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value || undefined)}
        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
