
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
