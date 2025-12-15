import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TypeScript Interfaces
// ============================================================================

// Email settings interface
export interface EmailSettings {
  id: string;
  sender_name: string;
  sender_email: string;
  reply_to_email: string;
  organization_name?: string | null;
  created_at: string;
  updated_at: string;
}

// Contact interfaces
export interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  tags?: string[] | any; // jsonb in database
  email_consent: boolean;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NewContact {
  first_name?: string;
  last_name?: string;
  email: string;
  tags?: string[];
  email_consent: boolean;
  notes?: string;
}

// Campaign interfaces
export interface Campaign {
  id: string;
  subject: string;
  message_body: string;
  message_format: string | null;
  audience_filter: string | null;
  target_tag?: string | null;
  status: string | null;
  created_by?: string | null;
  sent_by?: string | null;
  test_sent_to?: string | null;
  test_sent_at?: string | null;
  scheduled_for?: string | null;
  sent_at?: string | null;
  total_recipients?: number | null;
  total_sent?: number | null;
  total_bounced?: number | null;
  total_unsubscribed?: number | null;
  footer_included: boolean;
  unsubscribe_link_included: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewCampaign {
  subject: string;
  message_body: string;
  message_format?: 'plain' | 'html';
  audience_filter?: 'all' | 'tags';
  target_tag?: string;
  footer_included?: boolean;
  unsubscribe_link_included?: boolean;
}

// Campaign Event interfaces
export interface CampaignEvent {
  id: string;
  campaign_id: string | null;
  contact_id?: string | null;
  contact_email: string;
  event_type: string;
  event_timestamp: string;
  bounce_type?: string | null;
  bounce_reason?: string | null;
  unsubscribed_at?: string | null;
  unsubscribe_ip?: string | null;
  provider_response?: any;
  created_at: string;
}

// Filter interfaces
export interface ContactFilters {
  tags?: string[];
  emailConsent?: boolean;
  isActive?: boolean;
  searchTerm?: string;
}

export interface CampaignFilters {
  status?: string[];
  dateRange?: [string, string];
}

// Statistics interfaces
export interface ContactStats {
  total: number;
  active: number;
  consented: number;
  inactive: number;
  byTag: Record<string, number>;
}

export interface CampaignStats {
  total_recipients: number;
  total_sent: number;
  total_bounced: number;
  total_unsubscribed: number;
  delivery_rate: number;
  bounce_rate: number;
}

// ============================================================================
// Contact Management Functions
// ============================================================================

/**
 * Fetch contacts with optional filtering
 */
export const fetchContacts = async (filters?: ContactFilters): Promise<Contact[]> => {
  try {
    console.log("Fetching contacts with filters:", filters);
    
    let query = supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters?.emailConsent !== undefined) {
      query = query.eq('email_consent', filters.emailConsent);
    }
    
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    
    if (filters?.searchTerm) {
      query = query.or(`full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
    
    // Filter by tags if specified (client-side because jsonb array filtering)
    let filteredData = data || [];
    if (filters?.tags && filters.tags.length > 0) {
      filteredData = filteredData.filter(contact => {
        const contactTags = Array.isArray(contact.tags) ? contact.tags : [];
        return filters.tags!.some(tag => contactTags.includes(tag));
      });
    }
    
    console.log(`Fetched ${filteredData.length} contacts`);
    return filteredData;
  } catch (error) {
    console.error('Error in fetchContacts:', error);
    throw error;
  }
};

/**
 * Get a single contact by ID
 */
export const getContactById = async (id: string): Promise<Contact | null> => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getContactById:', error);
    throw error;
  }
};

/**
 * Add a new contact
 */
export const addContact = async (contact: NewContact): Promise<Contact> => {
  try {
    console.log("Creating new contact:", contact.email);
    
    const contactData = {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email.toLowerCase().trim(),
      tags: contact.tags || [],
      email_consent: contact.email_consent,
      notes: contact.notes,
      is_active: true
    };
    
    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single();
    
    if (error) {
      // Check for duplicate email
      if (error.code === '23505') {
        throw new Error('A contact with this email already exists');
      }
      console.error('Error creating contact:', error);
      throw error;
    }
    
    console.log("Contact created successfully:", data.id);
    return data;
  } catch (error) {
    console.error('Error in addContact:', error);
    throw error;
  }
};

/**
 * Update an existing contact
 */
export const updateContact = async (
  id: string, 
  updates: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
): Promise<Contact> => {
  try {
    console.log("Updating contact:", id);
    
    const updateData: any = { 
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
    
    console.log("Contact updated successfully");
    return data;
  } catch (error) {
    console.error('Error in updateContact:', error);
    throw error;
  }
};

/**
 * Delete a contact (soft delete - sets is_active to false)
 */
export const deleteContact = async (id: string): Promise<void> => {
  try {
    console.log("Soft deleting contact:", id);
    
    const { error } = await supabase
      .from('contacts')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
    
    console.log("Contact deleted successfully");
  } catch (error) {
    console.error('Error in deleteContact:', error);
    throw error;
  }
};

/**
 * Unsubscribe a contact by email
 */
export const unsubscribeContact = async (email: string): Promise<void> => {
  try {
    console.log("Unsubscribing contact:", email);
    
    // Update contact to remove consent
    const { error: contactError } = await supabase
      .from('contacts')
      .update({ 
        email_consent: false,
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase().trim());
    
    if (contactError) {
      console.error('Error updating contact consent:', contactError);
    }
    
    // Add to unsubscribes table
    const { error: unsubError } = await supabase
      .from('unsubscribes')
      .insert({
        email: email.toLowerCase().trim(),
        unsubscribe_source: 'mass_mailer'
      });
    
    if (unsubError && unsubError.code !== '23505') { // Ignore duplicate errors
      console.error('Error adding to unsubscribes:', unsubError);
    }
    
    console.log("Contact unsubscribed successfully");
  } catch (error) {
    console.error('Error in unsubscribeContact:', error);
    throw error;
  }
};

/**
 * Get contact statistics
 */
export const getContactStats = async (): Promise<ContactStats> => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('is_active, email_consent, tags');
    
    if (error) throw error;
    
    const stats: ContactStats = {
      total: data.length,
      active: data.filter(c => c.is_active).length,
      consented: data.filter(c => c.is_active && c.email_consent).length,
      inactive: data.filter(c => !c.is_active).length,
      byTag: {}
    };
    
    // Count contacts by tag
    data.forEach(contact => {
      const tags = Array.isArray(contact.tags) ? contact.tags : [];
      tags.forEach(tag => {
        if (typeof tag === 'string') {
          stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
        }
      });
    });
    
    return stats;
  } catch (error) {
    console.error('Error in getContactStats:', error);
    throw error;
  }
};

// ============================================================================
// Campaign Management Functions
// ============================================================================

/**
 * Fetch campaigns with optional filtering
 */
export const fetchCampaigns = async (filters?: CampaignFilters): Promise<Campaign[]> => {
  try {
    console.log("Fetching campaigns with filters:", filters);
    
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange[0])
        .lte('created_at', filters.dateRange[1]);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} campaigns`);
    return data || [];
  } catch (error) {
    console.error('Error in fetchCampaigns:', error);
    throw error;
  }
};

/**
 * Get a single campaign by ID
 */
export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getCampaignById:', error);
    throw error;
  }
};

