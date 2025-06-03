// Copiado desde mensajeria-main/src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          last_message_id: string | null;
          is_group: boolean;
          name: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_message_id?: string | null;
          is_group?: boolean;
          name?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_message_id?: string | null;
          is_group?: boolean;
          name?: string | null;
        };
        Relationships: any[];
      };
      // ...otros tipos de tablas relevantes...
    };
  };
}
