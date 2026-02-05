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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attempt_logs: {
        Row: {
          attempt_id: string
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_logs_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      footer_content: {
        Row: {
          brand_description: string
          brand_name: string
          copyright_text: string
          id: string
          tagline: string
          updated_at: string
        }
        Insert: {
          brand_description?: string
          brand_name?: string
          copyright_text?: string
          id?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          brand_description?: string
          brand_name?: string
          copyright_text?: string
          id?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          order_index: number
          section: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          order_index?: number
          section: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          order_index?: number
          section?: string
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_access_rules: {
        Row: {
          access_type: Database["public"]["Enums"]["access_type"]
          allowed_batches: string[] | null
          created_at: string
          id: string
          password_hash: string | null
          quiz_id: string
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["access_type"]
          allowed_batches?: string[] | null
          created_at?: string
          id?: string
          password_hash?: string | null
          quiz_id: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["access_type"]
          allowed_batches?: string[] | null
          created_at?: string
          id?: string
          password_hash?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_access_rules_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_token: string
          correct_count: number | null
          created_at: string
          id: string
          passed: boolean | null
          percentage: number | null
          quiz_id: string
          score: number | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          student_identity_id: string
          submitted_at: string | null
          tab_switch_count: number | null
          time_spent_seconds: number | null
          total_marks: number | null
          unanswered_count: number | null
          wrong_count: number | null
        }
        Insert: {
          attempt_token?: string
          correct_count?: number | null
          created_at?: string
          id?: string
          passed?: boolean | null
          percentage?: number | null
          quiz_id: string
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_identity_id: string
          submitted_at?: string | null
          tab_switch_count?: number | null
          time_spent_seconds?: number | null
          total_marks?: number | null
          unanswered_count?: number | null
          wrong_count?: number | null
        }
        Update: {
          attempt_token?: string
          correct_count?: number | null
          created_at?: string
          id?: string
          passed?: boolean | null
          percentage?: number | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_identity_id?: string
          submitted_at?: string | null
          tab_switch_count?: number | null
          time_spent_seconds?: number | null
          total_marks?: number | null
          unanswered_count?: number | null
          wrong_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_identity_id_fkey"
            columns: ["student_identity_id"]
            isOneToOne: false
            referencedRelation: "student_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          archived_at: string | null
          correct_option: string
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          is_archived: boolean
          marks: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          archived_at?: string | null
          correct_option: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          is_archived?: boolean
          marks?: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index?: number
          question_text: string
          quiz_id: string
        }
        Update: {
          archived_at?: string | null
          correct_option?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          is_archived?: boolean
          marks?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          order_index?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answered_at: string | null
          attempt_id: string
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          question_id: string
          selected_option: string | null
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id: string
          selected_option?: string | null
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string
          selected_option?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          archived_at: string | null
          created_at: string
          creator_id: string
          description: string | null
          ends_at: string | null
          first_position_min: number
          id: string
          is_archived: boolean
          is_published: boolean
          max_attempts: number | null
          negative_marking: boolean
          negative_marks_per_wrong: number | null
          passing_percentage: number
          second_position_min: number
          show_results_to_students: boolean
          shuffle_questions: boolean
          starts_at: string | null
          third_position_min: number
          time_limit_minutes: number
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          ends_at?: string | null
          first_position_min?: number
          id?: string
          is_archived?: boolean
          is_published?: boolean
          max_attempts?: number | null
          negative_marking?: boolean
          negative_marks_per_wrong?: number | null
          passing_percentage?: number
          second_position_min?: number
          show_results_to_students?: boolean
          shuffle_questions?: boolean
          starts_at?: string | null
          third_position_min?: number
          time_limit_minutes?: number
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          ends_at?: string | null
          first_position_min?: number
          id?: string
          is_archived?: boolean
          is_published?: boolean
          max_attempts?: number | null
          negative_marking?: boolean
          negative_marks_per_wrong?: number | null
          passing_percentage?: number
          second_position_min?: number
          show_results_to_students?: boolean
          shuffle_questions?: boolean
          starts_at?: string | null
          third_position_min?: number
          time_limit_minutes?: number
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      student_identities: {
        Row: {
          batch: string
          college_id: string
          created_at: string
          full_name: string
          id: string
          roll_number: string
        }
        Insert: {
          batch: string
          college_id: string
          created_at?: string
          full_name: string
          id?: string
          roll_number: string
        }
        Update: {
          batch?: string
          college_id?: string
          created_at?: string
          full_name?: string
          id?: string
          roll_number?: string
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          options: Json | null
          order_index: number
          question_text: string
          question_type: Database["public"]["Enums"]["survey_question_type"]
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          question_text: string
          question_type: Database["public"]["Enums"]["survey_question_type"]
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["survey_question_type"]
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          id: string
          respondent_email: string | null
          respondent_name: string | null
          responses: Json
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          respondent_email?: string | null
          respondent_name?: string | null
          responses: Json
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          respondent_email?: string | null
          respondent_name?: string | null
          responses?: Json
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_published?: boolean
          title?: string
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
    }
    Views: {
      quiz_questions_public: {
        Row: {
          created_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          id: string | null
          marks: number | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          order_index: number | null
          question_text: string | null
          quiz_id: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string | null
          marks?: number | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          order_index?: number | null
          question_text?: string | null
          quiz_id?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string | null
          marks?: number | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          order_index?: number | null
          question_text?: string | null
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_assign_role: {
        Args: {
          _assigner_id: string
          _target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      get_quiz_questions_for_attempt: {
        Args: { p_quiz_id: string }
        Returns: {
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          marks: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_text: string
          quiz_id: string
        }[]
      }
      get_role_level: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_quiz_attempts: {
        Args: { p_quiz_id: string }
        Returns: undefined
      }
      transfer_superadmin_ownership: {
        Args: { _new_owner_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_type: "public" | "password" | "batch"
      app_role: "admin" | "creator" | "student" | "super_admin"
      attempt_status:
        | "in_progress"
        | "submitted"
        | "auto_submitted"
        | "abandoned"
      difficulty_level: "easy" | "medium" | "hard"
      survey_question_type: "short_text" | "long_text" | "dropdown" | "checkbox"
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
      access_type: ["public", "password", "batch"],
      app_role: ["admin", "creator", "student", "super_admin"],
      attempt_status: [
        "in_progress",
        "submitted",
        "auto_submitted",
        "abandoned",
      ],
      difficulty_level: ["easy", "medium", "hard"],
      survey_question_type: ["short_text", "long_text", "dropdown", "checkbox"],
    },
  },
} as const
