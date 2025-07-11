import { supabase } from "@/integrations/supabase/client";
import { LeaveApplicationAttachment } from "@/lib/leave-service";

export interface UploadDocumentData {
  applicationId: string;
  file: File;
}

export class DocumentService {
  private static readonly BUCKET_NAME = 'leave-attachments';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  /**
   * Upload a document for a leave application
   */
  static async uploadDocument(data: UploadDocumentData): Promise<LeaveApplicationAttachment> {
    try {
      const { applicationId, file } = data;

      // Validate file
      this.validateFile(file);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${applicationId}/${Date.now()}_${this.sanitizeFileName(file.name)}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      // Create attachment record
      const { data: attachment, error: dbError } = await supabase
        .from('leave_application_attachments')
        .insert({
          application_id: applicationId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.deleteFileFromStorage(fileName);
        console.error('Error creating attachment record:', dbError);
        throw new Error(`Failed to save attachment: ${dbError.message}`);
      }

      return attachment;
    } catch (error) {
      console.error('Error in DocumentService.uploadDocument:', error);
      throw error;
    }
  }

  /**
   * Fetch documents for a leave application
   */
  static async fetchDocuments(applicationId: string): Promise<LeaveApplicationAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('leave_application_attachments')
        .select('*')
        .eq('application_id', applicationId)
        .order('uploaded_at', { ascending: true });

      if (error) {
        console.error('Error fetching attachments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in DocumentService.fetchDocuments:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(attachmentId: string): Promise<void> {
    try {
      // Get attachment details
      const { data: attachment, error: fetchError } = await supabase
        .from('leave_application_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching attachment:', fetchError);
        throw fetchError;
      }

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(attachment.file_url);

      // Delete from storage
      if (filePath) {
        await this.deleteFileFromStorage(filePath);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('leave_application_attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) {
        console.error('Error deleting attachment record:', deleteError);
        throw deleteError;
      }
    } catch (error) {
      console.error('Error in DocumentService.deleteDocument:', error);
      throw error;
    }
  }

  /**
   * Download a document
   */
  static async downloadDocument(attachmentId: string): Promise<Blob> {
    try {
      // Get attachment details
      const { data: attachment, error: fetchError } = await supabase
        .from('leave_application_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching attachment:', fetchError);
        throw fetchError;
      }

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Download file from storage
      const filePath = this.extractFilePathFromUrl(attachment.file_url);
      if (!filePath) {
        throw new Error('Invalid file path');
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (downloadError) {
        console.error('Error downloading file:', downloadError);
        throw downloadError;
      }

      return fileData;
    } catch (error) {
      console.error('Error in DocumentService.downloadDocument:', error);
      throw error;
    }
  }

  /**
   * Validate uploaded file
   */
  private static validateFile(file: File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }

    // Check for valid file name
    if (!file.name || file.name.trim() === '') {
      throw new Error('Invalid file name');
    }
  }

  /**
   * Sanitize file name for storage
   */
  private static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100); // Limit length
  }

  /**
   * Extract file path from public URL
   */
  private static extractFilePathFromUrl(url: string): string | null {
    try {
      const urlParts = url.split(`/object/public/${this.BUCKET_NAME}/`);
      return urlParts.length > 1 ? urlParts[1] : null;
    } catch (error) {
      console.error('Error extracting file path from URL:', error);
      return null;
    }
  }

  /**
   * Delete file from storage
   */
  private static async deleteFileFromStorage(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.warn('Error deleting file from storage:', error);
        // Don't throw error for storage cleanup failures
      }
    } catch (error) {
      console.warn('Error in deleteFileFromStorage:', error);
    }
  }

  /**
   * Check if user can access document
   */
  static async canAccessDocument(attachmentId: string, userId: string): Promise<boolean> {
    try {
      const { data: attachment, error } = await supabase
        .from('leave_application_attachments')
        .select(`
          *,
          leave_application:leave_applications(user_id)
        `)
        .eq('id', attachmentId)
        .single();

      if (error) {
        console.error('Error checking document access:', error);
        return false;
      }

      if (!attachment) {
        return false;
      }

      // Check if user owns the application or is admin
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const isOwner = attachment.leave_application?.user_id === userId;
      const isAdmin = userProfile?.role === 'admin';

      return isOwner || isAdmin;
    } catch (error) {
      console.error('Error in DocumentService.canAccessDocument:', error);
      return false;
    }
  }
}