/**
 * Create a new campaign
 */
export const createCampaign = async (campaign: NewCampaign): Promise<Campaign> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User must be authenticated to create campaign');
    }
    
    console.log("Creating new campaign:", campaign.subject);
    
    const campaignData = {
      subject: campaign.subject,
      message_body: campaign.message_body,
      message_format: campaign.message_format || 'html',
      audience_filter: campaign.audience_filter || 'all',
      target_tag: campaign.target_tag,
      footer_included: campaign.footer_included ?? true,
      unsubscribe_link_included: campaign.unsubscribe_link_included ?? true,
      status: 'draft',
      created_by: user.id,
      total_recipients: 0,
      total_sent: 0,
      total_bounced: 0,
      total_unsubscribed: 0
    };
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
    
    console.log("Campaign created successfully:", data.id);
    return data;
  } catch (error) {
    console.error('Error in createCampaign:', error);
    throw error;
  }
};

/**
 * Update an existing campaign
 */
export const updateCampaign = async (
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'created_at' | 'created_by'>>
): Promise<Campaign> => {
  try {
    console.log("Updating campaign:", id);
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
    
    console.log("Campaign updated successfully");
    return data;
  } catch (error) {
    console.error('Error in updateCampaign:', error);
    throw error;
  }
};

/**
 * Delete a campaign (only draft campaigns can be deleted)
 */
