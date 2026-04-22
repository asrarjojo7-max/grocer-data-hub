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
      branches: {
        Row: {
          created_at: string
          default_price_per_meter: number
          id: string
          is_active: boolean
          location: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_price_per_meter?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_price_per_meter?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      designer_whatsapp_links: {
        Row: {
          created_at: string
          green_api_instance_id: string
          green_api_token: string
          id: string
          last_sync_at: string | null
          monitored_chat_id: string | null
          monitored_chat_name: string | null
          phone_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          green_api_instance_id: string
          green_api_token: string
          id?: string
          last_sync_at?: string | null
          monitored_chat_id?: string | null
          monitored_chat_name?: string | null
          phone_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          green_api_instance_id?: string
          green_api_token?: string
          id?: string
          last_sync_at?: string | null
          monitored_chat_id?: string | null
          monitored_chat_name?: string | null
          phone_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      print_receipts: {
        Row: {
          ai_confidence: number | null
          ai_notes: string | null
          branch_id: string | null
          commission_amount: number
          commission_per_meter: number
          confirmed_at: string | null
          created_at: string
          customer_name: string | null
          extracted_data: Json | null
          id: string
          image_hash: string | null
          image_hashes: Json | null
          image_url: string | null
          image_urls: Json | null
          is_confirmed: boolean
          net_amount: number
          notes: string | null
          pages_count: number
          price_per_meter: number
          receipt_date: string
          source: string
          total_amount: number
          total_meters: number
          updated_at: string
          user_id: string | null
          whatsapp_from_number: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_notes?: string | null
          branch_id?: string | null
          commission_amount?: number
          commission_per_meter?: number
          confirmed_at?: string | null
          created_at?: string
          customer_name?: string | null
          extracted_data?: Json | null
          id?: string
          image_hash?: string | null
          image_hashes?: Json | null
          image_url?: string | null
          image_urls?: Json | null
          is_confirmed?: boolean
          net_amount?: number
          notes?: string | null
          pages_count?: number
          price_per_meter?: number
          receipt_date?: string
          source?: string
          total_amount?: number
          total_meters?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_from_number?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_notes?: string | null
          branch_id?: string | null
          commission_amount?: number
          commission_per_meter?: number
          confirmed_at?: string | null
          created_at?: string
          customer_name?: string | null
          extracted_data?: Json | null
          id?: string
          image_hash?: string | null
          image_hashes?: Json | null
          image_url?: string | null
          image_urls?: Json | null
          is_confirmed?: boolean
          net_amount?: number
          notes?: string | null
          pages_count?: number
          price_per_meter?: number
          receipt_date?: string
          source?: string
          total_amount?: number
          total_meters?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_from_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "print_receipts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          commission_per_meter: number
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          commission_per_meter?: number
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          commission_per_meter?: number
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number
          branch_id: string
          confirmed_at: string | null
          created_at: string
          extracted_data: Json | null
          id: string
          image_url: string | null
          is_confirmed: boolean
          notes: string | null
          sender_name: string | null
          sender_phone: string | null
          transfer_date: string
          updated_at: string
          whatsapp_connection_id: string | null
        }
        Insert: {
          amount: number
          branch_id: string
          confirmed_at?: string | null
          created_at?: string
          extracted_data?: Json | null
          id?: string
          image_url?: string | null
          is_confirmed?: boolean
          notes?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          transfer_date?: string
          updated_at?: string
          whatsapp_connection_id?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string
          confirmed_at?: string | null
          created_at?: string
          extracted_data?: Json | null
          id?: string
          image_url?: string | null
          is_confirmed?: boolean
          notes?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          transfer_date?: string
          updated_at?: string
          whatsapp_connection_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_whatsapp_connection_id_fkey"
            columns: ["whatsapp_connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_connections: {
        Row: {
          access_token: string | null
          branch_id: string
          connection_type: string
          created_at: string
          green_api_instance_id: string | null
          green_api_token: string | null
          id: string
          last_sync_at: string | null
          phone_number: string
          status: Database["public"]["Enums"]["whatsapp_connection_status"]
          updated_at: string
          verification_code: string | null
          verification_expires_at: string | null
          webhook_verify_token: string | null
          whatsapp_business_id: string | null
        }
        Insert: {
          access_token?: string | null
          branch_id: string
          connection_type?: string
          created_at?: string
          green_api_instance_id?: string | null
          green_api_token?: string | null
          id?: string
          last_sync_at?: string | null
          phone_number: string
          status?: Database["public"]["Enums"]["whatsapp_connection_status"]
          updated_at?: string
          verification_code?: string | null
          verification_expires_at?: string | null
          webhook_verify_token?: string | null
          whatsapp_business_id?: string | null
        }
        Update: {
          access_token?: string | null
          branch_id?: string
          connection_type?: string
          created_at?: string
          green_api_instance_id?: string | null
          green_api_token?: string | null
          id?: string
          last_sync_at?: string | null
          phone_number?: string
          status?: Database["public"]["Enums"]["whatsapp_connection_status"]
          updated_at?: string
          verification_code?: string | null
          verification_expires_at?: string | null
          webhook_verify_token?: string | null
          whatsapp_business_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          created_at: string
          from_number: string
          id: string
          media_url: string | null
          message_id: string
          message_type: string
          processed: boolean
          processed_at: string | null
          whatsapp_connection_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          from_number: string
          id?: string
          media_url?: string | null
          message_id: string
          message_type: string
          processed?: boolean
          processed_at?: string | null
          whatsapp_connection_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          from_number?: string
          id?: string
          media_url?: string | null
          message_id?: string
          message_type?: string
          processed?: boolean
          processed_at?: string | null
          whatsapp_connection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_whatsapp_connection_id_fkey"
            columns: ["whatsapp_connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "accountant"
      whatsapp_connection_status: "connected" | "pending" | "disconnected"
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
      app_role: ["admin", "accountant"],
      whatsapp_connection_status: ["connected", "pending", "disconnected"],
    },
  },
} as const
