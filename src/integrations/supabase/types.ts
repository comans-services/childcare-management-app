export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          details: Json | null
          entity_name: string | null
          id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          details?: Json | null
          entity_name?: string | null
          id?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          details?: Json | null
          entity_name?: string | null
          id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      contract_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          contract_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          contract_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_assignments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_services: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          service_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          service_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_services_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string | null
          end_date: string
          file_id: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          status: string
          updated_at: string
          uploaded_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_date: string
          file_id?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          status: string
          updated_at?: string
          uploaded_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_date?: string
          file_id?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contracts_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          employee_card_id: string | null
          employee_id: string | null
          employment_type:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string | null
          id: string
          organization: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          time_zone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_card_id?: string | null
          employee_id?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string | null
          id: string
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          time_zone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_card_id?: string | null
          employee_id?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string | null
          id?: string
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          time_zone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_hours: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          end_date: string | null
          has_budget_limit: boolean
          id: string
          is_active: boolean | null
          is_internal: boolean | null
          name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          budget_hours: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          has_budget_limit?: boolean
          id?: string
          is_active?: boolean | null
          is_internal?: boolean | null
          name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          budget_hours?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          has_budget_limit?: boolean
          id?: string
          is_active?: boolean | null
          is_internal?: boolean | null
          name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          contract_id: string | null
          created_at: string
          end_time: string | null
          entry_date: string
          entry_type: string | null
          hours_logged: number
          id: string
          jira_task_id: string | null
          notes: string | null
          project_id: string | null
          start_time: string | null
          updated_at: string
          user_full_name: string | null
          user_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          end_time?: string | null
          entry_date: string
          entry_type?: string | null
          hours_logged: number
          id?: string
          jira_task_id?: string | null
          notes?: string | null
          project_id?: string | null
          start_time?: string | null
          updated_at?: string
          user_full_name?: string | null
          user_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          end_time?: string | null
          entry_date?: string
          entry_type?: string | null
          hours_logged?: number
          id?: string
          jira_task_id?: string | null
          notes?: string | null
          project_id?: string | null
          start_time?: string | null
          updated_at?: string
          user_full_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_timesheet_entries_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_holiday_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          holiday_id: string
          id: string
          is_allowed: boolean
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          holiday_id: string
          id?: string
          is_allowed?: boolean
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          holiday_id?: string
          id?: string
          is_allowed?: boolean
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_holiday_permissions_holiday_id_fkey"
            columns: ["holiday_id"]
            isOneToOne: false
            referencedRelation: "public_holidays"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_work_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          friday_hours: number | null
          id: string
          monday_hours: number | null
          notes: string | null
          saturday_hours: number | null
          sunday_hours: number | null
          thursday_hours: number | null
          tuesday_hours: number | null
          updated_at: string
          user_id: string
          wednesday_hours: number | null
          week_start_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          friday_hours?: number | null
          id?: string
          monday_hours?: number | null
          notes?: string | null
          saturday_hours?: number | null
          sunday_hours?: number | null
          thursday_hours?: number | null
          tuesday_hours?: number | null
          updated_at?: string
          user_id: string
          wednesday_hours?: number | null
          week_start_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          friday_hours?: number | null
          id?: string
          monday_hours?: number | null
          notes?: string | null
          saturday_hours?: number | null
          sunday_hours?: number | null
          thursday_hours?: number | null
          tuesday_hours?: number | null
          updated_at?: string
          user_id?: string
          wednesday_hours?: number | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_work_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_work_schedules_user_id_fkey"
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
          created_by: string | null
          id: string
          lock_reason: string | null
          locked_at: string | null
          locked_by: string | null
          locked_until_date: string | null
          updated_at: string
          user_id: string
          working_days: number
        }
        Insert: {
          allow_holiday_entries?: boolean
          allow_weekend_entries?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_until_date?: string | null
          updated_at?: string
          user_id: string
          working_days?: number
        }
        Update: {
          allow_holiday_entries?: boolean
          allow_weekend_entries?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_until_date?: string | null
          updated_at?: string
          user_id?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_holiday_permission: {
        Args: {
          p_user_id: string
          p_holiday_date: string
          p_target_state?: string
        }
        Returns: {
          is_allowed: boolean
          permission_source: string
          holiday_name: string
          message: string
        }[]
      }
      get_audit_action_types: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_audit_logs_direct: {
        Args: { p_start_date?: string; p_end_date?: string; p_user_id?: string }
        Returns: {
          id: string
          user_id: string
          user_name: string
          action: string
          entity_name: string
          description: string
          details: Json
          created_at: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_global_lock_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users_locked: number
          earliest_lock_date: string
          latest_lock_date: string
          most_common_reason: string
        }[]
      }
      get_holiday_permission_matrix: {
        Args: { p_year?: number }
        Returns: {
          holiday_id: string
          holiday_name: string
          holiday_date: string
          user_id: string
          user_name: string
          user_email: string
          specific_permission: boolean
          general_permission: boolean
          effective_permission: boolean
          permission_source: string
        }[]
      }
      get_public_holiday_name: {
        Args: { entry_date: string; target_state?: string }
        Returns: string
      }
      get_user_activities: {
        Args: { p_start_date?: string; p_end_date?: string; p_user_id?: string }
        Returns: {
          id: string
          user_id: string
          user_name: string
          action: string
          entity_name: string
          description: string
          details: Json
          created_at: string
        }[]
      }
      get_user_display_name: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_users_missing_timesheet_entries: {
        Args: { p_week_start_date?: string }
        Returns: {
          user_id: string
          email: string
          full_name: string
          organization: string
          time_zone: string
          expected_days: number
          logged_days: number
          missing_days: number
          week_start_date: string
          week_end_date: string
        }[]
      }
      is_date_locked_for_user: {
        Args: { p_user_id: string; entry_date: string }
        Returns: boolean
      }
      is_public_holiday: {
        Args: { entry_date: string; target_state?: string }
        Returns: boolean
      }
      is_user_assigned_to_contract: {
        Args: { p_user_id: string; p_contract_id: string }
        Returns: boolean
      }
      is_user_assigned_to_project: {
        Args: { p_user_id: string; p_project_id: string }
        Returns: boolean
      }
      is_weekend_day: {
        Args: { entry_date: string }
        Returns: boolean
      }
      log_report_generation_secure: {
        Args: { p_report_type: string; p_filters: Json; p_result_count: number }
        Returns: undefined
      }
      timesheet_entries_report: {
        Args:
          | {
              p_start_date: string
              p_end_date: string
              p_user_id?: string
              p_project_id?: string
              p_customer_id?: string
              p_contract_id?: string
            }
          | {
              p_start_date: string
              p_end_date: string
              p_user_id?: string
              p_project_id?: string
              p_customer_id?: string
              p_contract_id?: string
              p_include_projects?: boolean
              p_include_contracts?: boolean
            }
        Returns: {
          id: string
          user_id: string
          project_id: string
          contract_id: string
          entry_date: string
          hours_logged: number
          notes: string
          jira_task_id: string
          created_at: string
          updated_at: string
          start_time: string
          end_time: string
          project_name: string
          project_description: string
          project_customer_id: string
          user_full_name: string
          user_email: string
          user_organization: string
          user_time_zone: string
          user_employee_card_id: string
        }[]
      }
    }
    Enums: {
      employment_status: "full-time" | "part-time"
      user_role: "employee" | "manager" | "admin"
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
      employment_status: ["full-time", "part-time"],
      user_role: ["employee", "manager", "admin"],
    },
  },
} as const
