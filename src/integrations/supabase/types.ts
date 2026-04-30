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
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link: string | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          designation: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          quote: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          designation?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name: string
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          designation?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          recovery_email: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          recovery_email?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          recovery_email?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          is_master: boolean
          permissions: string[]
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          is_master?: boolean
          permissions?: string[]
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          is_master?: boolean
          permissions?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_url: string
          id: string
          name: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_url?: string
          id?: string
          name?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_url?: string
          id?: string
          name?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          vehicle_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          vehicle_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_images: {
        Row: {
          created_at: string
          id: string
          image_position: string | null
          image_url: string
          sort_order: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_position?: string | null
          image_url?: string
          sort_order?: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_position?: string | null
          image_url?: string
          sort_order?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_movements: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          new_value: string | null
          previous_value: string | null
          type: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          type?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          type?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_movements_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          accessories: string[] | null
          brand: string
          chassis: string | null
          color: string
          created_at: string
          crv: string | null
          current_owner: string | null
          description: string | null
          display_name: string | null
          doors: number | null
          dpvat_year: string | null
          engine_number: string | null
          entry_date: string | null
          extra_expenses_total: number | null
          factory_warranty_date: string | null
          featured: boolean | null
          fipe_price: number | null
          fuel: string
          highlights: string[] | null
          id: string
          image_position: string
          image_url: string
          internal_color: string | null
          internal_notes: string | null
          is_active: boolean
          is_promotion: boolean
          km: number
          licensing_year: string | null
          model: string
          ownership_type: string | null
          plate: string | null
          power_cv: string | null
          price: number
          promotion_label: string | null
          promotion_price: number | null
          promotion_until: string | null
          purchase_price: number | null
          renavam: string | null
          show_on_website: boolean | null
          status: string | null
          suggested_price: number | null
          total_cost: number | null
          transmission: string
          updated_at: string
          version: string
          video_url: string | null
          yard_location: string | null
          year: number
          year_model: number | null
        }
        Insert: {
          accessories?: string[] | null
          brand: string
          chassis?: string | null
          color?: string
          created_at?: string
          crv?: string | null
          current_owner?: string | null
          description?: string | null
          display_name?: string | null
          doors?: number | null
          dpvat_year?: string | null
          engine_number?: string | null
          entry_date?: string | null
          extra_expenses_total?: number | null
          factory_warranty_date?: string | null
          featured?: boolean | null
          fipe_price?: number | null
          fuel?: string
          highlights?: string[] | null
          id?: string
          image_position?: string
          image_url?: string
          internal_color?: string | null
          internal_notes?: string | null
          is_active?: boolean
          is_promotion?: boolean
          km?: number
          licensing_year?: string | null
          model: string
          ownership_type?: string | null
          plate?: string | null
          power_cv?: string | null
          price?: number
          promotion_label?: string | null
          promotion_price?: number | null
          promotion_until?: string | null
          purchase_price?: number | null
          renavam?: string | null
          show_on_website?: boolean | null
          status?: string | null
          suggested_price?: number | null
          total_cost?: number | null
          transmission?: string
          updated_at?: string
          version?: string
          video_url?: string | null
          yard_location?: string | null
          year: number
          year_model?: number | null
        }
        Update: {
          accessories?: string[] | null
          brand?: string
          chassis?: string | null
          color?: string
          created_at?: string
          crv?: string | null
          current_owner?: string | null
          description?: string | null
          display_name?: string | null
          doors?: number | null
          dpvat_year?: string | null
          engine_number?: string | null
          entry_date?: string | null
          extra_expenses_total?: number | null
          factory_warranty_date?: string | null
          featured?: boolean | null
          fipe_price?: number | null
          fuel?: string
          highlights?: string[] | null
          id?: string
          image_position?: string
          image_url?: string
          internal_color?: string | null
          internal_notes?: string | null
          is_active?: boolean
          is_promotion?: boolean
          km?: number
          licensing_year?: string | null
          model?: string
          ownership_type?: string | null
          plate?: string | null
          power_cv?: string | null
          price?: number
          promotion_label?: string | null
          promotion_price?: number | null
          promotion_until?: string | null
          purchase_price?: number | null
          renavam?: string | null
          show_on_website?: boolean | null
          status?: string | null
          suggested_price?: number | null
          total_cost?: number | null
          transmission?: string
          updated_at?: string
          version?: string
          video_url?: string | null
          yard_location?: string | null
          year?: number
          year_model?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master_admin: { Args: { _user_id: string }; Returns: boolean }
      resolve_login_email: { Args: { _login: string }; Returns: string }
      resolve_recovery_email: { Args: { _login: string }; Returns: string }
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
