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

export type UserRole =
  | "super_admin"
  | "org_admin"
  | "manager"
  | "staff"
  | "vendor"
  | "support_technician";

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

export type PoolType = "chlorine" | "saltwater" | "bromine";

export type PoolStatus = "active" | "seasonal" | "inactive";

export type EquipmentKind = "pump" | "heater" | "filter" | "timer" | "other";

export type TargetRangeBand = { min: number; max: number; ideal?: number };

export type PoolTargetRanges = Record<string, TargetRangeBand>;

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
          website_url: string | null;
          address: Json;
          request_type: "founder_account" | "demo";
          requested_plan_code: PlanCode | null;
          org_id: string | null;
          user_id: string | null;
          notified_at: string | null;
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
          website_url?: string | null;
          address?: Json;
          request_type?: "founder_account" | "demo";
          requested_plan_code?: PlanCode | null;
          org_id?: string | null;
          user_id?: string | null;
          notified_at?: string | null;
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
          website_url?: string | null;
          address?: Json;
          request_type?: "founder_account" | "demo";
          requested_plan_code?: PlanCode | null;
          org_id?: string | null;
          user_id?: string | null;
          notified_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pools: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          pool_type: PoolType;
          volume_gallons: number | null;
          location_label: string | null;
          notes: string | null;
          status: PoolStatus;
          target_ranges: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          pool_type?: PoolType;
          volume_gallons?: number | null;
          location_label?: string | null;
          notes?: string | null;
          status?: PoolStatus;
          target_ranges?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          pool_type?: PoolType;
          volume_gallons?: number | null;
          location_label?: string | null;
          notes?: string | null;
          status?: PoolStatus;
          target_ranges?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pool_equipment: {
        Row: {
          id: string;
          org_id: string;
          pool_id: string;
          kind: EquipmentKind;
          model: string | null;
          installed_on: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          pool_id: string;
          kind?: EquipmentKind;
          model?: string | null;
          installed_on?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          pool_id?: string;
          kind?: EquipmentKind;
          model?: string | null;
          installed_on?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cleaning_logs: {
        Row: {
          id: string;
          org_id: string;
          pool_id: string;
          cleaned_at: string;
          brush: boolean;
          net: boolean;
          vacuum: boolean;
          skimmer_basket: boolean;
          pump_basket: boolean;
          pump_filter: boolean;
          deck: boolean;
          notes: string | null;
          logged_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          pool_id: string;
          cleaned_at?: string;
          brush?: boolean;
          net?: boolean;
          vacuum?: boolean;
          skimmer_basket?: boolean;
          pump_basket?: boolean;
          pump_filter?: boolean;
          deck?: boolean;
          notes?: string | null;
          logged_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          pool_id?: string;
          cleaned_at?: string;
          brush?: boolean;
          net?: boolean;
          vacuum?: boolean;
          skimmer_basket?: boolean;
          pump_basket?: boolean;
          pump_filter?: boolean;
          deck?: boolean;
          notes?: string | null;
          logged_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      inspection_logs: {
        Row: {
          id: string;
          org_id: string;
          pool_id: string;
          inspected_at: string;
          template_key: string;
          checklist: Json;
          passed: boolean | null;
          notes: string | null;
          operator_initials: string | null;
          logged_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          pool_id: string;
          inspected_at?: string;
          template_key: string;
          checklist?: Json;
          passed?: boolean | null;
          notes?: string | null;
          operator_initials?: string | null;
          logged_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          pool_id?: string;
          inspected_at?: string;
          template_key?: string;
          checklist?: Json;
          passed?: boolean | null;
          notes?: string | null;
          operator_initials?: string | null;
          logged_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chemical_logs: {
        Row: {
          id: string;
          org_id: string;
          pool_id: string | null;
          pool_label: string | null;
          ph: number | null;
          free_chlorine: number | null;
          total_chlorine: number | null;
          alkalinity: number | null;
          temp_f: number | null;
          calcium_hardness: number | null;
          tds_ppm: number | null;
          cyanuric_acid_ppm: number | null;
          filter_psi: number | null;
          flow_gpm: number | null;
          notes: string | null;
          operator_initials: string | null;
          langelier_saturation_index: number | null;
          logged_by: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          pool_id?: string | null;
          pool_label?: string | null;
          ph?: number | null;
          free_chlorine?: number | null;
          total_chlorine?: number | null;
          alkalinity?: number | null;
          temp_f?: number | null;
          calcium_hardness?: number | null;
          tds_ppm?: number | null;
          cyanuric_acid_ppm?: number | null;
          filter_psi?: number | null;
          flow_gpm?: number | null;
          notes?: string | null;
          operator_initials?: string | null;
          langelier_saturation_index?: number | null;
          logged_by?: string | null;
          logged_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          pool_id?: string | null;
          pool_label?: string | null;
          ph?: number | null;
          free_chlorine?: number | null;
          total_chlorine?: number | null;
          alkalinity?: number | null;
          temp_f?: number | null;
          calcium_hardness?: number | null;
          tds_ppm?: number | null;
          cyanuric_acid_ppm?: number | null;
          filter_psi?: number | null;
          flow_gpm?: number | null;
          notes?: string | null;
          operator_initials?: string | null;
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
          vendor_id: string | null;
          role: UserRole;
          app_role_id: string | null;
          support_provider_id: string | null;
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
          vendor_id?: string | null;
          role?: UserRole;
          app_role_id?: string | null;
          support_provider_id?: string | null;
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
          vendor_id?: string | null;
          role?: UserRole;
          app_role_id?: string | null;
          support_provider_id?: string | null;
          email?: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      support_providers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          contact_name: string | null;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state_code: string;
          postal_code: string;
          country: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          contact_name?: string | null;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state_code: string;
          postal_code: string;
          country?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          contact_name?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state_code?: string;
          postal_code?: string;
          country?: string;
          is_active?: boolean;
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
          website_url: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tier?: OrgTier | null;
          address?: Json;
          plan_code?: PlanCode;
          founder?: boolean;
          website_url?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: OrgTier | null;
          address?: Json;
          plan_code?: PlanCode;
          founder?: boolean;
          website_url?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      org_invitations: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          app_role_id: string | null;
          token: string;
          status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
          invited_by: string | null;
          invited_user_id: string | null;
          message: string | null;
          created_at: string;
          responded_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          app_role_id?: string | null;
          token: string;
          status?: "pending" | "accepted" | "declined" | "cancelled" | "expired";
          invited_by?: string | null;
          invited_user_id?: string | null;
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
          expires_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          app_role_id?: string | null;
          token?: string;
          status?: "pending" | "accepted" | "declined" | "cancelled" | "expired";
          invited_by?: string | null;
          invited_user_id?: string | null;
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
          expires_at?: string;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
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
          pool_id: string | null;
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
          pool_id?: string | null;
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
          pool_id?: string | null;
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
          org_id: string | null;
          subject: string;
          body: string | null;
          status: TicketStatus;
          priority: TaskPriority;
          assigned_to: string | null;
          assigned_support_provider_id: string | null;
          accepted_at: string | null;
          created_by: string | null;
          source: string;
          requester_company_name: string | null;
          contact_name: string | null;
          phone: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state_code: string | null;
          postal_code: string | null;
          country: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          subject: string;
          body?: string | null;
          status?: TicketStatus;
          priority?: TaskPriority;
          assigned_to?: string | null;
          assigned_support_provider_id?: string | null;
          accepted_at?: string | null;
          created_by?: string | null;
          source?: string;
          requester_company_name?: string | null;
          contact_name?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state_code?: string | null;
          postal_code?: string | null;
          country?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          subject?: string;
          body?: string | null;
          status?: TicketStatus;
          priority?: TaskPriority;
          assigned_to?: string | null;
          assigned_support_provider_id?: string | null;
          accepted_at?: string | null;
          created_by?: string | null;
          source?: string;
          requester_company_name?: string | null;
          contact_name?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state_code?: string | null;
          postal_code?: string | null;
          country?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          org_id: string;
          plan_code: PlanCode;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          plan_code: PlanCode;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          plan_code?: PlanCode;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vendor_applications: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          website_url: string | null;
          category: string | null;
          message: string;
          status: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          vendor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name?: string;
          email: string;
          phone?: string | null;
          website_url?: string | null;
          category?: string | null;
          message?: string;
          status?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          vendor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          website_url?: string | null;
          category?: string | null;
          message?: string;
          status?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          vendor_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vendor_products: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          description: string;
          image_url: string | null;
          product_url: string | null;
          sort_order: number;
          is_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          name: string;
          description?: string;
          image_url?: string | null;
          product_url?: string | null;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          name?: string;
          description?: string;
          image_url?: string | null;
          product_url?: string | null;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      vendor_product_inquiries: {
        Row: {
          id: string;
          vendor_id: string;
          product_id: string;
          from_user_id: string | null;
          from_name: string;
          from_email: string;
          from_org_name: string | null;
          message: string;
          status: "open" | "read" | "resolved";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          product_id: string;
          from_user_id?: string | null;
          from_name: string;
          from_email: string;
          from_org_name?: string | null;
          message: string;
          status?: "open" | "read" | "resolved";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          product_id?: string;
          from_user_id?: string | null;
          from_name?: string;
          from_email?: string;
          from_org_name?: string | null;
          message?: string;
          status?: "open" | "read" | "resolved";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          category: string;
          is_published: boolean;
          sort_order: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string;
          category?: string;
          is_published?: boolean;
          sort_order?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          category?: string;
          is_published?: boolean;
          sort_order?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_course_videos: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          video_url: string | null;
          storage_path: string | null;
          duration_seconds: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          video_url?: string | null;
          storage_path?: string | null;
          duration_seconds?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          video_url?: string | null;
          storage_path?: string | null;
          duration_seconds?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      ad_placements: {
        Row: {
          id: string;
          slot_key: string;
          title: string;
          image_url: string | null;
          target_url: string | null;
          is_active: boolean;
          sort_order: number;
          starts_at: string;
          ends_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slot_key: string;
          title?: string;
          image_url?: string | null;
          target_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          starts_at?: string;
          ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slot_key?: string;
          title?: string;
          image_url?: string | null;
          target_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          starts_at?: string;
          ends_at?: string | null;
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
          moderation_status: string;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_note: string | null;
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
      community_job_posts: {
        Row: {
          id: string;
          org_id: string | null;
          author_id: string;
          title: string;
          company_name: string;
          location: string;
          employment_type: string;
          description: string;
          apply_url: string | null;
          contact_email: string | null;
          status: string;
          is_promoted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          author_id: string;
          title: string;
          company_name?: string;
          location?: string;
          employment_type?: string;
          description?: string;
          apply_url?: string | null;
          contact_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          author_id?: string;
          title?: string;
          company_name?: string;
          location?: string;
          employment_type?: string;
          description?: string;
          apply_url?: string | null;
          contact_email?: string | null;
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
          moderation_status: string;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_note: string | null;
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
          slug: string | null;
          logo_url: string | null;
          tagline: string | null;
          website_url: string | null;
          is_partner: boolean;
          description: string;
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
