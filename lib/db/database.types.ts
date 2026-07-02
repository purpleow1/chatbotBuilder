export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type WorkspaceRole = "owner" | "admin" | "member";
export type MembershipStatus = "active" | "invited" | "disabled";
export type BotStatus = "draft" | "ready" | "disabled";
export type DocumentStatus = "queued" | "processing" | "ready" | "failed";
export type ConversationChannel = "app" | "widget";
export type ConversationStatus = "open" | "closed";
export type MessageRole = "system" | "user" | "assistant" | "tool";
export type SubscriptionPlan = "free" | "pro" | "business";
export type SubscriptionStatus = "mock_active" | "trialing" | "active" | "past_due" | "canceled";
export type UsageEventType =
  | "message_sent"
  | "assistant_response"
  | "document_uploaded"
  | "document_ingested"
  | "embedding_generated"
  | "widget_loaded";

export type MessagePart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "file";
      url: string;
      filename: string;
      mediaType: string;
    };

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          status: MembershipStatus;
          joined_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          status?: MembershipStatus;
          joined_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
          status?: MembershipStatus;
          joined_at?: string;
        };
        Relationships: [];
      };
      bots: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string | null;
          name: string;
          description: string | null;
          purpose: string | null;
          support_tone: string | null;
          fallback_message: string | null;
          public_widget_enabled: boolean;
          status: BotStatus;
          widget_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by?: string | null;
          name: string;
          description?: string | null;
          purpose?: string | null;
          support_tone?: string | null;
          fallback_message?: string | null;
          public_widget_enabled?: boolean;
          status?: BotStatus;
          widget_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string | null;
          name?: string;
          description?: string | null;
          purpose?: string | null;
          support_tone?: string | null;
          fallback_message?: string | null;
          public_widget_enabled?: boolean;
          status?: BotStatus;
          widget_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          bot_id: string;
          uploaded_by: string | null;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number;
          status: DocumentStatus;
          error_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          bot_id: string;
          uploaded_by?: string | null;
          file_name: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number;
          status?: DocumentStatus;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          bot_id?: string;
          uploaded_by?: string | null;
          file_name?: string;
          storage_path?: string;
          mime_type?: string | null;
          size_bytes?: number;
          status?: DocumentStatus;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          id: string;
          workspace_id: string;
          bot_id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          token_count: number | null;
          page_number: number | null;
          embedding: string;
          embedding_model: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          bot_id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          token_count?: number | null;
          page_number?: number | null;
          embedding: string;
          embedding_model?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          bot_id?: string;
          document_id?: string;
          chunk_index?: number;
          content?: string;
          token_count?: number | null;
          page_number?: number | null;
          embedding?: string;
          embedding_model?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          workspace_id: string;
          bot_id: string;
          started_by: string | null;
          visitor_id: string | null;
          channel: ConversationChannel;
          status: ConversationStatus;
          title: string | null;
          created_at: string;
          updated_at: string;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          bot_id: string;
          started_by?: string | null;
          visitor_id?: string | null;
          channel?: ConversationChannel;
          status?: ConversationStatus;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          bot_id?: string;
          started_by?: string | null;
          visitor_id?: string | null;
          channel?: ConversationChannel;
          status?: ConversationStatus;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          workspace_id: string;
          bot_id: string;
          conversation_id: string;
          role: MessageRole;
          parts: Json;
          content_text: string;
          citations: Json;
          metadata: Json;
          input_tokens: number | null;
          output_tokens: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          bot_id: string;
          conversation_id: string;
          role: MessageRole;
          parts?: Json;
          content_text?: string;
          citations?: Json;
          metadata?: Json;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          bot_id?: string;
          conversation_id?: string;
          role?: MessageRole;
          parts?: Json;
          content_text?: string;
          citations?: Json;
          metadata?: Json;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          workspace_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          billing_provider: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          bot_limit: number;
          document_limit: number;
          monthly_message_limit: number;
          current_period_start: string;
          current_period_end: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          billing_provider?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          bot_limit?: number;
          document_limit?: number;
          monthly_message_limit?: number;
          current_period_start?: string;
          current_period_end?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          billing_provider?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          bot_limit?: number;
          document_limit?: number;
          monthly_message_limit?: number;
          current_period_start?: string;
          current_period_end?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_events: {
        Row: {
          id: string;
          workspace_id: string;
          bot_id: string | null;
          conversation_id: string | null;
          message_id: string | null;
          event_type: UsageEventType;
          quantity: number;
          metadata: Json;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          bot_id?: string | null;
          conversation_id?: string | null;
          message_id?: string | null;
          event_type: UsageEventType;
          quantity?: number;
          metadata?: Json;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          bot_id?: string | null;
          conversation_id?: string | null;
          message_id?: string | null;
          event_type?: UsageEventType;
          quantity?: number;
          metadata?: Json;
          occurred_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_document_chunks: {
        Args: {
          target_workspace_id: string;
          target_bot_id: string;
          query_embedding: string;
          match_count?: number;
          similarity_threshold?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          page_number: number | null;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      membership_status: MembershipStatus;
      bot_status: BotStatus;
      document_status: DocumentStatus;
      conversation_channel: ConversationChannel;
      conversation_status: ConversationStatus;
      message_role: MessageRole;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
      usage_event_type: UsageEventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
