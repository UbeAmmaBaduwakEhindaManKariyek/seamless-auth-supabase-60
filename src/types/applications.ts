
export interface Application {
  id: number;
  name: string;
  owner_id: string;
  version: string;
  app_secret: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
