
export interface UserCredentials {
  email: string;
  username: string;
  password: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  isAdmin?: boolean;
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface License {
  id: number;
  key?: string;
  license_key: string;
  user_id?: number | null;
  created_at?: string;
  expiredate?: string | null;
  is_active?: boolean;
  admin_approval?: boolean;
  banned?: boolean;
  hwid?: string[];
  hwid_reset_count?: number;
  max_devices?: number;
  mobile_number?: string;
  save_hwid?: boolean;
  subscription?: string;
  username?: string; // Used for joined data from users table
}
