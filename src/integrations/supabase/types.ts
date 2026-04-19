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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          checklist_completed: boolean
          created_at: string
          id: string
          job_id: string
          notes: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist_completed?: boolean
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist_completed?: boolean
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_assignments: {
        Row: {
          application_id: string
          batch_id: string
          created_at: string
          id: string
        }
        Insert: {
          application_id: string
          batch_id: string
          created_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          batch_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "travel_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          job_id: string | null
          max_uses: number | null
          updated_at: string
          uses_count: number
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          job_id?: string | null
          max_uses?: number | null
          updated_at?: string
          uses_count?: number
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          job_id?: string | null
          max_uses?: number | null
          updated_at?: string
          uses_count?: number
        }
        Relationships: []
      }
      discount_redemptions: {
        Row: {
          amount_discounted: number
          code: string
          created_at: string
          discount_code_id: string | null
          id: string
          payment_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount_discounted?: number
          code: string
          created_at?: string
          discount_code_id?: string | null
          id?: string
          payment_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          amount_discounted?: number
          code?: string
          created_at?: string
          discount_code_id?: string | null
          id?: string
          payment_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          admin_notes: string | null
          application_id: string | null
          created_at: string
          document_type: string
          file_name: string | null
          file_url: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          application_id?: string | null
          created_at?: string
          document_type: string
          file_name?: string | null
          file_url: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          application_id?: string | null
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_url?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          description: string | null
          id: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          description?: string | null
          id?: string
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          description?: string | null
          id?: string
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          application_fee: number | null
          city: string | null
          country: string
          created_at: string
          currency: string | null
          deadline: string | null
          deposit_enabled: boolean | null
          deposit_type: string | null
          deposit_value: number | null
          description: string | null
          id: string
          is_active: boolean | null
          job_type: string | null
          requirements: string | null
          salary: string | null
          slots_available: number | null
          title: string
          updated_at: string
        }
        Insert: {
          application_fee?: number | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string | null
          deadline?: string | null
          deposit_enabled?: boolean | null
          deposit_type?: string | null
          deposit_value?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          requirements?: string | null
          salary?: string | null
          slots_available?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          application_fee?: number | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string | null
          deadline?: string | null
          deposit_enabled?: boolean | null
          deposit_type?: string | null
          deposit_value?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          requirements?: string | null
          salary?: string | null
          slots_available?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          application_id: string | null
          balance_remaining: number | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          is_deposit: boolean | null
          payment_method: string | null
          payment_reference: string | null
          payment_type: string | null
          phone_number: string | null
          receipt_number: string | null
          service_order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          application_id?: string | null
          balance_remaining?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_deposit?: boolean | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_type?: string | null
          phone_number?: string | null
          receipt_number?: string | null
          service_order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          application_id?: string | null
          balance_remaining?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_deposit?: boolean | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_type?: string | null
          phone_number?: string | null
          receipt_number?: string | null
          service_order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          chosen_path: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          id_number: string | null
          nationality: string | null
          passport_number: string | null
          phone: string | null
          referral_code: string | null
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          chosen_path?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          nationality?: string | null
          passport_number?: string | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          chosen_path?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          nationality?: string | null
          passport_number?: string | null
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          payment_id: string | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_amount: number | null
          reward_currency: string | null
          reward_paid: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id?: string | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_amount?: number | null
          reward_currency?: string | null
          reward_paid?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string | null
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          reward_amount?: number | null
          reward_currency?: string | null
          reward_paid?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          completed_file_url: string | null
          created_at: string
          details: string | null
          id: string
          notes: string | null
          payment_id: string | null
          service_id: string
          status: string
          updated_at: string
          uploaded_file_url: string | null
          user_id: string
        }
        Insert: {
          completed_file_url?: string | null
          created_at?: string
          details?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          service_id: string
          status?: string
          updated_at?: string
          uploaded_file_url?: string | null
          user_id: string
        }
        Update: {
          completed_file_url?: string | null
          created_at?: string
          details?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          service_id?: string
          status?: string
          updated_at?: string
          uploaded_file_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_secret: boolean | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sponsorship_applications: {
        Row: {
          admin_notes: string | null
          application_fee_payment_id: string | null
          application_id: string | null
          created_at: string
          currency: string | null
          id: string
          reason: string
          requested_amount: number
          service_order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          application_fee_payment_id?: string | null
          application_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          reason: string
          requested_amount?: number
          service_order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          application_fee_payment_id?: string | null
          application_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          reason?: string
          requested_amount?: number
          service_order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          country: string | null
          created_at: string
          display_order: number | null
          full_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          job_title: string | null
          story: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_order?: number | null
          full_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          job_title?: string | null
          story: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          display_order?: number | null
          full_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          job_title?: string | null
          story?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          display_order: number
          full_name: string
          id: string
          is_active: boolean
          photo_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_order?: number
          full_name: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_order?: number
          full_name?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      travel_batches: {
        Row: {
          accommodation_fee: number | null
          created_at: string
          currency: string | null
          destination: string
          id: string
          name: string
          notes: string | null
          status: string | null
          travel_date: string | null
          travel_fee: number | null
          updated_at: string
        }
        Insert: {
          accommodation_fee?: number | null
          created_at?: string
          currency?: string | null
          destination?: string
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          travel_date?: string | null
          travel_fee?: number | null
          updated_at?: string
        }
        Update: {
          accommodation_fee?: number | null
          created_at?: string
          currency?: string | null
          destination?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          travel_date?: string | null
          travel_fee?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_redemptions: {
        Row: {
          admin_notes: string | null
          amount: number
          application_id: string | null
          created_at: string
          currency: string | null
          id: string
          payment_id: string | null
          purpose: string | null
          service_order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          application_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payment_id?: string | null
          purpose?: string | null
          service_order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          application_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payment_id?: string | null
          purpose?: string | null
          service_order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
