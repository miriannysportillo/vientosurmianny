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
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          last_message_id: string | null
          is_group: boolean
          name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message_id?: string | null
          is_group?: boolean
          name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message_id?: string | null
          is_group?: boolean
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_last_message_id_fkey"
            columns: ["last_message_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
          created_at: string
          last_read_message_id: string | null
        }
        Insert: {
          conversation_id: string
          user_id: string
          created_at?: string
          last_read_message_id?: string | null
        }
        Update: {
          conversation_id?: string
          user_id?: string
          created_at?: string
          last_read_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          media_url: string | null
          read_by: string[]
          type: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          media_url?: string | null
          read_by?: string[]
          type?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          media_url?: string | null
          read_by?: string[]
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string
          full_name: string
          avatar_url: string | null
          last_online: string | null
        }
        Insert: {
          id: string
          created_at?: string
          username: string
          full_name: string
          avatar_url?: string | null
          last_online?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          last_online?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
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
  }
}