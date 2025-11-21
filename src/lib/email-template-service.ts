import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  message_body: string;
  category: string | null;
  is_default: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NewEmailTemplate {
  name: string;
  description?: string;
  subject: string;
  message_body: string;
  category?: string;
  is_default?: boolean;
}

export const emailTemplateService = {
  async fetchTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTemplateById(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createTemplate(template: NewEmailTemplate): Promise<EmailTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert([{
        ...template,
        created_by: user?.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(id: string, template: Partial<NewEmailTemplate>): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async applyTemplate(templateId: string): Promise<Pick<EmailTemplate, 'subject' | 'message_body'>> {
    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error('Template not found');
    
    return {
      subject: template.subject,
      message_body: template.message_body,
    };
  },
};
