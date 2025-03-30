
import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, LoginCredentials, UserCredentials } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { createClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isConnected: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: UserCredentials) => Promise<boolean>;
  logout: () => void;
  saveSupabaseConfig: (url: string, key: string) => Promise<boolean>;
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
          checkSupabaseConnection(userData.supabaseUrl, userData.supabaseKey);
        }
      } catch (error) {
        console.error("Failed to parse stored user", error);
      }
    }
    setIsLoading(false);
  }, []);

  const checkSupabaseConnection = async (url: string, key: string) => {
    try {
      const supabase = createClient(url, key);
      const { error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
      
      if (error) {
        console.error("Supabase connection error:", error);
        setIsConnected(false);
        return false;
      }
      
      setIsConnected(true);
      return true;
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
      
      // For now, this is a mock implementation
      // In a real app, you would make an API call to verify credentials
      
      // Mock user data - in the real app, this would come from your backend
      if (credentials.username && credentials.password) {
        const mockUser: AuthUser = {
          id: 1,
          username: credentials.username,
          email: `${credentials.username}@example.com`,
          isAdmin: true
        };
        
        saveUserToStorage(mockUser);
        toast({
          title: "Login successful",
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

  const saveSupabaseConfig = async (url: string, key: string): Promise<boolean> => {
    if (user) {
      const connected = await checkSupabaseConnection(url, key);
      
      if (connected) {
        const updatedUser = { ...user, supabaseUrl: url, supabaseKey: key };
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
    }
    return false;
  };

  const value = {
    user,
    isLoading,
    isConnected,
    login,
    register,
    logout,
    saveSupabaseConfig,
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
