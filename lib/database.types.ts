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
          username_normalized: string
          email: string
          password_hash: string | null
          avatar_url: string | null
          github_id: string | null
          gitlab_id: string | null
          gitea_id: string | null
          oidc_id: string | null
          md5_hash: string | null
          style_preferences: Json | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          username_normalized: string
          email: string
          password_hash?: string | null
          avatar_url?: string | null
          github_id?: string | null
          gitlab_id?: string | null
          gitea_id?: string | null
          oidc_id?: string | null
          md5_hash?: string | null
          style_preferences?: Json | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          username_normalized?: string
          email?: string
          password_hash?: string | null
          avatar_url?: string | null
          github_id?: string | null
          gitlab_id?: string | null
          gitea_id?: string | null
          oidc_id?: string | null
          md5_hash?: string | null
          style_preferences?: Json | null
          is_admin?: boolean
          created_at?: string
        }
        Relationships: []
      }
      gists: {
        Row: {
          id: string
          uuid: string
          user_id: string | null
          title: string | null
          description: string | null
          url: string | null
          url_normalized: string | null
          preview: string | null
          preview_filename: string | null
          preview_mime_type: string | null
          visibility: number
          forked_id: string | null
          nb_files: number
          nb_likes: number
          nb_forks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          uuid: string
          user_id?: string | null
          title?: string | null
          description?: string | null
          url?: string | null
          url_normalized?: string | null
          preview?: string | null
          preview_filename?: string | null
          preview_mime_type?: string | null
          visibility?: number
          forked_id?: string | null
          nb_files?: number
          nb_likes?: number
          nb_forks?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uuid?: string
          user_id?: string | null
          title?: string | null
          description?: string | null
          url?: string | null
          url_normalized?: string | null
          preview?: string | null
          preview_filename?: string | null
          preview_mime_type?: string | null
          visibility?: number
          forked_id?: string | null
          nb_files?: number
          nb_likes?: number
          nb_forks?: number
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
          },
          {
            foreignKeyName: "gists_forked_id_fkey"
            columns: ["forked_id"]
            isOneToOne: false
            referencedRelation: "gists"
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
      likes: {
        Row: {
          user_id: string
          gist_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          gist_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          gist_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_gist_id_fkey"
            columns: ["gist_id"]
            isOneToOne: false
            referencedRelation: "gists"
            referencedColumns: ["id"]
          }
        ]
      }
      gist_topics: {
        Row: {
          gist_id: string
          topic: string
        }
        Insert: {
          gist_id: string
          topic: string
        }
        Update: {
          gist_id?: string
          topic?: string
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
      gist_languages: {
        Row: {
          gist_id: string
          language: string
        }
        Insert: {
          gist_id: string
          language: string
        }
        Update: {
          gist_id?: string
          language?: string
        }
        Relationships: [
          {
            foreignKeyName: "gist_languages_gist_id_fkey"
            columns: ["gist_id"]
            isOneToOne: false
            referencedRelation: "gists"
            referencedColumns: ["id"]
          }
        ]
      }
      access_tokens: {
        Row: {
          id: number
          name: string
          token_hash: string
          user_id: string
          scope_gist: number
          created_at: string
          expires_at: string | null
          last_used_at: string | null
        }
        Insert: {
          id?: number
          name: string
          token_hash: string
          user_id: string
          scope_gist?: number
          created_at?: string
          expires_at?: string | null
          last_used_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          token_hash?: string
          user_id?: string
          scope_gist?: number
          created_at?: string
          expires_at?: string | null
          last_used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ssh_keys: {
        Row: {
          id: number
          title: string
          content: string
          sha: string
          user_id: string
          created_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: number
          title: string
          content: string
          sha: string
          user_id: string
          created_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          content?: string
          sha?: string
          user_id?: string
          created_at?: string
          last_used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ssh_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: number
          code: string
          expires_at: string | null
          nb_used: number
          nb_max: number
        }
        Insert: {
          id?: number
          code: string
          expires_at?: string | null
          nb_used?: number
          nb_max?: number
        }
        Update: {
          id?: number
          code?: string
          expires_at?: string | null
          nb_used?: number
          nb_max?: number
        }
        Relationships: []
      }
      gist_init_queue: {
        Row: {
          id: number
          gist_id: string
          created_at: string
        }
        Insert: {
          id?: number
          gist_id: string
          created_at?: string
        }
        Update: {
          id?: number
          gist_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gist_init_queue_gist_id_fkey"
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
