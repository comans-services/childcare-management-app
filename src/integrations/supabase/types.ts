export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "fk_audit_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      campaign_events: {
        Row: {
          bounce_reason: string | null
          bounce_type: string | null
          campaign_id: string | null
          contact_email: string
          contact_id: string | null
          created_at: string
          event_timestamp: string
          event_type: string
          id: string
          provider_response: Json | null
          unsubscribe_ip: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounce_type?: string | null
          campaign_id?: string | null
          contact_email: string
          contact_id?: string | null
          created_at?: string
          event_timestamp?: string
          event_type: string
          id?: string
          provider_response?: Json | null
          unsubscribe_ip?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounce_type?: string | null
          campaign_id?: string | null
          contact_email?: string
          contact_id?: string | null
          created_at?: string
          event_timestamp?: string
          event_type?: string
          id?: string
          provider_response?: Json | null
          unsubscribe_ip?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_filter: string | null
          created_at: string
          created_by: string | null
          footer_included: boolean
          id: string
          message_body: string
          message_format: string | null
          scheduled_for: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          subject: string
          target_tag: string | null
          test_sent_at: string | null
          test_sent_to: string | null
          total_bounced: number | null
          total_recipients: number | null
          total_sent: number | null
          total_unsubscribed: number | null
          unsubscribe_link_included: boolean
          updated_at: string
        }
        Insert: {
          audience_filter?: string | null
          created_at?: string
          created_by?: string | null
          footer_included?: boolean
          id?: string
          message_body: string
          message_format?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject: string
          target_tag?: string | null
          test_sent_at?: string | null
          test_sent_to?: string | null
          total_bounced?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          unsubscribe_link_included?: boolean
          updated_at?: string
        }
        Update: {
          audience_filter?: string | null
          created_at?: string
          created_by?: string | null
          footer_included?: boolean
          id?: string
          message_body?: string
          message_format?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string
          target_tag?: string | null
          test_sent_at?: string | null
          test_sent_to?: string | null
          total_bounced?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          unsubscribe_link_included?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "campaigns_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "campaigns_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      childcare_rooms: {
        Row: {
          children_over_3: number
          children_under_3: number
          created_at: string
          device_id: string | null
          id: string
          is_active: boolean
          last_updated: string
          name: string
          ratio_over_3: number
          ratio_under_3: number
          room_number: number
          updated_by: string | null
        }
        Insert: {
          children_over_3?: number
          children_under_3?: number
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          last_updated?: string
          name: string
          ratio_over_3?: number
          ratio_under_3?: number
          room_number: number
          updated_by?: string | null
        }
        Update: {
          children_over_3?: number
          children_under_3?: number
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          last_updated?: string
          name?: string
          ratio_over_3?: number
          ratio_under_3?: number
          room_number?: number
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "childcare_rooms_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "room_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "childcare_rooms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "childcare_rooms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "childcare_rooms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "childcare_rooms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      contact_imports: {
        Row: {
          duplicates_skipped: number | null
          errors: Json | null
          failed_imports: number | null
          file_name: string
          id: string
          imported_at: string
          imported_by: string
          successful_imports: number | null
          total_rows: number | null
        }
        Insert: {
          duplicates_skipped?: number | null
          errors?: Json | null
          failed_imports?: number | null
          file_name: string
          id?: string
          imported_at?: string
          imported_by: string
          successful_imports?: number | null
          total_rows?: number | null
        }
        Update: {
          duplicates_skipped?: number | null
          errors?: Json | null
          failed_imports?: number | null
          file_name?: string
          id?: string
          imported_at?: string
          imported_by?: string
          successful_imports?: number | null
          total_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "contact_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          email_consent: boolean
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          notes: string | null
          tags: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_consent?: boolean
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          notes?: string | null
          tags?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_consent?: boolean
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          notes?: string | null
          tags?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string | null
          id: string
          organization_name: string | null
          reply_to_email: string
          sender_email: string
          sender_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_name?: string | null
          reply_to_email?: string
          sender_email?: string
          sender_name?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_name?: string | null
          reply_to_email?: string
          sender_email?: string
          sender_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pay_periods: {
        Row: {
          created_at: string | null
          id: string
          payroll_cutoff_date: string
          payroll_date: string
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payroll_cutoff_date: string
          payroll_date: string
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payroll_cutoff_date?: string
          payroll_date?: string
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_periods_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_periods_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_periods_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "pay_periods_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      payroll_settings: {
        Row: {
          created_at: string | null
          hours_per_leave_day: number
          id: string
          pay_day: string
          pay_frequency: string
          reference_pay_date: string
          updated_at: string | null
          week_start_day: string
        }
        Insert: {
          created_at?: string | null
          hours_per_leave_day?: number
          id?: string
          pay_day?: string
          pay_frequency?: string
          reference_pay_date: string
          updated_at?: string | null
          week_start_day?: string
        }
        Update: {
          created_at?: string | null
          hours_per_leave_day?: number
          id?: string
          pay_day?: string
          pay_frequency?: string
          reference_pay_date?: string
          updated_at?: string | null
          week_start_day?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          employee_card_id: string | null
          employee_id: string | null
          employment_type: Database["public"]["Enums"]["employment_status"]
          full_name: string
          id: string
          is_active: boolean
          organization: string | null
          role: Database["public"]["Enums"]["user_role"]
          time_zone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_card_id?: string | null
          employee_id?: string | null
          employment_type?: Database["public"]["Enums"]["employment_status"]
          full_name: string
          id: string
          is_active?: boolean
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          time_zone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_card_id?: string | null
          employee_id?: string | null
          employment_type?: Database["public"]["Enums"]["employment_status"]
          full_name?: string
          id?: string
          is_active?: boolean
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          state: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          state?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          state?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      room_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          device_id: string | null
          id: string
          performed_at: string
          performed_by: string | null
          room_id: string
          staff_id: string | null
          state_after: Json | null
          state_before: Json | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          device_id?: string | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          room_id: string
          staff_id?: string | null
          state_after?: Json | null
          state_before?: Json | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          device_id?: string | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          room_id?: string
          staff_id?: string | null
          state_after?: Json | null
          state_before?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "room_activity_log_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "room_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "room_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "room_activity_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "childcare_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "current_room_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "room_activity_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      room_devices: {
        Row: {
          created_at: string
          created_by: string | null
          device_model: string | null
          device_name: string
          device_token: string | null
          id: string
          is_active: boolean
          last_seen: string | null
          mac_address: string
          room_id: string
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_model?: string | null
          device_name: string
          device_token?: string | null
          id?: string
          is_active?: boolean
          last_seen?: string | null
          mac_address: string
          room_id: string
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_model?: string | null
          device_name?: string
          device_token?: string | null
          id?: string
          is_active?: boolean
          last_seen?: string | null
          mac_address?: string
          room_id?: string
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_devices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_devices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_devices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "room_devices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "room_devices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "childcare_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_devices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "current_room_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_devices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_room_entries: {
        Row: {
          created_at: string
          device_id: string | null
          duration_minutes: number | null
          entered_at: string
          entered_by: string | null
          entry_method: string | null
          exit_method: string | null
          exited_at: string | null
          exited_by: string | null
          id: string
          notes: string | null
          room_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          duration_minutes?: number | null
          entered_at?: string
          entered_by?: string | null
          entry_method?: string | null
          exit_method?: string | null
          exited_at?: string | null
          exited_by?: string | null
          id?: string
          notes?: string | null
          room_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          duration_minutes?: number | null
          entered_at?: string
          entered_by?: string | null
          entry_method?: string | null
          exit_method?: string | null
          exited_at?: string | null
          exited_by?: string | null
          id?: string
          notes?: string | null
          room_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_room_entries_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "room_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_room_entries_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_room_entries_exited_by_fkey"
            columns: ["exited_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_exited_by_fkey"
            columns: ["exited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_exited_by_fkey"
            columns: ["exited_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_room_entries_exited_by_fkey"
            columns: ["exited_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_room_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "childcare_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "current_room_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_room_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      timesheet_entries: {
        Row: {
          created_at: string
          end_time: string
          entry_date: string
          hours_logged: number
          id: string
          start_time: string
          updated_at: string
          user_full_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          entry_date: string
          hours_logged: number
          id?: string
          start_time: string
          updated_at?: string
          user_full_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          entry_date?: string
          hours_logged?: number
          id?: string
          start_time?: string
          updated_at?: string
          user_full_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_timesheet_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_timesheet_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_timesheet_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "fk_timesheet_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      unsubscribes: {
        Row: {
          campaign_id: string | null
          created_at: string
          email: string
          id: string
          reason: string | null
          unsubscribe_source: string | null
          unsubscribed_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          email: string
          id?: string
          reason?: string | null
          unsubscribe_source?: string | null
          unsubscribed_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
          unsubscribe_source?: string | null
          unsubscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_work_schedules: {
        Row: {
          created_at: string | null
          friday_hours: number
          id: string
          monday_hours: number
          saturday_hours: number
          sunday_hours: number
          thursday_hours: number
          tuesday_hours: number
          updated_at: string | null
          user_id: string
          wednesday_hours: number
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          friday_hours?: number
          id?: string
          monday_hours?: number
          saturday_hours?: number
          sunday_hours?: number
          thursday_hours?: number
          tuesday_hours?: number
          updated_at?: string | null
          user_id: string
          wednesday_hours?: number
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          friday_hours?: number
          id?: string
          monday_hours?: number
          saturday_hours?: number
          sunday_hours?: number
          thursday_hours?: number
          tuesday_hours?: number
          updated_at?: string | null
          user_id?: string
          wednesday_hours?: number
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "weekly_work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          allow_holiday_entries: boolean
          allow_weekend_entries: boolean
          created_at: string
          friday_hours: number | null
          id: string
          lock_reason: string | null
          locked_by: string | null
          locked_until_date: string | null
          monday_hours: number | null
          saturday_hours: number | null
          sunday_hours: number | null
          thursday_hours: number | null
          tuesday_hours: number | null
          user_id: string
          wednesday_hours: number | null
          working_days: number
        }
        Insert: {
          allow_holiday_entries?: boolean
          allow_weekend_entries?: boolean
          created_at?: string
          friday_hours?: number | null
          id?: string
          lock_reason?: string | null
          locked_by?: string | null
          locked_until_date?: string | null
          monday_hours?: number | null
          saturday_hours?: number | null
          sunday_hours?: number | null
          thursday_hours?: number | null
          tuesday_hours?: number | null
          user_id: string
          wednesday_hours?: number | null
          working_days?: number
        }
        Update: {
          allow_holiday_entries?: boolean
          allow_weekend_entries?: boolean
          created_at?: string
          friday_hours?: number | null
          id?: string
          lock_reason?: string | null
          locked_by?: string | null
          locked_until_date?: string | null
          monday_hours?: number | null
          saturday_hours?: number | null
          sunday_hours?: number | null
          thursday_hours?: number | null
          tuesday_hours?: number | null
          user_id?: string
          wednesday_hours?: number | null
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_work_schedules_locked_by"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_work_schedules_locked_by"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_work_schedules_locked_by"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "fk_work_schedules_locked_by"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "fk_work_schedules_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_work_schedules_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_work_schedules_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "fk_work_schedules_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
    }
    Views: {
      available_staff: {
        Row: {
          email: string | null
          employment_type:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
        }
        Insert: {
          email?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
        }
        Update: {
          email?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      compliance_violations: {
        Row: {
          description: string | null
          log_id: string | null
          performed_at: string | null
          performed_by: string | null
          performed_by_name: string | null
          required_staff: number | null
          room_name: string | null
          staff_count: string | null
          state_after: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "room_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "room_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      current_room_status: {
        Row: {
          children_over_3: number | null
          children_under_3: number | null
          current_staff: Json | null
          current_staff_count: number | null
          id: string | null
          is_compliant: boolean | null
          last_updated: string | null
          name: string | null
          ratio_over_3: number | null
          ratio_under_3: number | null
          required_educators: number | null
          room_number: number | null
          show_warning: boolean | null
          staff_shortage: number | null
          total_children: number | null
        }
        Relationships: []
      }
      daily_room_activity: {
        Row: {
          activity_date: string | null
          avg_duration_minutes: number | null
          first_entry_time: string | null
          last_exit_time: string | null
          room_name: string | null
          total_entries: number | null
          unique_staff_count: number | null
        }
        Relationships: []
      }
      room_summary: {
        Row: {
          children_over_3: number | null
          children_under_3: number | null
          current_staff: number | null
          id: string | null
          last_updated: string | null
          name: string | null
          required_staff: number | null
          room_number: number | null
          status: string | null
          total_children: number | null
        }
        Relationships: []
      }
      staff_daily_hours: {
        Row: {
          room_history: Json | null
          room_visits: number | null
          staff_id: string | null
          staff_name: string | null
          total_hours: number | null
          work_date: string | null
        }
        Relationships: []
      }
      staff_in_room: {
        Row: {
          email: string | null
          entered_at: string | null
          entry_id: string | null
          entry_method: string | null
          full_name: string | null
          room_id: string | null
          staff_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_room_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "childcare_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "current_room_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_room_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_report_view: {
        Row: {
          created_at: string | null
          email: string | null
          employee_card_id: string | null
          employee_id: string | null
          employment_type:
            | Database["public"]["Enums"]["employment_status"]
            | null
          end_time: string | null
          entry_date: string | null
          full_name: string | null
          hours_logged: number | null
          id: string | null
          organization: string | null
          start_time: string | null
          time_zone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_timesheet_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "available_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_timesheet_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_timesheet_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_daily_hours"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "fk_timesheet_entries_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_in_room"
            referencedColumns: ["staff_id"]
          },
        ]
      }
    }
    Functions: {
      calculate_business_days: {
        Args: { check_state?: string; end_date: string; start_date: string }
        Returns: number
      }
      calculate_hours: {
        Args: { end_time: string; start_time: string }
        Returns: number
      }
      calculate_required_educators: {
        Args: {
          p_children_over_3: number
          p_children_under_3: number
          p_ratio_over_3?: number
          p_ratio_under_3?: number
        }
        Returns: number
      }
      create_leave_adjustments_for_application: {
        Args: { p_leave_application_id: string }
        Returns: number
      }
      generate_device_token: {
        Args: { p_device_name: string; p_room_id: string }
        Returns: Json
      }
      generate_pay_periods: {
        Args: { p_num_periods?: number; p_start_date: string }
        Returns: number
      }
      get_campaign_recipients: {
        Args: { p_audience_filter?: string; p_target_tag?: string }
        Returns: {
          contact_id: string
          email: string
          full_name: string
        }[]
      }
      get_current_pay_period: {
        Args: never
        Returns: {
          id: string
          payroll_cutoff_date: string
          payroll_date: string
          period_end: string
          period_start: string
          status: string
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_next_pay_period: {
        Args: { current_period_id: string }
        Returns: string
      }
      get_pay_period_for_date: { Args: { check_date: string }; Returns: string }
      get_payroll_report: {
        Args: { p_pay_period_id: string }
        Returns: {
          actual_hours: number
          employee_id: string
          full_name: string
          leave_hours_post_cutoff: number
          leave_hours_pre_cutoff: number
          net_hours: number
          prior_period_adjustments: number
          scheduled_hours: number
          user_id: string
        }[]
      }
      get_room_status: { Args: { p_room_id: string }; Returns: Json }
      get_staff_current_room: { Args: { p_staff_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_after_payroll_cutoff: {
        Args: { check_date: string }
        Returns: boolean
      }
      is_email_unsubscribed: { Args: { check_email: string }; Returns: boolean }
      is_public_holiday: {
        Args: { check_date: string; check_state?: string }
        Returns: boolean
      }
      is_staff_in_room: { Args: { p_staff_id: string }; Returns: boolean }
      is_weekend: { Args: { check_date: string }; Returns: boolean }
      process_unsubscribe: {
        Args: { p_campaign_id?: string; p_email: string; p_reason?: string }
        Returns: Json
      }
      staff_enter_room:
        | {
            Args: {
              p_entered_by?: string
              p_entry_method?: string
              p_room_id: string
              p_staff_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_device_id?: string
              p_entered_by?: string
              p_entry_method?: string
              p_room_id: string
              p_staff_id: string
            }
            Returns: Json
          }
      staff_exit_room:
        | {
            Args: {
              p_exit_method?: string
              p_exited_by?: string
              p_room_id?: string
              p_staff_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_device_id?: string
              p_exit_method?: string
              p_exited_by?: string
              p_room_id?: string
              p_staff_id: string
            }
            Returns: Json
          }
      update_child_counts:
        | {
            Args: {
              p_children_over_3: number
              p_children_under_3: number
              p_room_id: string
              p_updated_by?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_children_over_3: number
              p_children_under_3: number
              p_device_id?: string
              p_room_id: string
              p_updated_by?: string
            }
            Returns: Json
          }
      validate_device_token: { Args: { p_token: string }; Returns: Json }
      verify_mac_address_access: {
        Args: { p_mac_address: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee"
      employment_status: "full-time" | "part-time" | "casual"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      user_role: "employee" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "employee"],
      employment_status: ["full-time", "part-time", "casual"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      user_role: ["employee", "admin"],
    },
  },
} as const
