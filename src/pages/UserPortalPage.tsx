
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDown, KeyRound, Download, AlertCircle, LogIn, UserPlus } from 'lucide-react';

const UserPortalPage = () => {
  const { username: ownerUsername, custom_path } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalConfig, setPortalConfig] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Auth form state
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    license_key: '',
  });
  
  // Reset HWID form state
  const [resetForm, setResetForm] = useState({
    username: '',
    license_key: '',
  });
  
  useEffect(() => {
    fetchPortalConfig();
  }, [ownerUsername, custom_path]);

  const fetchPortalConfig = async () => {
    if (!ownerUsername || !custom_path) {
      setError('Invalid portal URL');
      setLoading(false);
      return;
    }

    try {
      // First try to get portal config from user_portal_config table
      const { data: portalData, error: portalError } = await supabase
        .from('user_portal_config')
        .select('*')
        .eq('username', ownerUsername)
        .eq('custom_path', custom_path)
        .eq('enabled', true)
        .maybeSingle();

      if (portalData) {
        setPortalConfig(portalData);
        setLoading(false);
        return;
      }
      
      // If not found in user_portal_config, check web_login_regz
      const { data: userData, error: userError } = await supabase
        .from('web_login_regz')
        .select('username, portal_settings')
        .eq('username', ownerUsername)
        .maybeSingle();
        
      if (userData?.portal_settings?.custom_path === custom_path && 
          userData?.portal_settings?.enabled === true) {
        
        // Format the portal config from web_login_regz data
        setPortalConfig({
          ...userData.portal_settings,
          username: userData.username
        });
      } else {
        setError('Portal not found or is disabled');
      }
    } catch (error) {
      console.error('Error fetching portal:', error);
      setError('Portal not found or is disabled');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formType: 'auth' | 'reset') => {
    const { name, value } = e.target;
    if (formType === 'auth') {
      setAuthForm(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setResetForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    
    try {
      // Check users table for credentials
      const { data: userData, error: userError } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('username', authForm.username)
        .eq('password', authForm.password)
        .single();
      
      if (userError || !userData) {
        setAuthError('Invalid username or password');
        setLoading(false);
        return;
      }
        
      // Update last login time in user_portal_auth if exists or create
      const { data: existingAuth } = await (supabase as any)
        .from('user_portal_auth')
        .select('id')
        .eq('username', authForm.username)
        .maybeSingle();
        
      if (existingAuth?.id) {
        await (supabase as any)
          .from('user_portal_auth')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingAuth.id);
      } else {
        await (supabase as any)
          .from('user_portal_auth')
          .insert({
            username: authForm.username,
            password: authForm.password,
            license_key: userData.key || ''
          });
      }
      
      // Set authenticated state
      setIsAuthenticated(true);
      
      // Set reset form with the authenticated username
      setResetForm(prev => ({
        ...prev,
        username: authForm.username,
        license_key: userData.key || ''
      }));
      
      toast({
        title: 'Login successful',
        description: 'You can now access portal features',
      });
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!authForm.username || !authForm.password || !authForm.license_key) {
      setAuthError('All fields are required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if username already exists in users table
      const { data: existingUser, error: checkUserError } = await (supabase as any)
        .from('users')
        .select('username')
        .eq('username', authForm.username)
        .single();
        
      if (existingUser) {
        setAuthError('Username already exists');
        setLoading(false);
        return;
      }
      
      // Verify license key exists in license_keys table
      const { data: licenseData, error: licenseError } = await (supabase as any)
        .from('license_keys')
        .select('*')
        .eq('license_key', authForm.license_key)
        .single();
        
      if (licenseError || !licenseData) {
        setAuthError('Invalid license key');
        setLoading(false);
        return;
      }
      
      // Create new user in users table
      const { error: registerError } = await (supabase as any)
        .from('users')
        .insert({
          username: authForm.username,
          password: authForm.password,
          key: authForm.license_key,
          subscription: licenseData.subscription,
          expiredate: licenseData.expiredate,
          save_hwid: licenseData.save_hwid,
          banned: licenseData.banned,
          hwid_reset_count: licenseData.hwid_reset_count,
          max_devices: licenseData.max_devices,
          hwid: licenseData.hwid,
          mobile_number: licenseData.mobile_number,
          admin_approval: licenseData.admin_approval
        });
        
      if (registerError) {
        throw registerError;
      }
      
      // Create entry in portal auth table
      await (supabase as any)
        .from('user_portal_auth')
        .insert({
          username: authForm.username,
          password: authForm.password,
          license_key: authForm.license_key,
        });
      
      // Set authenticated state
      setIsAuthenticated(true);
      
      // Set reset form with the registered username
      setResetForm(prev => ({
        ...prev,
        username: authForm.username,
        license_key: authForm.license_key
      }));
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created',
      });
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleResetHWID = async () => {
    if (!resetForm.username || !resetForm.license_key) {
      toast({
        title: 'Missing information',
        description: 'Please enter your username and license key',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Reset HWID for both users and license_keys table
      const { error: userUpdateError } = await (supabase as any)
        .from('users')
        .update({ hwid: [] })
        .eq('username', resetForm.username)
        .eq('key', resetForm.license_key);

      const { error: licenseUpdateError } = await (supabase as any)
        .from('license_keys')
        .update({ hwid: [] })
        .eq('license_key', resetForm.license_key);

      if (userUpdateError && licenseUpdateError) {
        throw userUpdateError || licenseUpdateError;
      }

      toast({
        title: 'Success',
        description: 'Your HWID has been reset successfully',
      });
    } catch (error) {
      console.error('Error resetting HWID:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset HWID. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (portalConfig?.download_url) {
      window.open(portalConfig.download_url, '_blank');
    } else {
      toast({
        title: 'Download unavailable',
        description: 'The download link has not been configured by the administrator',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthForm({
      username: '',
      password: '',
      license_key: '',
    });
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  if (loading && !portalConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <p className="text-white">Loading portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
        <Card className="w-full max-w-md bg-[#101010] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Portal Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Portal Title - Use application name if in configuration, otherwise use a default
  const portalTitle = portalConfig?.application_name || "Application Portal";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
      <Card className="w-full max-w-md bg-[#101010] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">{portalTitle}</CardTitle>
          <CardDescription className="text-gray-400">
            {isAuthenticated 
              ? "Reset your HWID or download the application" 
              : "Login or register to access portal features"}
          </CardDescription>
        </CardHeader>
        
        {isAuthenticated ? (
          <CardContent>
            <Tabs defaultValue="reset" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reset">Reset HWID</TabsTrigger>
                <TabsTrigger value="download">Download</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reset" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-username">Username</Label>
                  <Input
                    id="reset-username"
                    name="username"
                    value={resetForm.username}
                    onChange={(e) => handleInputChange(e, 'reset')}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reset-license-key">License Key</Label>
                  <Input
                    id="reset-license-key"
                    name="license_key"
                    value={resetForm.license_key}
                    onChange={(e) => handleInputChange(e, 'reset')}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    readOnly
                  />
                </div>
                
                <Button 
                  onClick={handleResetHWID} 
                  className="w-full"
                  disabled={loading}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset HWID
                </Button>
              </TabsContent>
              
              <TabsContent value="download" className="pt-4">
                <div className="text-center space-y-4">
                  <ArrowDown className="h-12 w-12 mx-auto text-blue-500" />
                  <h3 className="text-lg font-medium text-white">Download Application</h3>
                  <p className="text-sm text-gray-400">
                    Click the button below to download the latest version of the application
                  </p>
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Now
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <Button onClick={handleLogout} variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                Logout
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {authError && (
                <Alert className="mt-4 bg-red-900 border-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="login" className="space-y-4 pt-4">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        name="username"
                        placeholder="Enter your username"
                        value={authForm.username}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={authForm.password}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Logging in...
                        </span>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Login
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 pt-4">
                <form onSubmit={handleRegister}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        name="username"
                        placeholder="Choose a username"
                        value={authForm.username}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="Choose a password"
                        value={authForm.password}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-license">License Key</Label>
                      <Input
                        id="register-license"
                        name="license_key"
                        placeholder="Enter your license key"
                        value={authForm.license_key}
                        onChange={(e) => handleInputChange(e, 'auth')}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registering...
                        </span>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Register
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UserPortalPage;
