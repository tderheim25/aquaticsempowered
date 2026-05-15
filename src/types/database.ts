/**
 * Hand-maintained subset of Supabase Database types for MVP.
 * Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <SUPABASE_PROJECT_ID> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrgTier =
  | "rural"
  | "municipal"
  | "hotel"
  | "school"
  | "hospital"
  | "hoa"
  | "splash_pad"
  | "wellness"
  | "commercial"
  | "therapy";

export type UserRole = "super_admin" | "org_admin" | "manager" | "staff" | "vendor";

export type PlanCode = "free" | "essential" | "pro" | "enterprise";

export type TaskStatus = "open" | "in_progress" | "done" | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskCategory =
  | "chemical"
  | "equipment"
  | "facility"
  | "safety"
  | "cleaning"
  | "inspection"
  | "other";

export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export type ProcurementRequestStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "quoted"
  | "approved"
  | "ordered"
  | "cancelled";

export type ProcurementRequestCategory = "chemicals" | "equipment" | "parts" | "services" | "other";

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          facility_name: string;
          facility_tier: OrgTier;
          contact_name: string;
          email: string;
          phone: string | null;
          num_pools: number | null;
          current_pain: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          facility_name: string;
          facility_tier: OrgTier;
          contact_name: string;
          email: string;
          phone?: string | null;
          num_pools?: number | null;
          current_pain?: string | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          facility_name?: string;
          facility_tier?: OrgTier;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          num_pools?: number | null;
          current_pain?: string | null;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      chemical_logs: {
        Row: {
          id: string;
          org_id: string;
          pool_label: string | null;
          ph: number | null;
          free_chlorine: number | null;
          total_chlorine: number | null;
          alkalinity: number | null;
          temp_f: number | null;
          calcium_hardness: number | null;
          tds_ppm: number | null;
          langelier_saturation_index: number | null;
          logged_by: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          pool_label?: string | null;
          ph?: number | null;
          free_chlorine?: number | null;
          total_chlorine?: number | null;
          alkalinity?: number | null;
          temp_f?: number | null;
          calcium_hardness?: number | null;
          tds_ppm?: number | null;
          langelier_saturation_index?: number | null;
          logged_by?: string | null;
          logged_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          pool_label?: string | null;
          ph?: number | null;
          free_chlorine?: number | null;
          total_chlorine?: number | null;
          alkalinity?: number | null;
          temp_f?: number | null;
          calcium_hardness?: number | null;
          tds_ppm?: number | null;
          langelier_saturation_index?: number | null;
          logged_by?: string | null;
          logged_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          org_id: string | null;
          role: UserRole;
          app_role_id: string | null;
          email: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_path: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          role?: UserRole;
          app_role_id?: string | null;
          email: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          role?: UserRole;
          app_role_id?: string | null;
          email?: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      app_roles: {
        Row: {
          id: string;
          slug: string;
          label: string;
          permissions_base: UserRole;
          is_builtin: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label: string;
          permissions_base?: UserRole;
          is_builtin?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          label?: string;
          permissions_base?: UserRole;
          is_builtin?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      app_role_view_permissions: {
        Row: {
          role_id: string;
          view_key: string;
          can_view: boolean;
          updated_at: string;
        };
        Insert: {
          role_id: string;
          view_key: string;
          can_view?: boolean;
          updated_at?: string;
        };
        Update: {
          role_id?: string;
          view_key?: string;
          can_view?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          tier: OrgTier | null;
          address: Json;
          plan_code: PlanCode;
          founder: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tier?: OrgTier | null;
          address?: Json;
          plan_code?: PlanCode;
          founder?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: OrgTier | null;
          address?: Json;
          plan_code?: PlanCode;
          founder?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      maintenance_tasks: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          category: TaskCategory;
          pool_label: string | null;
          assigned_to: string | null;
          created_by: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          category?: TaskCategory;
          pool_label?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          category?: TaskCategory;
          pool_label?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          org_id: string;
          subject: string;
          body: string | null;
          status: TicketStatus;
          priority: TaskPriority;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          subject: string;
          body?: string | null;
          status?: TicketStatus;
          priority?: TaskPriority;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          subject?: string;
          body?: string | null;
          status?: TicketStatus;
          priority?: TaskPriority;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      community_profiles: {
        Row: {
          user_id: string;
          bio: string;
          updated_at: string;
          last_connections_activity_seen_at: string | null;
        };
        Insert: {
          user_id: string;
          bio?: string;
          updated_at?: string;
          last_connections_activity_seen_at?: string | null;
        };
        Update: {
          user_id?: string;
          bio?: string;
          updated_at?: string;
          last_connections_activity_seen_at?: string | null;
        };
        Relationships: [];
      };
      community_posts: {
        Row: {
          id: string;
          org_id: string | null;
          author_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          author_id: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          author_id?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_post_media: {
        Row: {
          id: string;
          post_id: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          storage_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      community_post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      community_likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      community_follows: {
        Row: {
          follower_id: string;
          followee_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          followee_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          followee_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      community_network_requests: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: string;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: string;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: string;
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      community_network_edges: {
        Row: {
          user_a: string;
          user_b: string;
          created_at: string;
        };
        Insert: {
          user_a: string;
          user_b: string;
          created_at?: string;
        };
        Update: {
          user_a?: string;
          user_b?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      community_direct_messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      community_dm_read_cursors: {
        Row: {
          user_id: string;
          peer_id: string;
          last_read_at: string;
        };
        Insert: {
          user_id: string;
          peer_id: string;
          last_read_at?: string;
        };
        Update: {
          user_id?: string;
          peer_id?: string;
          last_read_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          name: string;
          tier: string | null;
          category: string | null;
          region: string | null;
          certified_at: string | null;
          contact: Json | null;
          listing_visible: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          tier?: string | null;
          category?: string | null;
          region?: string | null;
          certified_at?: string | null;
          contact?: Json | null;
          listing_visible?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: string | null;
          category?: string | null;
          region?: string | null;
          certified_at?: string | null;
          contact?: Json | null;
          listing_visible?: boolean;
        };
        Relationships: [];
      };
      procurement_requests: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          description: string | null;
          category: ProcurementRequestCategory;
          status: ProcurementRequestStatus;
          preferred_vendor_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          description?: string | null;
          category?: ProcurementRequestCategory;
          status?: ProcurementRequestStatus;
          preferred_vendor_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          description?: string | null;
          category?: ProcurementRequestCategory;
          status?: ProcurementRequestStatus;
          preferred_vendor_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          code: PlanCode;
          name: string;
          monthly_cents: number;
          annual_cents: number;
          features: Json;
          sort_order: number;
        };
        Insert: {
          code: PlanCode;
          name: string;
          monthly_cents?: number;
          annual_cents?: number;
          features?: Json;
          sort_order?: number;
        };
        Update: {
          code?: PlanCode;
          name?: string;
          monthly_cents?: number;
          annual_cents?: number;
          features?: Json;
          sort_order?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_org_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      current_role: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
    };
    Enums: {
      org_tier: OrgTier;
      user_role: UserRole;
      plan_code: PlanCode;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      task_category: TaskCategory;
      ticket_status: TicketStatus;
      procurement_request_status: ProcurementRequestStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
