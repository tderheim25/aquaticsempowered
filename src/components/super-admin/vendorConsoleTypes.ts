export type VendorApplicationRow = {
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
  vendor_id: string | null;
  created_at: string;
};

export type VendorContact = {
  email?: string;
  phone?: string;
  name?: string;
};

export type VendorListRow = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  website_url: string | null;
  tagline: string | null;
  logo_url: string | null;
  description: string | null;
  contact: VendorContact | null;
  region: string | null;
  listing_visible: boolean;
  is_partner: boolean;
};

export type VendorProductRow = {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  image_url: string | null;
  product_url: string | null;
  is_visible: boolean;
  created_at: string;
};
