import React from "react";
import { Download, FileSpreadsheet, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export interface ExportOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  action: () => void | Promise<void>;
}

export interface ExportActionSheetProps {
  options?: ExportOption[];
  onExportCSV?: () => void | Promise<void>;
  onExportPDF?: () => void | Promise<void>;
  onExportExcel?: () => void | Promise<void>;
  customTrigger?: React.ReactNode;
}

export function ExportActionSheet({
  options,
  onExportCSV,
  onExportPDF,
  onExportExcel,
  customTrigger,
}: ExportActionSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState<string | null>(null);

  // Default export options if none provided
  const defaultOptions: ExportOption[] = [
    ...(onExportCSV ? [{
      id: 'csv',
      label: 'Export as CSV',
      icon: FileSpreadsheet,
      description: 'Comma-separated values for Excel',
      action: onExportCSV,
    }] : []),
    ...(onExportPDF ? [{
      id: 'pdf',
      label: 'Export as PDF',
      icon: FileText,
      description: 'Portable document format',
      action: onExportPDF,
    }] : []),
    ...(onExportExcel ? [{
      id: 'excel',
      label: 'Export as Excel',
      icon: FileSpreadsheet,
      description: 'Microsoft Excel spreadsheet',
      action: onExportExcel,
    }] : []),
  ];

  const exportOptions = options || defaultOptions;

  const handleExport = async (option: ExportOption) => {
    haptics.medium();
    setLoading(option.id);

    try {
      await option.action();
      haptics.success();
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      haptics.error();
    } finally {
      setLoading(null);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      haptics.light();
    }
    setOpen(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {customTrigger || (
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>Export Report</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-2">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isLoading = loading === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleExport(option)}
                disabled={isLoading || loading !== null}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-lg border",
                  "transition-all duration-200",
                  "active:scale-98 min-h-touch",
                  "hover:bg-gray-50",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-900">
                    {isLoading ? 'Exporting...' : option.label}
                  </p>
                  {option.description && (
                    <p className="text-sm text-gray-500 truncate">
                      {option.description}
                    </p>
                  )}
                </div>

                {isLoading && (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
