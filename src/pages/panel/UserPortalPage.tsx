
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, RefreshCw, AlertCircle, LogIn } from 'lucide-react';
import { UserPortalConfig } from '@/components/settings/portal/types';

const UserPortalPage: React.FC = () => {
  const { username, custom_path } = useParams<{ username: string; custom_path: string }>();
  const [portalConfig, setPortalConfig] = useState<UserPortalConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginInfo, setLoginInfo] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hwid, setHwid] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();

  // Generate a random HWID for demo purposes
  const generateRandomHWID = () => {
    return Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  useEffect(() => {
    console.log("UserPortalPage - Params:", { username, custom_path });
    fetchPortalConfig();
    setHwid(generateRandomHWID());
  }, [username, custom_path]);

  const fetchPortalConfig = async () => {
    if (!username || !custom_path) {
      setError("Invalid portal URL");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Fetching portal config for ${username}/${custom_path}`);
      
      // First try to get from the user_portal_config table
      const { data: portalData, error: portalError } = await supabase
        .from('user_portal_config')
        .select('*')
        .eq('username', username)
        .eq('custom_path', custom_path)
        .maybeSingle();

      if (portalError) {
        console.error("Error fetching from user_portal_config:", portalError);
      }

      if (portalData) {
        console.log("Found portal config in user_portal_config:", portalData);
        setPortalConfig(portalData as UserPortalConfig);
      } else {
        // If not found in user_portal_config, check web_login_regz for portal settings
        const { data: userData, error: userError } = await supabase
          .from('web_login_regz')
          .select('portal_settings')
          .eq('username', username)
          .maybeSingle();

        if (userError) {
          throw new Error(`Failed to find user: ${userError.message}`);
        }

        if (userData && userData.portal_settings) {
          const settings = userData.portal_settings;
          
          // Check if this is the correct portal path
          if (settings.custom_path === custom_path) {
            console.log("Found portal config in web_login_regz:", settings);
            setPortalConfig({
              enabled: settings.enabled,
              custom_path: settings.custom_path,
              download_url: settings.download_url,
              application_name: settings.application_name,
              username: username
            });
          } else {
            throw new Error("Portal not found");
          }
        } else {
          throw new Error("Portal configuration not found");
        }
      }
    } catch (err: any) {
      console.error("Error fetching portal configuration:", err);
      setError(err.message || "Failed to load portal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginInfo.username || !loginInfo.password) {
      toast({
        title: "Missing information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, try to authenticate against the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', loginInfo.username)
        .eq('password', loginInfo.password)
        .maybeSingle();

      if (userError) {
        throw new Error(userError.message);
      }

      if (userData) {
        // User found in the users table
        setUserData(userData);
        setIsAuthenticated(true);
        toast({
          title: "Login successful",
          description: "You have been authenticated successfully",
        });
        return;
      }

      // If not found in users table, try user_portal_auth
      const { data: portalUserData, error: portalUserError } = await supabase
        .from('user_portal_auth')
        .select('*')
        .eq('username', loginInfo.username)
        .eq('password', loginInfo.password)
        .maybeSingle();

      if (portalUserError) {
        throw new Error(portalUserError.message);
      }

      if (portalUserData) {
        // User found in the user_portal_auth table
        setUserData(portalUserData);
        setIsAuthenticated(true);
        // Update last login time
        await supabase
          .from('user_portal_auth')
          .update({ last_login: new Date().toISOString() })
          .eq('id', portalUserData.id);

        toast({
          title: "Login successful",
          description: "You have been authenticated successfully",
        });
        return;
      }

      // No user found in either table
      throw new Error("Invalid username or password");
    } catch (err: any) {
      console.error('Login error:', err);
      toast({
        title: "Login failed",
        description: err.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetHWID = async () => {
    setIsResetting(true);
    
    try {
      // Get the user's license key
      const licenseKey = userData?.key || userData?.license_key;
      
      if (!licenseKey) {
        throw new Error("No license key associated with this account");
      }
      
      // Reset HWID in the license_keys table
      const { error: resetError } = await supabase
        .from('license_keys')
        .update({ hwid: [] })
        .eq('license_key', licenseKey);
      
      if (resetError) throw resetError;
      
      // Also reset HWID in the users table if the user exists there
      await supabase
        .from('users')
        .update({ hwid: [] })
        .eq('username', loginInfo.username);
      
      const newHWID = Array.from(
        { length: 32 },
        () => Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      setHwid(newHWID);
      
      toast({
        title: "HWID Reset",
        description: "Your hardware ID has been reset successfully",
      });
    } catch (err: any) {
      console.error('HWID reset error:', err);
      toast({
        title: "Reset failed",
        description: err.message || "Failed to reset hardware ID",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-xl text-white">Loading user portal...</h2>
          <p className="text-gray-400">Please wait while we load your portal configuration</p>
        </div>
      </div>
    );
  }

  if (error || !portalConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-4 max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Portal Not Found</h2>
          <p className="text-gray-400">
            {error || "The requested portal doesn't exist or is not configured correctly."}
          </p>
          <div className="pt-2">
            <p className="text-sm text-gray-500">
              URL Parameters: {username}/{custom_path}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!portalConfig.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-4 max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Portal Disabled</h2>
          <p className="text-gray-400">
            This user portal is currently disabled. Please contact the application owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] py-12">
      <div className="container px-4 max-w-md">
        <Card className="bg-[#121212] border-[#2a2a2a]">
          <CardHeader className="text-center border-b border-[#2a2a2a]">
            <CardTitle className="text-xl font-bold text-white">
              {portalConfig.application_name || "User Portal"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid grid-cols-2 bg-[#1a1a1a] p-0 rounded-none border-b border-[#2a2a2a]">
                <TabsTrigger 
                  value="login" 
                  className="py-3 data-[state=active]:bg-[#121212] data-[state=active]:text-white rounded-none"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="download" 
                  className="py-3 data-[state=active]:bg-[#121212] data-[state=active]:text-white rounded-none"
                >
                  Download
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="p-6 space-y-4">
                {!isAuthenticated ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="username" className="text-sm text-gray-300">Username</label>
                      <Input
                        id="username"
                        type="text"
                        value={loginInfo.username}
                        onChange={(e) => setLoginInfo({...loginInfo, username: e.target.value})}
                        required
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm text-gray-300">Password</label>
                      <Input
                        id="password"
                        type="password"
                        value={loginInfo.password}
                        onChange={(e) => setLoginInfo({...loginInfo, password: e.target.value})}
                        required
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Login
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-md">
                      <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
                      <p className="text-sm text-gray-400">
                        Logged in as: <span className="text-blue-400">{loginInfo.username}</span>
                      </p>
                      <p className="text-sm text-gray-400 mt-1">Hardware ID:</p>
                      <p className="text-xs font-mono bg-[#0a0a0a] p-2 rounded mt-1 text-gray-300 break-all">
                        {hwid}
                      </p>
                    </div>
                    
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={resetHWID}
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting HWID...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset Hardware ID
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="download" className="p-6">
                <div className="space-y-6">
                  <div className="bg-[#1a1a1a] p-4 rounded-md">
                    <h3 className="text-lg font-semibold text-white mb-2">Application Download</h3>
                    <p className="text-sm text-gray-400">
                      Download the latest version of {portalConfig.application_name || "the application"}
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (portalConfig.download_url) {
                        window.open(portalConfig.download_url, '_blank');
                      } else {
                        toast({
                          title: "Download unavailable",
                          description: "The download URL has not been configured",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Application
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} {portalConfig.application_name || "Application"} - All rights reserved
        </p>
      </div>
    </div>
  );
};

export default UserPortalPage;
