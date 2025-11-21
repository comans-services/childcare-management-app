import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { importContactsFromCSV } from "@/lib/mass-mailer-service";
import { toast } from "sonner";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CSVImportDialog = ({ open, onOpenChange, onSuccess }: CSVImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, current: "" });
  const [result, setResult] = useState<{ success: number; errors: number; messages: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);
      setResult(null);

      const importResult = await importContactsFromCSV(file, (p) => {
        setProgress(p);
      });

      setResult(importResult);

      if (importResult.success > 0) {
        toast.success(`Imported ${importResult.success} contacts successfully`);
        onSuccess();
      }

      if (importResult.errors > 0) {
        toast.error(`${importResult.errors} contacts failed to import`);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import contacts");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProgress({ processed: 0, total: 0, current: "" });
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Upload a CSV file with the following columns: <br />
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              email, first_name, last_name, tags, email_consent, notes
            </code>
            <br />
            Only <strong>email</strong> is required.
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            {!file ? (
              <label className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="text-sm font-medium mb-2">
                  Click to upload CSV file
                </div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 justify-center">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
            )}
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing contacts...</span>
                <span>{progress.processed} / {progress.total}</span>
              </div>
              <Progress
                value={(progress.processed / progress.total) * 100}
              />
              {progress.current && (
                <div className="text-xs text-muted-foreground">
                  Current: {progress.current}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{result.success} contacts imported successfully</span>
              </div>
              {result.errors > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{result.errors} contacts failed</span>
                  </div>
                  {result.messages.length > 0 && (
                    <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground bg-muted p-2 rounded">
                      {result.messages.slice(0, 10).map((msg, idx) => (
                        <div key={idx}>{msg}</div>
                      ))}
                      {result.messages.length > 10 && (
                        <div className="mt-1 italic">
                          ... and {result.messages.length - 10} more errors
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? "Importing..." : "Import"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