export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    console.log("Deleting campaign:", id);
    
    // Only allow deletion of draft campaigns
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .single();
    
    if (campaign?.status !== 'draft') {
      throw new Error('Only draft campaigns can be deleted');
    }
    
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
    
    console.log("Campaign deleted successfully");
  } catch (error) {
    console.error('Error in deleteCampaign:', error);
    throw error;
  }
};

/**
 * Send a test email for a campaign
 */
export const sendTestEmail = async (
  campaignId: string,
  testEmail: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Sending test email for campaign:", campaignId);
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('send-campaign-email', {
      body: {
        campaignId,
        testMode: true,
        testEmail
      }
    });
    
    if (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
    
    // Update campaign test fields
    await supabase
      .from('campaigns')
      .update({
        test_sent_to: testEmail,
        test_sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);
    
    console.log("Test email sent successfully");
    return {
      success: true,
      message: `Test email sent to ${testEmail}`
    };
  } catch (error) {
    console.error('Error in sendTestEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send test email'
    };
  }
};

/**
 * Send a campaign to all recipients
 */
export const sendCampaign = async (
  campaignId: string
): Promise<{ success: boolean; message: string; stats?: any }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    console.log("Sending campaign:", campaignId);
    
    // Update status to sending
    await supabase
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('send-campaign-email', {
      body: {
        campaignId,
        testMode: false
      }
    });
    
    if (error) {
      console.error('Error sending campaign:', error);
      
      // Update status to failed
      await supabase
        .from('campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
      
      throw error;
    }
    
    console.log("Campaign sent successfully:", data);
    return {
      success: true,
      message: `Campaign sent to ${data.sent} recipients`,
      stats: data
    };
  } catch (error) {
    console.error('Error in sendCampaign:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send campaign'
    };
  }
};

/**
 * Get campaign statistics
 */
export const getCampaignStats = async (campaignId: string): Promise<CampaignStats> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('total_recipients, total_sent, total_bounced, total_unsubscribed')
      .eq('id', campaignId)
      .single();
    
    if (error) throw error;
    
    const stats: CampaignStats = {
      total_recipients: data.total_recipients || 0,
      total_sent: data.total_sent || 0,
      total_bounced: data.total_bounced || 0,
      total_unsubscribed: data.total_unsubscribed || 0,
      delivery_rate: data.total_sent > 0 
        ? ((data.total_sent - data.total_bounced) / data.total_sent) * 100 
        : 0,
      bounce_rate: data.total_sent > 0 
        ? (data.total_bounced / data.total_sent) * 100 
        : 0
    };
    
    return stats;
  } catch (error) {
    console.error('Error in getCampaignStats:', error);
    throw error;
  }
};

/**
 * Get campaign events (sent, bounced, etc.)
 */
export const getCampaignEvents = async (campaignId: string): Promise<CampaignEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('campaign_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('event_timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching campaign events:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCampaignEvents:', error);
    throw error;
  }
};

// ============================================================================
// Tag Management Functions
// ============================================================================

/**
 * Get all unique tags from contacts
 */
export const getAllTags = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('tags')
      .eq('is_active', true);
    
    if (error) throw error;
    
    // Extract unique tags
    const tagSet = new Set<string>();
    data.forEach(contact => {
      const tags = Array.isArray(contact.tags) ? contact.tags : [];
      tags.forEach(tag => {
        if (typeof tag === 'string') {
          tagSet.add(tag);
        }
      });
    });
    
    return Array.from(tagSet).sort();
  } catch (error) {
    console.error('Error in getAllTags:', error);
    throw error;
  }
};

/**
 * Add a tag to a contact
 */
export const addTagToContact = async (contactId: string, tag: string): Promise<Contact> => {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', contactId)
      .single();
    
    const currentTags = Array.isArray(contact?.tags) ? contact.tags : [];
    
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      
      return await updateContact(contactId, { tags: currentTags });
    }
    
    return contact as Contact;
  } catch (error) {
    console.error('Error in addTagToContact:', error);
    throw error;
  }
};

/**
 * Remove a tag from a contact
 */
export const removeTagFromContact = async (contactId: string, tag: string): Promise<Contact> => {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', contactId)
      .single();
    
    const currentTags = Array.isArray(contact?.tags) ? contact.tags : [];
    const updatedTags = currentTags.filter(t => t !== tag);
    
    return await updateContact(contactId, { tags: updatedTags });
  } catch (error) {
    console.error('Error in removeTagFromContact:', error);
    throw error;
  }
};

// ============================================================================
// CSV Import/Export Functions
// ============================================================================

/**
 * Import contacts from a CSV file
 */
