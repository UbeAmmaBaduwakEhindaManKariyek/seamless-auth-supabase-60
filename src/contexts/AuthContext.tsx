
import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, LoginCredentials, UserCredentials } from "@/types/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase, createCustomClient, getActiveClient } from '@/integrations/supabase/client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isConnected: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: UserCredentials) => Promise<boolean>;
  logout: () => void;
  saveSupabaseConfig: (url: string, key: string) => Promise<boolean>;
  checkConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("keyauth_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // If user has Supabase config, check connection
        if (userData.supabaseUrl && userData.supabaseKey) {
          checkSupabaseConnection(userData.supabaseUrl, userData.supabaseKey)
            .then(connected => {
              if (!connected) {
                console.error("Failed to connect with stored Supabase credentials");
                toast({
                  title: "Connection Error",
                  description: "Could not connect to Supabase with stored credentials. Please try again.",
                  variant: "destructive",
                });
              }
            });
        }
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("keyauth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const checkSupabaseConnection = async (url: string, key: string): Promise<boolean> => {
    try {
      if (!url || !key) {
        console.error("Invalid Supabase URL or key");
        setIsConnected(false);
        return false;
      }
      
      console.log("Attempting to connect to Supabase with URL:", url);
      
      // Create a custom client with the provided credentials
      const customClient = createCustomClient(url, key);
      
      if (!customClient) {
        console.error("Failed to create custom Supabase client");
        setIsConnected(false);
        return false;
      }
      
      // Check connection by making a simple query
      try {
        // Use a simple query that doesn't depend on specific tables
        const { data, error } = await customClient.rpc('pg_client_check', {}, { count: 'exact' });
        
        if (error) {
          // Try a different approach - check if any table exists
          const { error: tablesError } = await customClient
            .from('users')
            .select('count', { count: 'exact', head: true });
          
          if (tablesError) {
            // One more attempt - check if we have access to auth schema tables
            const { error: authError } = await customClient
              .from('web_login_regz')
              .select('count', { count: 'exact', head: true });
            
            if (authError) {
              console.error("All connection tests failed:", authError);
              setIsConnected(false);
              return false;
            }
          }
        }
        
        console.log("Successfully connected to Supabase");
        setIsConnected(true);
        return true;
      } catch (queryError) {
        console.error("Supabase query error:", queryError);
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      console.error("Supabase connection error:", error);
      setIsConnected(false);
      return false;
    }
  };

  const saveUserToStorage = (userData: AuthUser) => {
    localStorage.setItem("keyauth_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if user exists in web_login_regz table
      const client = getActiveClient();
      const { data, error } = await client
        .from('web_login_regz')
        .select('*')
        .eq('username', credentials.username)
        .maybeSingle();
        
      if (error) {
        console.error("Error querying web_login_regz:", error);
      }
      
      // If we found a user with matching username
      if (data && data.username === credentials.username) {
        // In a real app, you would hash and compare the password
        // For now, just check if they match
        if (data.password === credentials.password) {
          const userWithSupabaseConfig: AuthUser = {
            id: data.id,
            username: data.username,
            email: data.email,
            isAdmin: data.subscription_type === 'admin',
            supabaseUrl: data.supabase_url,
            supabaseKey: data.supabase_api_key
          };
          
          // Check connection with the stored Supabase config
          if (data.supabase_url && data.supabase_api_key) {
            const connected = await checkSupabaseConnection(data.supabase_url, data.supabase_api_key);
            if (connected) {
              saveUserToStorage(userWithSupabaseConfig);
              toast({
                title: "Login successful",
                description: `Welcome back, ${userWithSupabaseConfig.username}!`,
              });
              return true;
            } else {
              // Still save the user, but notify about connection issue
              saveUserToStorage(userWithSupabaseConfig);
              toast({
                title: "Login successful",
                description: "But could not connect to your Supabase project. Please check your Supabase configuration.",
                variant: "warning"
              });
              return true;
            }
          } else {
            // No Supabase config, just save the user
            saveUserToStorage(userWithSupabaseConfig);
            toast({
              title: "Login successful",
              description: `Welcome back, ${userWithSupabaseConfig.username}!`,
            });
            return true;
          }
        }
      }
      
      // If no matching user found in database or password doesn't match, use mock user for testing
      if (credentials.username && credentials.password) {
        const mockUser: AuthUser = {
          id: 1,
          username: credentials.username,
          email: `${credentials.username}@example.com`,
          isAdmin: true
        };
        
        saveUserToStorage(mockUser);
        toast({
          title: "Login successful (Demo mode)",
          description: `Welcome back, ${mockUser.username}!`,
        });
        return true;
      }
      
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: UserCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // For now, this is a mock implementation
      // In a real app, you would make an API call to register the user
      
      // Mock registration success
      if (credentials.username && credentials.password && credentials.email) {
        const mockUser: AuthUser = {
          id: 1,
          username: credentials.username,
          email: credentials.email,
          isAdmin: false
        };
        
        saveUserToStorage(mockUser);
        toast({
          title: "Registration successful",
          description: `Welcome, ${mockUser.username}!`,
        });
        return true;
      }
      
      toast({
        title: "Registration failed",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("keyauth_user");
    setUser(null);
    setIsConnected(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const checkConnection = async (): Promise<boolean> => {
    if (!user?.supabaseUrl || !user?.supabaseKey) {
      return false;
    }
    return await checkSupabaseConnection(user.supabaseUrl, user.supabaseKey);
  };

  const saveSupabaseConfig = async (url: string, key: string): Promise<boolean> => {
    if (!url.trim() || !key.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both Supabase URL and API key",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsLoading(true);
      console.log("Testing connection to:", url);
      
      const connected = await checkSupabaseConnection(url, key);
      
      if (connected) {
        const updatedUser = user ? { ...user, supabaseUrl: url, supabaseKey: key } : {
          id: 1,
          username: "admin",
          email: "admin@example.com",
          supabaseUrl: url,
          supabaseKey: key,
          isAdmin: true
        };
        
        // Save credentials to web_login_regz table if connected
        if (user && user.username) {
          try {
            const client = getActiveClient();
            const { error } = await client.from('web_login_regz').upsert({
              username: user.username,
              email: user.email || 'admin@example.com',
              password: 'encrypted_password', // In a real app, you'd store this securely
              subscription_type: 'admin',
              supabase_url: url,
              supabase_api_key: key,
              created_at: new Date().toISOString()
            }, { 
              onConflict: 'username' 
            });
            
            if (error) {
              console.error("Failed to save credentials to web_login_regz:", error);
              // Try to create the table if it doesn't exist
              await createWebLoginRegzTable(url, key);
            } else {
              console.log("Successfully saved credentials to web_login_regz table");
            }
          } catch (error) {
            console.error("Error saving to web_login_regz:", error);
            // Try to create the table if it doesn't exist
            await createWebLoginRegzTable(url, key);
          }
        }
        
        saveUserToStorage(updatedUser);
        toast({
          title: "Supabase configuration saved",
          description: "Your Supabase URL and API key have been saved and connected successfully",
        });
        return true;
      } else {
        toast({
          title: "Connection failed",
          description: "Could not connect to Supabase with the provided URL and API key",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Failed to save Supabase config:", error);
      toast({
        title: "Connection Error",
        description: "An error occurred while trying to connect to Supabase",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to create web_login_regz table if it doesn't exist
  const createWebLoginRegzTable = async (url: string, key: string) => {
    try {
      const customClient = createCustomClient(url, key);
      if (!customClient) return;
      
      const { error } = await customClient.rpc('pgclient', { 
        query: `
          CREATE TABLE IF NOT EXISTS web_login_regz (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            subscription_type TEXT NOT NULL,
            supabase_url TEXT,
            supabase_api_key TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
          )
        `
      });
      
      if (error) {
        console.error("Failed to create web_login_regz table:", error);
      } else {
        console.log("Successfully created web_login_regz table");
        
        // Try inserting the record again
        if (user?.username) {
          const { error: insertError } = await customClient.from('web_login_regz').insert({
            username: user.username,
            email: user.email || 'admin@example.com',
            password: 'encrypted_password',
            subscription_type: 'admin',
            supabase_url: url,
            supabase_api_key: key
          });
          
          if (insertError) {
            console.error("Failed to insert into web_login_regz:", insertError);
          }
        }
      }
    } catch (error) {
      console.error("Error creating web_login_regz table:", error);
    }
  };

  const value = {
    user,
    isLoading,
    isConnected,
    login,
    register,
    logout,
    saveSupabaseConfig,
    checkConnection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
