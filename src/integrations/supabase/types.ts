export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_credentials: {
        Row: {
          created_at: string
          id: string
          password: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password?: string
          username?: string
        }
        Relationships: []
      }
      app_version: {
        Row: {
          created_at: string | null
          id: number
          version: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          version: string
        }
        Update: {
          created_at?: string | null
          id?: number
          version?: string
        }
        Relationships: []
      }
      application_open: {
        Row: {
          cpu_serial: string | null
          graphics_card: string | null
          hwid: string | null
          id: number
          ip_address: string | null
          motherboard_serial: string | null
          os_version: string | null
          pc_name: string | null
          ram_capacity: string | null
          storage_capacity: string | null
          timestamp: string | null
          username: string | null
        }
        Insert: {
          cpu_serial?: string | null
          graphics_card?: string | null
          hwid?: string | null
          id?: number
          ip_address?: string | null
          motherboard_serial?: string | null
          os_version?: string | null
          pc_name?: string | null
          ram_capacity?: string | null
          storage_capacity?: string | null
          timestamp?: string | null
          username?: string | null
        }
        Update: {
          cpu_serial?: string | null
          graphics_card?: string | null
          hwid?: string | null
          id?: number
          ip_address?: string | null
          motherboard_serial?: string | null
          os_version?: string | null
          pc_name?: string | null
          ram_capacity?: string | null
          storage_capacity?: string | null
          timestamp?: string | null
          username?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          created_at: string
          full_name: string
          game_uid: string
          id: string
          mobile_number: string
          password: string
          status: string | null
          username: string
        }
        Insert: {
          created_at?: string
          full_name: string
          game_uid: string
          id?: string
          mobile_number: string
          password: string
          status?: string | null
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string
          game_uid?: string
          id?: string
          mobile_number?: string
          password?: string
          status?: string | null
          username?: string
        }
        Relationships: []
      }
      benaxregz_giveaway: {
        Row: {
          created_at: string
          email: string
          game_id: string
          game_name: string
          id: string
          is_winner: boolean | null
          mobile: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          game_id: string
          game_name: string
          id?: string
          is_winner?: boolean | null
          mobile: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          game_id?: string
          game_name?: string
          id?: string
          is_winner?: boolean | null
          mobile?: string
          name?: string
        }
        Relationships: []
      }
      Data: {
        Row: {
          created_at: string | null
          id: number | null
          Module: string | null
          replace: string | null
          search: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          Module?: string | null
          replace?: string | null
          search?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          Module?: string | null
          replace?: string | null
          search?: string | null
        }
        Relationships: []
      }
      display_data: {
        Row: {
          id: number
          ip_address: string | null
          status: string | null
          telegram_link: string | null
          title: string | null
        }
        Insert: {
          id?: number
          ip_address?: string | null
          status?: string | null
          telegram_link?: string | null
          title?: string | null
        }
        Update: {
          id?: number
          ip_address?: string | null
          status?: string | null
          telegram_link?: string | null
          title?: string | null
        }
        Relationships: []
      }
      giveaway_participants: {
        Row: {
          created_at: string
          email: string
          game_id: string
          game_name: string
          id: string
          is_winner: boolean | null
          mobile: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          game_id: string
          game_name: string
          id?: string
          is_winner?: boolean | null
          mobile: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          game_id?: string
          game_name?: string
          id?: string
          is_winner?: boolean | null
          mobile?: string
          name?: string
        }
        Relationships: []
      }
      giveaway_settings: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          is_active: boolean | null
          number_of_winners: number | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          number_of_winners?: number | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          number_of_winners?: number | null
          start_time?: string | null
        }
        Relationships: []
      }
      license_keys: {
        Row: {
          admin_approval: boolean | null
          banned: boolean | null
          expiredate: string | null
          hwid: string[] | null
          hwid_reset_count: number | null
          id: number
          key: string | null
          license_key: string
          max_devices: number | null
          mobile_number: string | null
          save_hwid: boolean | null
          subscription: string | null
        }
        Insert: {
          admin_approval?: boolean | null
          banned?: boolean | null
          expiredate?: string | null
          hwid?: string[] | null
          hwid_reset_count?: number | null
          id?: number
          key?: string | null
          license_key: string
          max_devices?: number | null
          mobile_number?: string | null
          save_hwid?: boolean | null
          subscription?: string | null
        }
        Update: {
          admin_approval?: boolean | null
          banned?: boolean | null
          expiredate?: string | null
          hwid?: string[] | null
          hwid_reset_count?: number | null
          id?: number
          key?: string | null
          license_key?: string
          max_devices?: number | null
          mobile_number?: string | null
          save_hwid?: boolean | null
          subscription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscription"
            columns: ["subscription"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["name"]
          },
        ]
      }
      login_details: {
        Row: {
          cpu_serial: string | null
          graphics_card: string | null
          hwid: string | null
          id: number
          ip_address: string | null
          login_time: string | null
          motherboard_serial: string | null
          os_version: string | null
          pc_name: string | null
          ram_capacity: string | null
          storage_capacity: string | null
          username: string
        }
        Insert: {
          cpu_serial?: string | null
          graphics_card?: string | null
          hwid?: string | null
          id?: number
          ip_address?: string | null
          login_time?: string | null
          motherboard_serial?: string | null
          os_version?: string | null
          pc_name?: string | null
          ram_capacity?: string | null
          storage_capacity?: string | null
          username: string
        }
        Update: {
          cpu_serial?: string | null
          graphics_card?: string | null
          hwid?: string | null
          id?: number
          ip_address?: string | null
          login_time?: string | null
          motherboard_serial?: string | null
          os_version?: string | null
          pc_name?: string | null
          ram_capacity?: string | null
          storage_capacity?: string | null
          username?: string
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          id: number
          status: string
          timestamp: string | null
          username: string
        }
        Insert: {
          id?: number
          status: string
          timestamp?: string | null
          username: string
        }
        Update: {
          id?: number
          status?: string
          timestamp?: string | null
          username?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: number
          text: string
          type: string
        }
        Insert: {
          id?: number
          text: string
          type: string
        }
        Update: {
          id?: number
          text?: string
          type?: string
        }
        Relationships: []
      }
      regz_cheat_status: {
        Row: {
          account_url: string
          id: number
          safety_status: string
          version: string
          website_url: string
        }
        Insert: {
          account_url: string
          id?: number
          safety_status: string
          version: string
          website_url: string
        }
        Update: {
          account_url?: string
          id?: number
          safety_status?: string
          version?: string
          website_url?: string
        }
        Relationships: []
      }
      subscription_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          admin_approval: boolean | null
          banned: boolean | null
          expiredate: string | null
          hwid: string[] | null
          hwid_reset_count: number | null
          id: number
          key: string | null
          max_devices: number | null
          mobile_number: string | null
          password: string
          save_hwid: boolean | null
          subscription: string | null
          username: string
        }
        Insert: {
          admin_approval?: boolean | null
          banned?: boolean | null
          expiredate?: string | null
          hwid?: string[] | null
          hwid_reset_count?: number | null
          id?: number
          key?: string | null
          max_devices?: number | null
          mobile_number?: string | null
          password: string
          save_hwid?: boolean | null
          subscription?: string | null
          username: string
        }
        Update: {
          admin_approval?: boolean | null
          banned?: boolean | null
          expiredate?: string | null
          hwid?: string[] | null
          hwid_reset_count?: number | null
          id?: number
          key?: string | null
          max_devices?: number | null
          mobile_number?: string | null
          password?: string
          save_hwid?: boolean | null
          subscription?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_subscription"
            columns: ["subscription"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "users_subscription_fkey"
            columns: ["subscription"]
            isOneToOne: false
            referencedRelation: "subscription_types"
            referencedColumns: ["name"]
          },
        ]
      }
      web_login_regz: {
        Row: {
          created_at: string
          email: string
          id: number
          password: string
          subscription_type: string
          supabase_api_key: string | null
          supabase_url: string | null
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          password: string
          subscription_type: string
          supabase_api_key?: string | null
          supabase_url?: string | null
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          password?: string
          subscription_type?: string
          supabase_api_key?: string | null
          supabase_url?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_random_license_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      select_five_random_winners: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      subscription_type:
        | "free"
        | "basic"
        | "premium"
        | "enterprise"
        | "Supreme"
        | "Essential"
        | "Legit"
        | "SupremeEssential"
        | "SupremeEssentialExternal"
        | "XEssentialExternal"
        | "XSupremeExternal"
        | "External"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
