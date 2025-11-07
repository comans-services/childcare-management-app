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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_application_attachments: {
        Row: {
          content_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          leave_application_id: string
          uploaded_at: string
        }
        Insert: {
          content_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          leave_application_id: string
          uploaded_at?: string
        }
        Update: {
          content_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          leave_application_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_attachments_application"
            columns: ["leave_application_id"]
            isOneToOne: false
            referencedRelation: "leave_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_applications: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_days_count: number
          created_at: string
          end_date: string
          id: string
          leave_type_id: string
          manager_comments: string | null
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_days_count: number
          created_at?: string
          end_date: string
          id?: string
          leave_type_id: string
          manager_comments?: string | null
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_days_count?: number
          created_at?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          manager_comments?: string | null
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_applications_approver"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_applications_type"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_applications_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          created_at: string
          id: string
          leave_type_id: string
          remaining_days: number | null
          total_days: number
          updated_at: string
          used_days: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          leave_type_id: string
          remaining_days?: number | null
          total_days?: number
          updated_at?: string
          used_days?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          leave_type_id?: string
          remaining_days?: number | null
          total_days?: number
          updated_at?: string
          used_days?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_balances_type"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_balances_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          carry_over_expiry_months: number
          created_at: string
          default_balance_days: number
          description: string | null
          id: string
          is_active: boolean
          max_carry_over_days: number
          name: string
          requires_attachment: boolean
          updated_at: string
        }
        Insert: {
          carry_over_expiry_months?: number
          created_at?: string
          default_balance_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_carry_over_days?: number
          name: string
          requires_attachment?: boolean
          updated_at?: string
        }
        Update: {
          carry_over_expiry_months?: number
          created_at?: string
          default_balance_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_carry_over_days?: number
          name?: string
          requires_attachment?: boolean
          updated_at?: string
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
          id?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          allow_holiday_entries: boolean
          allow_weekend_entries: boolean
          created_at: string
          id: string
          lock_reason: string | null
          locked_by: string | null
          locked_until_date: string | null
          user_id: string
          working_days: number
        }
        Insert: {
          allow_holiday_entries?: boolean
          allow_weekend_entries?: boolean
          created_at?: string
          id?: string
          lock_reason?: string | null
          locked_by?: string | null
          locked_until_date?: string | null
          user_id: string
          working_days?: number
        }
        Update: {
          allow_holiday_entries?: boolean
          allow_weekend_entries?: boolean
          created_at?: string
          id?: string
          lock_reason?: string | null
          locked_by?: string | null
          locked_until_date?: string | null
          user_id?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_work_schedules_locked_by"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_work_schedules_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_public_holiday: {
        Args: { check_date: string; check_state?: string }
        Returns: boolean
      }
      is_weekend: { Args: { check_date: string }; Returns: boolean }
    }
    Enums: {
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
      employment_status: ["full-time", "part-time", "casual"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      user_role: ["employee", "admin"],
    },
  },
} as const
