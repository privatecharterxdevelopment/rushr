// TypeScript types for Supabase database schema
// This file contains the database types for the messaging system

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          homeowner_id: string
          pro_id: string
          title: string
          job_id: string | null
          status: 'active' | 'archived' | 'closed' | 'deleted'
          last_message_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          homeowner_id: string
          pro_id: string
          title: string
          job_id?: string | null
          status?: 'active' | 'archived' | 'closed'
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          homeowner_id?: string
          pro_id?: string
          title?: string
          job_id?: string | null
          status?: 'active' | 'archived' | 'closed'
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          message_type: 'text' | 'offer' | 'system' | 'file'
          content: string | null
          metadata: Record<string, any> | null
          reply_to_id: string | null
          read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          message_type?: 'text' | 'offer' | 'system' | 'file'
          content?: string | null
          metadata?: Record<string, any> | null
          reply_to_id?: string | null
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          message_type?: 'text' | 'offer' | 'system' | 'file'
          content?: string | null
          metadata?: Record<string, any> | null
          reply_to_id?: string | null
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number | null
          created_at?: string
        }
      }
      message_offers: {
        Row: {
          id: string
          message_id: string
          title: string
          price: number
          delivery_days: number
          notes: string | null
          status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired'
          counter_price: number | null
          counter_days: number | null
          counter_notes: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          message_id: string
          title: string
          price: number
          delivery_days: number
          notes?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired'
          counter_price?: number | null
          counter_days?: number | null
          counter_notes?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          title?: string
          price?: number
          delivery_days?: number
          notes?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired'
          counter_price?: number | null
          counter_days?: number | null
          counter_notes?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          last_read_message_id: string | null
          last_read_at: string
          is_typing: boolean
          typing_updated_at: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          last_read_message_id?: string | null
          last_read_at?: string
          is_typing?: boolean
          typing_updated_at?: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          last_read_message_id?: string | null
          last_read_at?: string
          is_typing?: boolean
          typing_updated_at?: string
          joined_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'homeowner' | 'contractor'
          subscription_type: 'free' | 'pro' | 'signals'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'homeowner' | 'contractor'
          subscription_type?: 'free' | 'pro' | 'signals'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'homeowner' | 'contractor'
          subscription_type?: 'free' | 'pro' | 'signals'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      conversation_details: {
        Row: {
          id: string
          homeowner_id: string
          pro_id: string
          title: string
          job_id: string | null
          status: 'active' | 'archived' | 'closed' | 'deleted'
          last_message_at: string
          created_at: string
          updated_at: string
          homeowner_name: string | null
          homeowner_email: string | null
          pro_name: string | null
          pro_email: string | null
          message_count: number | null
          unread_count: number | null
        }
      }
      user_conversations: {
        Row: {
          id: string
          homeowner_id: string
          pro_id: string
          title: string
          job_id: string | null
          status: 'active' | 'archived' | 'closed' | 'deleted'
          last_message_at: string
          created_at: string
          updated_at: string
          homeowner_name: string | null
          homeowner_email: string | null
          pro_name: string | null
          pro_email: string | null
          total_messages: number | null
          unread_messages: number | null
          last_message_content: string | null
        }
      }
    }
    Functions: {
      create_sample_messaging_data: {
        Args: {
          homeowner_user_id: string
          pro_user_id: string
        }
        Returns: void
      }
      get_conversation_with_messages: {
        Args: {
          conversation_id_param: string
        }
        Returns: {
          conversation_data: any
          messages_data: any
        }[]
      }
      start_conversation: {
        Args: {
          other_user_id: string
          conversation_title: string
          initial_message: string
          job_id_param?: string
        }
        Returns: string
      }
      soft_delete_message: {
        Args: {
          message_id_param: string
        }
        Returns: boolean
      }
      delete_conversation_for_user: {
        Args: {
          conversation_id_param: string
        }
        Returns: boolean
      }
      archive_conversation_for_user: {
        Args: {
          conversation_id_param: string
        }
        Returns: boolean
      }
      can_delete_message: {
        Args: {
          message_id_param: string
          user_id_param?: string
          time_limit_hours?: number
        }
        Returns: boolean
      }
      cleanup_deleted_messages: {
        Args: {
          days_old?: number
        }
        Returns: number
      }
      cleanup_deleted_conversations: {
        Args: {
          days_old?: number
        }
        Returns: number
      }
    }
  }
}