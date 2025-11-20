import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, File, Trash2, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentUploadComponentProps {
  applicationId: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

const DocumentUploadComponent = ({ applicationId }: DocumentUploadComponentProps) => {
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAttachments();
  }, [applicationId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leave_application_attachments")
        .select("*")
        .eq("application_id", applicationId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error loading attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only PDF, images, and Word documents are allowed",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${applicationId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("leave-attachments")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("leave-attachments")
        .getPublicUrl(fileName);

      // Create database record
      const { error: dbError } = await supabase
        .from("leave_application_attachments")
        .insert({
          application_id: applicationId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: publicUrl,
        });

      if (dbError) throw dbError;

      toast({
        title: "File Uploaded",
        description: "Your supporting document has been uploaded successfully.",
      });

      // Reload attachments
      await loadAttachments();
      
      // Reset input
      event.target.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      // Extract file path from URL
      const url = new URL(attachment.file_url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(pathParts.indexOf("leave-attachments") + 1).join("/");

      const { data, error } = await supabase.storage
        .from("leave-attachments")
        .download(filePath);

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { type: attachment.file_type });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Download Started",
        description: `Downloading ${attachment.file_name}`,
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Are you sure you want to delete ${attachment.file_name}?`)) {
      return;
    }

    try {
      // Extract file path from URL
      const url = new URL(attachment.file_url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(pathParts.indexOf("leave-attachments") + 1).join("/");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("leave-attachments")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("leave_application_attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      toast({
        title: "File Deleted",
        description: "Document has been removed successfully",
      });

      // Reload attachments
      await loadAttachments();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-4 w-4" />
          <span className="text-sm font-medium">Upload Supporting Documents</span>
        </div>
        <Alert className="mb-4">
          <AlertDescription className="text-xs">
            Accepted formats: PDF, JPG, PNG, Word documents (Max 5MB)
          </AlertDescription>
        </Alert>
        <Input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="cursor-pointer"
        />
        {uploading && (
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading...
          </p>
        )}
      </div>

      {/* Attachments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Documents ({attachments.length})</p>
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)} • {new Date(attachment.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(attachment)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No documents uploaded yet
        </p>
      )}
    </div>
  );
};

export default DocumentUploadComponent;
