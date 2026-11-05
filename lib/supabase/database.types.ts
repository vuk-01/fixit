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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_code: string | null
          finished_at: string | null
          id: string
          input_tokens: number | null
          meta: Json | null
          model: string | null
          outcome: Database["public"]["Enums"]["agent_run_outcome"] | null
          output_tokens: number | null
          photo_count: number | null
          report_id: string | null
          started_at: string
          step: Database["public"]["Enums"]["agent_step"]
          stop_reason: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          meta?: Json | null
          model?: string | null
          outcome?: Database["public"]["Enums"]["agent_run_outcome"] | null
          output_tokens?: number | null
          photo_count?: number | null
          report_id?: string | null
          started_at?: string
          step: Database["public"]["Enums"]["agent_step"]
          stop_reason?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          meta?: Json | null
          model?: string | null
          outcome?: Database["public"]["Enums"]["agent_run_outcome"] | null
          output_tokens?: number | null
          photo_count?: number | null
          report_id?: string | null
          started_at?: string
          step?: Database["public"]["Enums"]["agent_step"]
          stop_reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatches: {
        Row: {
          created_at: string
          delivered_to: string[] | null
          email_mode: string
          error_code: string | null
          finished_at: string | null
          id: string
          letter_id: string
          provider_message_id: string | null
          report_id: string
          started_at: string
          status: Database["public"]["Enums"]["dispatch_status"]
        }
        Insert: {
          created_at?: string
          delivered_to?: string[] | null
          email_mode: string
          error_code?: string | null
          finished_at?: string | null
          id?: string
          letter_id: string
          provider_message_id?: string | null
          report_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["dispatch_status"]
        }
        Update: {
          created_at?: string
          delivered_to?: string[] | null
          email_mode?: string
          error_code?: string | null
          finished_at?: string | null
          id?: string
          letter_id?: string
          provider_message_id?: string | null
          report_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["dispatch_status"]
        }
        Relationships: [
          {
            foreignKeyName: "dispatches_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          email: string | null
          email_source_url: string | null
          email_verified_at: string | null
          id: string
          is_active: boolean
          municipality_id: string | null
          name: string
          short_name: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_source_url?: string | null
          email_verified_at?: string | null
          id?: string
          is_active?: boolean
          municipality_id?: string | null
          name: string
          short_name?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          email_source_url?: string | null
          email_verified_at?: string | null
          id?: string
          is_active?: boolean
          municipality_id?: string | null
          name?: string
          short_name?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institutions_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_rules: {
        Row: {
          category: Database["public"]["Enums"]["report_category"]
          cc_institution_id: string | null
          created_at: string
          id: string
          institution_id: string
          municipality_id: string
          notes: string | null
          source_excerpt: string | null
          source_title: string
          source_type: Database["public"]["Enums"]["source_type"]
          source_url: string | null
          updated_at: string
          verified_at: string
          verified_by: string
        }
        Insert: {
          category: Database["public"]["Enums"]["report_category"]
          cc_institution_id?: string | null
          created_at?: string
          id?: string
          institution_id: string
          municipality_id: string
          notes?: string | null
          source_excerpt?: string | null
          source_title: string
          source_type: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          updated_at?: string
          verified_at: string
          verified_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"]
          cc_institution_id?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          municipality_id?: string
          notes?: string | null
          source_excerpt?: string | null
          source_title?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          updated_at?: string
          verified_at?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_rules_cc_institution_id_fkey"
            columns: ["cc_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jurisdiction_rules_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jurisdiction_rules_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          body_text: string
          cc_email: string | null
          cc_institution_id: string | null
          created_at: string
          id: string
          includes_contact: boolean
          institution_id: string
          jurisdiction_rule_id: string | null
          kind: Database["public"]["Enums"]["letter_kind"]
          report_id: string
          sent_at: string | null
          subject: string
          to_email: string
        }
        Insert: {
          body_text: string
          cc_email?: string | null
          cc_institution_id?: string | null
          created_at?: string
          id?: string
          includes_contact: boolean
          institution_id: string
          jurisdiction_rule_id?: string | null
          kind: Database["public"]["Enums"]["letter_kind"]
          report_id: string
          sent_at?: string | null
          subject: string
          to_email: string
        }
        Update: {
          body_text?: string
          cc_email?: string | null
          cc_institution_id?: string | null
          created_at?: string
          id?: string
          includes_contact?: boolean
          institution_id?: string
          jurisdiction_rule_id?: string | null
          kind?: Database["public"]["Enums"]["letter_kind"]
          report_id?: string
          sent_at?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_cc_institution_id_fkey"
            columns: ["cc_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_jurisdiction_rule_id_fkey"
            columns: ["jurisdiction_rule_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_log: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          admin_id: string
          created_at: string
          id: string
          photo_id: string | null
          reason: string | null
          report_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          admin_id: string
          created_at?: string
          id?: string
          photo_id?: string | null
          reason?: string | null
          report_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          admin_id?: string
          created_at?: string
          id?: string
          photo_id?: string | null
          reason?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_log_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "report_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_log_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          boundary: unknown
          boundary_snapshot_at: string
          boundary_source: string
          created_at: string
          id: string
          iso_code: string
          name: string
          official_name: string
          osm_relation_id: number
        }
        Insert: {
          boundary: unknown
          boundary_snapshot_at: string
          boundary_source: string
          created_at?: string
          id?: string
          iso_code: string
          name: string
          official_name: string
          osm_relation_id: number
        }
        Update: {
          boundary?: unknown
          boundary_snapshot_at?: string
          boundary_source?: string
          created_at?: string
          id?: string
          iso_code?: string
          name?: string
          official_name?: string
          osm_relation_id?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          institution_id: string | null
          is_demo: boolean
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id: string
          institution_id?: string | null
          is_demo?: boolean
          last_name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          institution_id?: string | null
          is_demo?: boolean
          last_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      report_code_counters: {
        Row: {
          created_at: string
          last_value: number
          year: number
        }
        Insert: {
          created_at?: string
          last_value: number
          year: number
        }
        Update: {
          created_at?: string
          last_value?: number
          year?: number
        }
        Relationships: []
      }
      report_details: {
        Row: {
          ai_category: Database["public"]["Enums"]["report_category"] | null
          ai_confidence: number | null
          analysis_status: Database["public"]["Enums"]["analysis_status"]
          category_source: Database["public"]["Enums"]["category_source"] | null
          created_at: string
          image_contains_instructions: boolean
          immediate_danger: boolean
          is_municipal_problem: boolean | null
          report_id: string
          severity: Database["public"]["Enums"]["report_severity"] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_category?: Database["public"]["Enums"]["report_category"] | null
          ai_confidence?: number | null
          analysis_status?: Database["public"]["Enums"]["analysis_status"]
          category_source?:
            | Database["public"]["Enums"]["category_source"]
            | null
          created_at?: string
          image_contains_instructions?: boolean
          immediate_danger?: boolean
          is_municipal_problem?: boolean | null
          report_id: string
          severity?: Database["public"]["Enums"]["report_severity"] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_category?: Database["public"]["Enums"]["report_category"] | null
          ai_confidence?: number | null
          analysis_status?: Database["public"]["Enums"]["analysis_status"]
          category_source?:
            | Database["public"]["Enums"]["category_source"]
            | null
          created_at?: string
          image_contains_instructions?: boolean
          immediate_danger?: boolean
          is_municipal_problem?: boolean | null
          report_id?: string
          severity?: Database["public"]["Enums"]["report_severity"] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_details_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_events: {
        Row: {
          actor: Database["public"]["Enums"]["event_actor"]
          created_at: string
          from_status: Database["public"]["Enums"]["report_status"] | null
          id: string
          institution_id: string | null
          kind: Database["public"]["Enums"]["report_event_kind"]
          message: string | null
          previous_institution_id: string | null
          report_id: string
          to_status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          actor: Database["public"]["Enums"]["event_actor"]
          created_at?: string
          from_status?: Database["public"]["Enums"]["report_status"] | null
          id?: string
          institution_id?: string | null
          kind: Database["public"]["Enums"]["report_event_kind"]
          message?: string | null
          previous_institution_id?: string | null
          report_id: string
          to_status: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          actor?: Database["public"]["Enums"]["event_actor"]
          created_at?: string
          from_status?: Database["public"]["Enums"]["report_status"] | null
          id?: string
          institution_id?: string | null
          kind?: Database["public"]["Enums"]["report_event_kind"]
          message?: string | null
          previous_institution_id?: string | null
          report_id?: string
          to_status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "report_events_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_events_previous_institution_id_fkey"
            columns: ["previous_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_likes: {
        Row: {
          created_at: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_likes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_photos: {
        Row: {
          created_at: string
          has_personal_data: boolean
          hidden_at: string | null
          id: string
          position: number
          report_id: string
          sent_to_model: boolean
          storage_path: string
        }
        Insert: {
          created_at?: string
          has_personal_data?: boolean
          hidden_at?: string | null
          id?: string
          position: number
          report_id: string
          sent_to_model?: boolean
          storage_path: string
        }
        Update: {
          created_at?: string
          has_personal_data?: boolean
          hidden_at?: string | null
          id?: string
          position?: number
          report_id?: string
          sent_to_model?: boolean
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_photos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_private: {
        Row: {
          created_at: string
          report_id: string
          reporter_id: string
          share_contact: boolean
        }
        Insert: {
          created_at?: string
          report_id: string
          reporter_id: string
          share_contact?: boolean
        }
        Update: {
          created_at?: string
          report_id?: string
          reporter_id?: string
          share_contact?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "report_private_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_private_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          address: string | null
          address_source: string | null
          category: Database["public"]["Enums"]["report_category"] | null
          cc_institution_id: string | null
          closed_at: string | null
          code: string | null
          created_at: string
          description: string | null
          hidden_at: string | null
          id: string
          institution_id: string | null
          is_demo: boolean
          is_hidden: boolean | null
          jurisdiction_rule_id: string | null
          lat: number | null
          like_count: number
          lng: number | null
          location: unknown
          municipality_id: string | null
          routing_reason: Database["public"]["Enums"]["routing_reason"] | null
          status: Database["public"]["Enums"]["report_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_source?: string | null
          category?: Database["public"]["Enums"]["report_category"] | null
          cc_institution_id?: string | null
          closed_at?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          hidden_at?: string | null
          id?: string
          institution_id?: string | null
          is_demo?: boolean
          is_hidden?: boolean | null
          jurisdiction_rule_id?: string | null
          lat?: number | null
          like_count?: number
          lng?: number | null
          location?: unknown
          municipality_id?: string | null
          routing_reason?: Database["public"]["Enums"]["routing_reason"] | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_source?: string | null
          category?: Database["public"]["Enums"]["report_category"] | null
          cc_institution_id?: string | null
          closed_at?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          hidden_at?: string | null
          id?: string
          institution_id?: string | null
          is_demo?: boolean
          is_hidden?: boolean | null
          jurisdiction_rule_id?: string | null
          lat?: number | null
          like_count?: number
          lng?: number | null
          location?: unknown
          municipality_id?: string | null
          routing_reason?: Database["public"]["Enums"]["routing_reason"] | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_cc_institution_id_fkey"
            columns: ["cc_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_jurisdiction_rule_id_fkey"
            columns: ["jurisdiction_rule_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_report: {
        Args: { p_report_id: string }
        Returns: Database["public"]["Enums"]["report_status"]
      }
      add_report_photo: {
        Args: { p_report_id: string; p_storage_path: string }
        Returns: string
      }
      begin_submission: {
        Args: {
          p_category: Database["public"]["Enums"]["report_category"]
          p_description: string
          p_report_id: string
          p_share_contact: boolean
          p_user_id: string
        }
        Returns: {
          cc_institution_id: string
          code: string
          institution_id: string
          outcome: Database["public"]["Enums"]["jurisdiction_outcome"]
          rule_id: string
        }[]
      }
      clear_demo_data: { Args: never; Returns: string[] }
      complete_dispatch: {
        Args: {
          p_delivered_to: string[]
          p_dispatch_id: string
          p_email_mode: string
          p_error_code: string
          p_provider_message_id: string
          p_succeeded: boolean
        }
        Returns: Database["public"]["Enums"]["report_status"]
      }
      count_previous_reports: { Args: { p_report_id: string }; Returns: number }
      create_draft: {
        Args: { p_photo_paths: string[]; p_user_id: string }
        Returns: {
          agent_run_id: string
          report_id: string
        }[]
      }
      delete_draft: { Args: { p_report_id: string }; Returns: string[] }
      find_nearby_open_reports: {
        Args: {
          p_category: Database["public"]["Enums"]["report_category"]
          p_exclude_report_id?: string
          p_lat: number
          p_lng: number
        }
        Returns: {
          code: string
          distance_m: number
          id: string
          is_own: boolean
          like_count: number
          status: Database["public"]["Enums"]["report_status"]
          submitted_at: string
        }[]
      }
      get_jurisdiction_source: {
        Args: { p_rule_id: string }
        Returns: {
          cc_institution_name: string
          institution_name: string
          source_excerpt: string
          source_title: string
          source_type: Database["public"]["Enums"]["source_type"]
          source_url: string
          verified_at: string
        }[]
      }
      like_report: {
        Args: { p_report_id: string }
        Returns: {
          already_liked: boolean
          like_count: number
          liked: boolean
        }[]
      }
      next_report_code: { Args: never; Returns: string }
      record_classification: {
        Args: {
          p_agent_run_id: string
          p_analysis_status: Database["public"]["Enums"]["analysis_status"]
          p_report_id: string
          p_result: Json
          p_usage: Json
        }
        Returns: undefined
      }
      remove_report_photo: { Args: { p_photo_id: string }; Returns: string }
      resolve_jurisdiction: {
        Args: {
          p_category: Database["public"]["Enums"]["report_category"]
          p_municipality_id: string
        }
        Returns: {
          cc_institution_id: string
          institution_id: string
          outcome: Database["public"]["Enums"]["jurisdiction_outcome"]
          rule_id: string
        }[]
      }
      resolve_municipality: {
        Args: { p_lat: number; p_lng: number }
        Returns: string
      }
      set_photo_hidden: {
        Args: { p_hidden: boolean; p_photo_id: string; p_reason?: string }
        Returns: undefined
      }
      set_report_hidden: {
        Args: { p_hidden: boolean; p_reason?: string; p_report_id: string }
        Returns: undefined
      }
      set_report_status: {
        Args: {
          p_message?: string
          p_report_id: string
          p_to: Database["public"]["Enums"]["report_status"]
        }
        Returns: Database["public"]["Enums"]["report_status"]
      }
      start_dispatch: {
        Args: {
          p_actor_id: string
          p_body_text: string
          p_cc_institution_id: string
          p_includes_contact: boolean
          p_institution_id: string
          p_kind: Database["public"]["Enums"]["letter_kind"]
          p_report_id: string
          p_rule_id: string
          p_subject: string
        }
        Returns: {
          cc_email: string
          dispatch_id: string
          letter_id: string
          to_email: string
        }[]
      }
      support_existing_report: {
        Args: { p_draft_id: string; p_report_id: string }
        Returns: {
          like_count: number
          removed_paths: string[]
        }[]
      }
      update_draft: {
        Args: {
          p_address: string
          p_address_source: string
          p_category: Database["public"]["Enums"]["report_category"]
          p_lat: number
          p_lng: number
          p_report_id: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      agent_run_outcome: "ok" | "fallback" | "error"
      agent_step: "classify" | "jurisdiction" | "duplicates" | "letter" | "send"
      analysis_status: "pending" | "done" | "failed" | "timed_out"
      category_source: "ai" | "citizen"
      dispatch_status: "pending" | "succeeded" | "failed"
      event_actor: "reporter" | "institution" | "fixit"
      jurisdiction_outcome: "matched" | "no_rule" | "no_email"
      letter_kind: "initial" | "assignment" | "redirect"
      moderation_action:
        | "hide_report"
        | "unhide_report"
        | "hide_photo"
        | "unhide_photo"
      report_category:
        | "pothole"
        | "sidewalk"
        | "traffic_sign"
        | "street_light"
        | "traffic_light"
        | "manhole"
        | "water_leak"
        | "illegal_dump"
        | "waste_container"
        | "greenery"
        | "graffiti"
        | "other"
      report_event_kind:
        | "submitted"
        | "routed"
        | "assigned"
        | "acknowledged"
        | "status_changed"
        | "not_competent"
        | "redirected"
        | "reopened"
      report_severity: "low" | "medium" | "high"
      report_status:
        | "draft"
        | "routing"
        | "sent"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "not_competent"
        | "rejected"
      routing_reason: "no_rule" | "no_email"
      source_type:
        | "official_document"
        | "official_page"
        | "written_confirmation"
        | "phone_confirmation"
      user_role: "citizen" | "official" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      agent_run_outcome: ["ok", "fallback", "error"],
      agent_step: ["classify", "jurisdiction", "duplicates", "letter", "send"],
      analysis_status: ["pending", "done", "failed", "timed_out"],
      category_source: ["ai", "citizen"],
      dispatch_status: ["pending", "succeeded", "failed"],
      event_actor: ["reporter", "institution", "fixit"],
      jurisdiction_outcome: ["matched", "no_rule", "no_email"],
      letter_kind: ["initial", "assignment", "redirect"],
      moderation_action: [
        "hide_report",
        "unhide_report",
        "hide_photo",
        "unhide_photo",
      ],
      report_category: [
        "pothole",
        "sidewalk",
        "traffic_sign",
        "street_light",
        "traffic_light",
        "manhole",
        "water_leak",
        "illegal_dump",
        "waste_container",
        "greenery",
        "graffiti",
        "other",
      ],
      report_event_kind: [
        "submitted",
        "routed",
        "assigned",
        "acknowledged",
        "status_changed",
        "not_competent",
        "redirected",
        "reopened",
      ],
      report_severity: ["low", "medium", "high"],
      report_status: [
        "draft",
        "routing",
        "sent",
        "acknowledged",
        "in_progress",
        "resolved",
        "not_competent",
        "rejected",
      ],
      routing_reason: ["no_rule", "no_email"],
      source_type: [
        "official_document",
        "official_page",
        "written_confirmation",
        "phone_confirmation",
      ],
      user_role: ["citizen", "official", "admin"],
    },
  },
} as const
