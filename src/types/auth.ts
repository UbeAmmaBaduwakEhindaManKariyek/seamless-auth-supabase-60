
import { Database } from "@/integrations/supabase/types";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserCredentials extends LoginCredentials {
  email: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface AuthUser {
  id?: string;
  username: string;
  email: string;
  is_admin?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface WebLoginRegz {
  id: number;
  username: string;
  email: string;
  password: string;
  subscription_type: string;
  license_key?: string;
  created_at: string;
  supabase_url?: string;
  supabase_api_key?: string;
  portal_settings?: PortalSettings;
}

export interface PortalSettings {
  enabled: boolean;
  custom_path: string;
  download_url: string;
  application_name?: string;
}

export interface License {
  id: number;
  key?: string;
  license_key: string;
  user_id?: number | null;
  created_at: string;
  expiredate: string | null;
  is_active: boolean;
  username?: string;
  admin_approval?: boolean;
  banned?: boolean;
  hwid?: any[];
  hwid_reset_count?: number;
  max_devices?: number;
  mobile_number?: string;
  save_hwid?: boolean;
  subscription?: string;
}
