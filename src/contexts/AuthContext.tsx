
import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, LoginCredentials, UserCredentials } from "@/types/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase, createCustomClient, getActiveClient, executeRawSql } from '@/integrations/supabase/client';

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
    const storedUser = localStorage.getItem("keyauth_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
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
      
      const customClient = createCustomClient(url, key);
      
      if (!customClient) {
        console.error("Failed to create custom Supabase client");
        setIsConnected(false);
        return false;
      }
      
      try {
        const { error: tablesError } = await customClient
          .from('users')
          .select('count', { count: 'exact', head: true });
        
        if (tablesError) {
          const { error: authError } = await customClient
            .from('web_login_regz')
            .select('count', { count: 'exact', head: true });
          
          if (authError) {
            console.error("All connection tests failed:", authError);
            setIsConnected(false);
            return false;
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
      
      const projectSupabase = supabase;
      
      const { data, error } = await projectSupabase
        .from('web_login_regz')
        .select('*')
        .eq('username', credentials.username)
        .maybeSingle();
      
      if (error) {
        console.error("Error querying web_login_regz:", error);
        toast({
          title: "Login failed",
          description: "Failed to authenticate. Please check your credentials.",
          variant: "destructive",
        });
        return false;
      }
      
      if (data && data.username === credentials.username) {
        if (data.password === credentials.password) {
          const userWithSupabaseConfig: AuthUser = {
            id: data.id,
            username: data.username,
            email: data.email,
            isAdmin: data.subscription_type === 'admin',
            supabaseUrl: data.supabase_url,
            supabaseKey: data.supabase_api_key
          };
          
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
              saveUserToStorage(userWithSupabaseConfig);
              toast({
                title: "Login successful",
                description: "But could not connect to your Supabase project. Please check your Supabase configuration.",
                variant: "destructive"
              });
              return true;
            }
          } else {
            saveUserToStorage(userWithSupabaseConfig);
            toast({
              title: "Login successful",
              description: `Welcome back, ${userWithSupabaseConfig.username}!`,
            });
            return true;
          }
        }
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
      console.log("Register function called with:", credentials);
      
      // Using the default supabase client for registration
      const projectSupabase = supabase;
      
      // Check if username already exists
      const { data: existingUser, error: checkUserError } = await projectSupabase
        .from('web_login_regz')
        .select('username')
        .eq('username', credentials.username)
        .maybeSingle();
        
      if (checkUserError) {
        console.error("Error checking for existing user:", checkUserError);
        toast({
          title: "Registration failed",
          description: "Error checking username availability",
          variant: "destructive",
        });
        return false;
      }
      
      if (existingUser) {
        toast({
          title: "Registration failed",
          description: "Username already exists",
          variant: "destructive",
        });
        return false;
      }
      
      // Create new user
      const { error: insertError } = await projectSupabase
        .from('web_login_regz')
        .insert({
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
          subscription_type: 'user',
          supabase_url: credentials.supabaseUrl,
          supabase_api_key: credentials.supabaseKey
        });
      
      if (insertError) {
        console.error("Error inserting new user:", insertError);
        toast({
          title: "Registration failed",
          description: `Failed to create user account: ${insertError.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      // Get the newly created user
      const { data: newUser, error: fetchNewUserError } = await projectSupabase
        .from('web_login_regz')
        .select('*')
        .eq('username', credentials.username)
        .maybeSingle();
      
      if (fetchNewUserError || !newUser) {
        console.error("Error fetching new user:", fetchNewUserError);
        toast({
          title: "Registration partial success",
          description: "Account created but unable to log in automatically",
          variant: "destructive",
        });
        return false;
      }
      
      // Create user object and save to storage
      const userWithSupabaseConfig: AuthUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.subscription_type === 'admin',
        supabaseUrl: newUser.supabase_url,
        supabaseKey: newUser.supabase_api_key
      };
      
      saveUserToStorage(userWithSupabaseConfig);
      
      // Connect to custom supabase if provided
      if (newUser.supabase_url && newUser.supabase_api_key) {
        await checkSupabaseConnection(newUser.supabase_url, newUser.supabase_api_key);
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userWithSupabaseConfig.username}!`,
      });
      
      return true;
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
        
        if (user && user.username) {
          try {
            const customClient = createCustomClient(url, key);
            if (!customClient) {
              console.error("Failed to create custom Supabase client");
              return false;
            }
            
            const { error: checkTableError } = await customClient
              .from('web_login_regz')
              .select('count', { count: 'exact', head: true });
              
            if (checkTableError) {
              console.log("web_login_regz table might not exist, attempting to create it");
              
              try {
                const { error: createTableError } = await executeRawSql(`
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
                `);
                
                if (createTableError) {
                  console.error("Failed to create web_login_regz table:", createTableError);
                }
              } catch (error) {
                console.error("Error creating web_login_regz table:", error);
              }
            }
            
            const { error: upsertError } = await customClient.from('web_login_regz').upsert({
              username: user.username,
              email: user.email || 'admin@example.com',
              password: 'encrypted_password',
              subscription_type: 'admin',
              supabase_url: url,
              supabase_api_key: key,
              created_at: new Date().toISOString()
            }, { 
              onConflict: 'username' 
            });
            
            if (upsertError) {
              console.error("Failed to save credentials to web_login_regz:", upsertError);
            } else {
              console.log("Successfully saved credentials to web_login_regz table");
            }
          } catch (error) {
            console.error("Error saving to web_login_regz:", error);
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
