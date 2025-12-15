import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileText, Image, FileSpreadsheet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmailAttachment {
  filename: string;
  url: string;
  size: number;
  type: string;
}

interface FileAttachmentUploadProps {
  attachments: EmailAttachment[];
  onAttachmentsChange: (attachments: EmailAttachment[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in bytes
}

const ALLOWED_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF' },
  'image/jpeg': { icon: Image, label: 'Image' },
  'image/png': { icon: Image, label: 'Image' },
  'image/gif': { icon: Image, label: 'Image' },
  'application/msword': { icon: FileText, label: 'Word' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'Word' },
  'application/vnd.ms-excel': { icon: FileSpreadsheet, label: 'Excel' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheet, label: 'Excel' },
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileAttachmentUpload = ({
  attachments,
  onAttachmentsChange,
  maxFiles = 5,
  maxSizePerFile = 10 * 1024 * 1024, // 10MB default
}: FileAttachmentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check max files limit
    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} attachments allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const newAttachments: EmailAttachment[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
          toast.error(`${file.name}: File type not allowed. Use PDF, Word, Excel, or images.`);
          continue;
        }

        // Validate file size
        if (file.size > maxSizePerFile) {
          toast.error(`${file.name}: File too large. Maximum size is ${formatFileSize(maxSizePerFile)}`);
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${timestamp}-${sanitizedName}`;

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from('email-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('email-attachments')
          .getPublicUrl(data.path);

        newAttachments.push({
          filename: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
        });

        toast.success(`${file.name} uploaded successfully`);
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
    toast.success('Attachment removed');
  };

  const getFileIcon = (type: string) => {
    const config = ALLOWED_TYPES[type as keyof typeof ALLOWED_TYPES];
    return config?.icon || FileText;
  };

  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.keys(ALLOWED_TYPES).join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || attachments.length >= maxFiles}
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || attachments.length >= maxFiles}
          className="h-14 px-6 text-lg"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5 mr-2" />
          )}
          {isUploading ? 'Uploading...' : 'Attach Files'}
        </Button>
        <span className="text-muted-foreground">
          PDF, Word, Excel, Images (max {formatFileSize(maxSizePerFile)} each)
        </span>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2 bg-muted/50 rounded-lg p-4">
          {attachments.map((attachment, index) => {
            const IconComponent = getFileIcon(attachment.type);
            return (
              <div
                key={index}
                className="flex items-center justify-between py-3 px-4 bg-background rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{attachment.filename}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(attachment.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAttachment(index)}
                  className="h-10 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            );
          })}
          
          <div className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
            <span>{attachments.length} file{attachments.length !== 1 ? 's' : ''} attached</span>
            <span>Total: {formatFileSize(totalSize)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
