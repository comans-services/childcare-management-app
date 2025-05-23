
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Loader2, File, AlertCircle, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "@/lib/contract-service";

interface ContractFileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onSuccess: () => void;
}

const ContractFileUploadDialog: React.FC<ContractFileUploadDialogProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !contract) {
      setError("Please select a file");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${contract.id}-${Date.now()}.${fileExt}`;
      const filePath = `${contract.id}/${fileName}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract_files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      setUploadProgress(60);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('contract_files')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      setUploadProgress(80);

      // Update contract record with file information
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          file_id: uploadData?.id || null,
          file_name: file.name,
          file_url: urlData?.signedUrl || null,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setUploadProgress(100);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been attached to this contract.`,
      });
      
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1000);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Error uploading file");
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Contract File</DialogTitle>
          <DialogDescription>
            Upload a file for contract: {contract?.name || ""}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6">
          {!file ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 text-sm text-gray-600">
                <label htmlFor="file-upload" className="font-medium text-primary hover:text-primary/80 cursor-pointer">
                  Click to upload
                </label>
                <p className="text-xs mt-1">PDF, Word, Excel or image files (max. 10MB)</p>
              </div>
              <input 
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-blue-500" />
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={resetState}
                  disabled={uploading}
                >
                  Change
                </Button>
              </div>
              
              {uploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm flex items-center text-red-800">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-end">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="ml-2"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Uploading...
              </>
            ) : uploadProgress === 100 ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Uploaded
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractFileUploadDialog;
