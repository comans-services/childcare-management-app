
import React, { useRef } from 'react';
import { Button } from './button';
import { Upload, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  maxSize?: number; // in bytes
  selectedFile?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  accept = "*/*",
  disabled = false,
  className,
  maxSize = 10 * 1024 * 1024, // 10MB default
  selectedFile = null
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      onFileUpload(null);
      return;
    }

    if (file.size > maxSize) {
      alert(`File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`);
      return;
    }

    onFileUpload(file);
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileUpload(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      
      {!selectedFile ? (
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full h-20 border-dashed border-2 hover:border-primary/50 cursor-pointer"
            asChild
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload file
              </span>
            </div>
          </Button>
        </label>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4" />
            <div className="text-sm">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
