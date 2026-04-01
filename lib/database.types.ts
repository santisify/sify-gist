// lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          password_hash: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          password_hash: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password_hash?: string
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      gists: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          description: string | null
          visibility: string
          forked_from: string | null
          stars_count: number
          forks_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id?: string | null
          title?: string | null
          description?: string | null
          visibility?: string
          forked_from?: string | null
          stars_count?: number
          forks_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          description?: string | null
          visibility?: string
          forked_from?: string | null
          stars_count?: number
          forks_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gist_files: {
        Row: {
          id: number
          gist_id: string
          filename: string
          content: string
          language: string
        }
        Insert: {
          id?: number
          gist_id: string
          filename: string
          content: string
          language?: string
        }
        Update: {
          id?: number
          gist_id?: string
          filename?: string
          content?: string
          language?: string
        }
        Relationships: [
          {
            foreignKeyName: "gist_files_gist_id_fkey"
            columns: ["gist_id"]
            isOneToOne: false
            referencedRelation: "gists"
            referencedColumns: ["id"]
          }
        ]
      }
      gist_versions: {
        Row: {
          id: number
          gist_id: string
          version_number: number
          created_at: string
        }
        Insert: {
          id?: number
          gist_id: string
          version_number: number
          created_at?: string
        }
        Update: {
          id?: number
          gist_id?: string
          version_number?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gist_versions_gist_id_fkey"
            columns: ["gist_id"]
            isOneToOne: false
            referencedRelation: "gists"
            referencedColumns: ["id"]
          }
        ]
      }
      gist_file_versions: {
        Row: {
          id: number
          gist_version_id: number
          filename: string
          content: string
          language: string
        }
        Insert: {
          id?: number
          gist_version_id: number
          filename: string
          content: string
          language?: string
        }
        Update: {
          id?: number
          gist_version_id?: number
          filename?: string
          content?: string
          language?: string
        }
        Relationships: [
          {
            foreignKeyName: "gist_file_versions_gist_version_id_fkey"
            columns: ["gist_version_id"]
            isOneToOne: false
            referencedRelation: "gist_versions"
            referencedColumns: ["id"]
          }
        ]
      }
      gist_stars: {
        Row: {
          id: number
          user_id: string
          gist_id: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          gist_id: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          gist_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gist_stars_gist_id_fkey"
            columns: ["gist_id"]
            isOneToOne: false
            referencedRelation: "gists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gist_stars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gist_topics: {
        Row: {
          id: number
          gist_id: string
          topic: string
          created_at: string
        }
        Insert: {
          id?: number
          gist_id: string
          topic: string
          created_at?: string
        }
        Update: {
          id?: number
          gist_id?: string
          topic?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gist_topics_gist_id_fkey"
            columns: ["gist_id"]
            isOneToOne: false
            referencedRelation: "gists"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}