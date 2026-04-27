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
      users: {
        Row: {
          id: string;
          org_id: string | null;
          role: UserRole;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          role?: UserRole;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          role?: UserRole;
          email?: string;
          full_name?: string | null;
          created_at?: string;
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
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
