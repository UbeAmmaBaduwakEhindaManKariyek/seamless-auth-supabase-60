import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { PortalSettings } from '@/types/auth';
import { Json } from '@/integrations/supabase/types';

interface PortalConfig {
  application_name: string;
  download_url: string;
  enabled: boolean;
}

const UserPortalPage: React.FC = () => {
  const { username, custom_path } = useParams<{ username: string; custom_path: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!username || !custom_path) {
      return;
    }
    
    fetchPortalConfiguration();
  }, [username, custom_path]);

  const fetchPortalConfiguration = async () => {
    setIsLoading(true);
    try {
      // First check user_portal_config table
      const { data: portalData, error: portalError } = await supabase
        .from('user_portal_config')
        .select('*')
        .eq('username', username)
        .eq('custom_path', custom_path)
        .maybeSingle();

      if (portalData) {
        if (!portalData.enabled) {
          toast({
            title: 'Portal Disabled',
            description: 'This user portal is currently disabled.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        setPortalConfig({
          application_name: portalData.application_name || 'Application Portal',
          download_url: portalData.download_url || '',
          enabled: portalData.enabled
        });
      } else {
        // If not found in specific table, check web_login_regz for portal_settings
        const { data: userData, error: userError } = await supabase
          .from('web_login_regz')
          .select('portal_settings')
          .eq('username', username)
          .maybeSingle();

        if (userData && userData.portal_settings) {
          // Convert the raw data with portal_settings to our expected types
          // Handle the case where portal_settings might be null or have a different structure
          const portalSettings = userData.portal_settings as unknown as PortalSettings;
          
          if (!portalSettings || typeof portalSettings !== 'object' || !portalSettings.enabled || portalSettings.custom_path !== custom_path) {
            toast({
              title: 'Portal Not Found',
              description: 'The requested portal does not exist or is disabled.',
              variant: 'destructive',
            });
            navigate('/');
            return;
          }
          
          setPortalConfig({
            application_name: portalSettings.application_name || 'Application Portal',
            download_url: portalSettings.download_url || '',
            enabled: portalSettings.enabled
          });
        } else {
          toast({
            title: 'Portal Not Found',
            description: 'The requested portal does not exist.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching portal configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load portal configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUsername || !portalPassword) {
      toast({
        title: 'Missing Fields',
        description: 'Please enter both username and password.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase
        .from('user_portal_auth')
        .select('*')
        .eq('username', portalUsername)
        .eq('password', portalPassword) // In a real app, use proper password hashing
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Update last login time
        await supabase
          .from('user_portal_auth')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id);
        
        // Get license key details
        const { data: licenseData, error: licenseError } = await supabase
          .from('license_keys')
          .select('*')
          .eq('license_key', data.license_key)
          .maybeSingle();
        
        setCurrentUser({
          ...data,
          licenseDetails: licenseData || {}
        });
        
        setIsAuthenticated(true);
        toast({
          title: 'Login Successful',
          description: 'You have successfully logged in.',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'An error occurred during login.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUsername || !portalPassword || !confirmedPassword || !licenseKey) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }
    
    if (portalPassword !== confirmedPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsRegistering(true);
    try {
      // First verify the license key exists
      const { data: licenseData, error: licenseError } = await supabase
        .from('license_keys')
        .select('*')
        .eq('license_key', licenseKey)
        .maybeSingle();
      
      if (licenseError) throw licenseError;
      
      if (!licenseData) {
        toast({
          title: 'Invalid License Key',
          description: 'The license key you entered is not valid.',
          variant: 'destructive',
        });
        setIsRegistering(false);
        return;
      }
      
      // Check if user already exists with this username
      const { data: existingUser, error: userError } = await supabase
        .from('user_portal_auth')
        .select('id')
        .eq('username', portalUsername)
        .maybeSingle();
      
      if (existingUser) {
        toast({
          title: 'Username Taken',
          description: 'This username is already in use.',
          variant: 'destructive',
        });
        setIsRegistering(false);
        return;
      }
      
      // Check if license key is already registered
      const { data: existingLicense, error: licenseAuthError } = await supabase
        .from('user_portal_auth')
        .select('id')
        .eq('license_key', licenseKey)
        .maybeSingle();
      
      if (existingLicense) {
        toast({
          title: 'License Already Registered',
          description: 'This license key is already registered to another user.',
          variant: 'destructive',
        });
        setIsRegistering(false);
        return;
      }
      
      // Create new user
      const { data, error } = await supabase
        .from('user_portal_auth')
        .insert({
          username: portalUsername,
          password: portalPassword, // In a real app, use proper password hashing
          license_key: licenseKey,
          last_login: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setCurrentUser({
        ...data,
        licenseDetails: licenseData
      });
      
      setIsAuthenticated(true);
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created and you are now logged in.',
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Error',
        description: 'An error occurred during registration.',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetHWID = async () => {
    if (!currentUser) return;
    
    setIsResetting(true);
    try {
      // Get current license data
      const { data: licenseData, error: licenseError } = await supabase
        .from('license_keys')
        .select('*')
        .eq('license_key', currentUser.license_key)
        .maybeSingle();
      
      if (licenseError) throw licenseError;
      
      if (!licenseData) {
        toast({
          title: 'License Not Found',
          description: 'Could not find your license information.',
          variant: 'destructive',
        });
        return;
      }
      
      if (licenseData.hwid_reset_count <= 0) {
        toast({
          title: 'Reset Limit Reached',
          description: 'You have reached the maximum number of HWID resets.',
          variant: 'destructive',
        });
        return;
      }
      
      // Reset HWID by clearing the array and decrementing the reset count
      const { error: updateError } = await supabase
        .from('license_keys')
        .update({
          hwid: [],
          hwid_reset_count: licenseData.hwid_reset_count - 1
        })
        .eq('license_key', currentUser.license_key);
      
      if (updateError) throw updateError;
      
      // Update the current user's license details
      setCurrentUser({
        ...currentUser,
        licenseDetails: {
          ...currentUser.licenseDetails,
          hwid: [],
          hwid_reset_count: currentUser.licenseDetails.hwid_reset_count - 1
        }
      });
      
      toast({
        title: 'HWID Reset Successful',
        description: `Hardware ID has been reset. You have ${licenseData.hwid_reset_count - 1} resets remaining.`,
      });
    } catch (error) {
      console.error('HWID reset error:', error);
      toast({
        title: 'Reset Error',
        description: 'An error occurred while resetting your hardware ID.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPortalUsername('');
    setPortalPassword('');
    setConfirmedPassword('');
    setLicenseKey('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!portalConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Portal Not Found</h1>
          <p className="mt-2">The requested portal does not exist or is not configured correctly.</p>
        </div>
      </div>
    );
  }

  // User is authenticated, show the dashboard
  if (isAuthenticated && currentUser) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-4">
        <Card className="max-w-xl mx-auto bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-2xl">{portalConfig.application_name}</CardTitle>
            <CardDescription className="text-gray-400">User Dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-[#0f0f0f] p-4 rounded-md border border-[#2a2a2a]">
              <h3 className="text-lg font-semibold mb-2">License Information</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-gray-400">License Key:</span>
                <span className="font-mono">{currentUser.license_key}</span>
                
                <span className="text-gray-400">HWID Resets Left:</span>
                <span>{currentUser?.licenseDetails?.hwid_reset_count || 0}</span>
                
                <span className="text-gray-400">Status:</span>
                <span>{currentUser?.licenseDetails?.is_active === false ? 'Inactive' : 'Active'}</span>
                
                {currentUser?.licenseDetails?.expiredate && (
                  <>
                    <span className="text-gray-400">Expires:</span>
                    <span>{new Date(currentUser.licenseDetails.expiredate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 flex-col sm:flex-row">
              {portalConfig.download_url && (
                <Button className="bg-blue-600 hover:bg-blue-700 flex-1" onClick={() => window.open(portalConfig.download_url, '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Application
                </Button>
              )}
              
              <Button 
                className="bg-amber-600 hover:bg-amber-700 flex-1" 
                onClick={handleResetHWID}
                disabled={isResetting || (currentUser?.licenseDetails?.hwid_reset_count <= 0)}
              >
                {isResetting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Reset HWID
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full bg-[#0f0f0f] border-[#2a2a2a] hover:bg-[#2a2a2a]"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // User is not authenticated, show login/register form
  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-xl">{portalConfig.application_name}</CardTitle>
          <CardDescription className="text-gray-400">User Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#0f0f0f]">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={portalUsername}
                    onChange={(e) => setPortalUsername(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2a2a2a]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2a2a2a]"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : 'Login'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-license">License Key</Label>
                  <Input
                    id="reg-license"
                    type="text"
                    placeholder="Enter your license key"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2a2a2a]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input
                    id="reg-username"
                    type="text"
                    placeholder="Choose a username"
                    value={portalUsername}
                    onChange={(e) => setPortalUsername(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2a2a2a]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Choose a password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2a2a2a]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmedPassword}
                    onChange={(e) => setConfirmedPassword(e.target.value)}
                    className="bg-[#0f0f0f] border-[#2a2a2a]"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : 'Register'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPortalPage;
