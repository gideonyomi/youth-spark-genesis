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
      about_content: {
        Row: {
          body: string | null
          eyebrow: string | null
          headline: string | null
          id: number
          scripture: string | null
          updated_at: string
          watchword: string | null
        }
        Insert: {
          body?: string | null
          eyebrow?: string | null
          headline?: string | null
          id?: number
          scripture?: string | null
          updated_at?: string
          watchword?: string | null
        }
        Update: {
          body?: string | null
          eyebrow?: string | null
          headline?: string | null
          id?: number
          scripture?: string | null
          updated_at?: string
          watchword?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          age_range: string | null
          created_at: string
          email: string
          event: string
          full_name: string
          id: string
          notes: string | null
          payment_reference: string | null
          payment_status: string
          phone: string | null
          photo_url: string | null
          registration_code: string | null
          state: string | null
          status: string
          zone_fellowship: string | null
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          email: string
          event: string
          full_name: string
          id?: string
          notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone?: string | null
          photo_url?: string | null
          registration_code?: string | null
          state?: string | null
          status?: string
          zone_fellowship?: string | null
        }
        Update: {
          age_range?: string | null
          created_at?: string
          email?: string
          event?: string
          full_name?: string
          id?: string
          notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone?: string | null
          photo_url?: string | null
          registration_code?: string | null
          state?: string | null
          status?: string
          zone_fellowship?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          badge: string | null
          created_at: string
          date: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          published: boolean
          sort_order: number
          tag: string
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          published?: boolean
          sort_order?: number
          tag: string
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          published?: boolean
          sort_order?: number
          tag?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_testimonies: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          quote: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          quote: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      general_overseer: {
        Row: {
          bio: string | null
          id: number
          name: string | null
          photo_url: string | null
          quote: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          id?: number
          name?: string | null
          photo_url?: string | null
          quote?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          id?: number
          name?: string | null
          photo_url?: string | null
          quote?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          cta_primary_label: string | null
          cta_primary_link: string | null
          cta_secondary_label: string | null
          cta_secondary_link: string | null
          eyebrow: string | null
          headline: string | null
          id: number
          image_url: string | null
          subhead: string | null
          updated_at: string
        }
        Insert: {
          cta_primary_label?: string | null
          cta_primary_link?: string | null
          cta_secondary_label?: string | null
          cta_secondary_link?: string | null
          eyebrow?: string | null
          headline?: string | null
          id?: number
          image_url?: string | null
          subhead?: string | null
          updated_at?: string
        }
        Update: {
          cta_primary_label?: string | null
          cta_primary_link?: string | null
          cta_secondary_label?: string | null
          cta_secondary_link?: string | null
          eyebrow?: string | null
          headline?: string | null
          id?: number
          image_url?: string | null
          subhead?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      history_milestones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          theme: string
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          theme: string
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          theme?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      leadership: {
        Row: {
          bio: string | null
          created_at: string
          group_name: string
          id: string
          name: string
          photo_url: string | null
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          group_name: string
          id?: string
          name: string
          photo_url?: string | null
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          group_name?: string
          id?: string
          name?: string
          photo_url?: string | null
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      livestream_links: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      ministries: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      pending_signups: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          anonymous: boolean
          created_at: string
          email: string | null
          id: string
          name: string | null
          request: string
          status: string
        }
        Insert: {
          anonymous?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          request: string
          status?: string
        }
        Update: {
          anonymous?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          request?: string
          status?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      registration_counters: {
        Row: {
          event: string
          last_number: number
        }
        Insert: {
          event: string
          last_number?: number
        }
        Update: {
          event?: string
          last_number?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimony_submissions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          location: string | null
          name: string
          status: string
          story: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          name: string
          status?: string
          story: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          name?: string
          status?: string
          story?: string
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
      webhook_logs: {
        Row: {
          created_at: string
          event_type: string | null
          id: string
          message: string | null
          payload: Json | null
          signature_valid: boolean | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          id?: string
          message?: string | null
          payload?: Json | null
          signature_valid?: boolean | null
          source: string
          status: string
        }
        Update: {
          created_at?: string
          event_type?: string | null
          id?: string
          message?: string | null
          payload?: Json | null
          signature_valid?: boolean | null
          source?: string
          status?: string
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor"
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
      app_role: ["admin", "editor"],
    },
  },
} as const