export const importContactsFromCSV = async (
  file: File,
  onProgress?: (progress: { processed: number; total: number; current: string }) => void
): Promise<{ success: number; errors: number; messages: string[] }> => {
  try {
    console.log("Importing contacts from CSV:", file.name);
    
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const requiredHeaders = ['email'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    let successCount = 0;
    let errorCount = 0;
    const messages: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      onProgress?.({
        processed: i,
        total: lines.length - 1,
        current: row.email
      });
      
      try {
        // Validate email
        if (!row.email || !row.email.includes('@')) {
          throw new Error('Invalid email');
        }
        
        // Parse tags (comma-separated or JSON array)
        let tags: string[] = [];
        if (row.tags) {
          try {
            tags = JSON.parse(row.tags);
          } catch {
            tags = row.tags.split(';').map((t: string) => t.trim()).filter(Boolean);
          }
        }
        
        // Create contact
        await addContact({
          first_name: row.first_name || row.firstname,
          last_name: row.last_name || row.lastname,
          email: row.email,
          tags,
          email_consent: row.email_consent === 'true' || row.email_consent === '1',
          notes: row.notes
        });
        
        successCount++;
      } catch (error) {
        errorCount++;
        messages.push(`Row ${i + 1} (${row.email}): ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Import completed: ${successCount} success, ${errorCount} errors`);
    return { success: successCount, errors: errorCount, messages };
  } catch (error) {
    console.error('Error in importContactsFromCSV:', error);
    throw error;
  }
};

/**
 * Export contacts to a CSV file
 */
export const exportContactsToCSV = async (filters?: ContactFilters): Promise<Blob> => {
  try {
    console.log("Exporting contacts to CSV");
    
    const contacts = await fetchContacts(filters);
    
    // CSV headers
    const headers = ['first_name', 'last_name', 'full_name', 'email', 'tags', 'email_consent', 'is_active', 'notes', 'created_at'];
    
    // Build CSV content
    let csvContent = headers.join(',') + '\n';
    
    contacts.forEach(contact => {
      const tags = Array.isArray(contact.tags) ? contact.tags.join(';') : '';
      const row = [
        contact.first_name || '',
        contact.last_name || '',
        contact.full_name || '',
        contact.email,
        tags,
        contact.email_consent ? 'true' : 'false',
        contact.is_active ? 'true' : 'false',
        (contact.notes || '').replace(/,/g, ';'), // Escape commas
        contact.created_at
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    console.log(`Exported ${contacts.length} contacts`);
    return blob;
  } catch (error) {
    console.error('Error in exportContactsToCSV:', error);
    throw error;
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if an email already exists in contacts
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    
    return !!data;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

/**
 * Check if a contact is unsubscribed
 */
export const checkIsUnsubscribed = async (email: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('unsubscribes')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    
    return !!data;
  } catch (error) {
    console.error('Error checking unsubscribe status:', error);
    return false;
  }
};

// ============================================================================
// Simplified Email Sending
// ============================================================================

/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  url: string;
  size: number;
  type?: string;
}

/**
 * Send a quick email to a group of contacts (simplified version for notifications)
 */
export const sendQuickEmail = async (
  subject: string,
  messageBody: string,
  recipientGroup: string, // 'all' or tag name
  attachments?: EmailAttachment[],
): Promise<{ sent: number; failed: number }> => {
  try {
    console.log('Sending quick email:', { subject, recipientGroup, attachmentCount: attachments?.length || 0 });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Prepare attachments data for storage
    const attachmentsData = attachments?.map(att => ({
      filename: att.filename,
      url: att.url,
      size: att.size,
    })) || [];

    // Create a campaign record for tracking
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        subject: subject.trim(),
        message_body: messageBody,
        message_format: 'html',
        audience_filter: recipientGroup === 'all' ? 'all' : 'tags',
        target_tag: recipientGroup === 'all' ? null : recipientGroup,
        status: 'sending',
        created_by: user.id,
        sent_by: user.id,
        footer_included: true,
        unsubscribe_link_included: false,
        attachments: attachmentsData,
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Call the edge function to send emails
    const { data, error } = await supabase.functions.invoke('send-campaign-email', {
      body: {
        campaignId: campaign.id,
        testMode: false,
        attachments: attachmentsData,
      },
    });

    if (error) throw error;

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaign.id);

    return {
      sent: data?.sent || 0,
      failed: data?.failed || 0,
    };
  } catch (error) {
    console.error('Error sending quick email:', error);
    throw error;
  }
};
