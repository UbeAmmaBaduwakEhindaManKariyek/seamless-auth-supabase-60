
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getActiveClient } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { UserPortalConfig } from '@/components/settings/portal/types';

const UserPortalPage: React.FC = () => {
  const { username, custom_path } = useParams<{ username: string; custom_path: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalConfig, setPortalConfig] = useState<UserPortalConfig | null>(null);
  const [loginInfo, setLoginInfo] = useState({ username: '', password: '', licenseKey: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hwid, setHwid] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const supabase = getActiveClient();

  // Generate a random HWID for demo purposes
  useEffect(() => {
    const generateRandomHWID = () => {
      return Array.from(
        { length: 32 },
        () => Math.floor(Math.random() * 16).toString(16)
      ).join('');
    };
    
    setHwid(generateRandomHWID());
  }, []);

  // Fetch portal configuration
  useEffect(() => {
    const fetchPortalConfig = async () => {
      if (!username || !custom_path) {
        setError('Invalid URL parameters');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_portal_config')
          .select('*')
          .eq('username', username)
          .eq('custom_path', custom_path)
          .single();

        if (error) throw error;

        if (!data) {
          setError('Portal not found');
        } else if (!data.enabled) {
          setError('Portal is currently disabled');
        } else {
          setPortalConfig(data);
        }
      } catch (err: any) {
        console.error('Error fetching portal configuration:', err);
        setError(err.message || 'Failed to load portal');
      } finally {
        setLoading(false);
      }
    };

    fetchPortalConfig();
  }, [username, custom_path]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real implementation, you would validate against the database
      // For this demo, we'll simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsAuthenticated(true);
      toast({
        title: "Login successful",
        description: "You have been authenticated successfully",
      });
    } catch (err: any) {
      console.error('Login error:', err);
      toast({
        title: "Login failed",
        description: err.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetHWID = async () => {
    setIsResetting(true);
    
    try {
      // In a real implementation, you would update the HWID in the database
      // For this demo, we'll simulate the reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate new HWID
      const newHWID = Array.from(
        { length: 32 },
        () => Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      setHwid(newHWID);
      
      toast({
        title: "HWID Reset Successful",
        description: "Your hardware ID has been reset successfully",
      });
    } catch (err: any) {
      console.error('HWID reset error:', err);
      toast({
        title: "Reset failed",
        description: err.message || "Failed to reset HWID",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDownload = () => {
    if (!portalConfig?.download_url) {
      toast({
        title: "Download failed",
        description: "No download URL configured",
        variant: "destructive",
      });
      return;
    }
    
    window.open(portalConfig.download_url, '_blank');
    
    toast({
      title: "Download started",
      description: "Your download should begin shortly",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
        <Card className="w-full max-w-lg bg-[#101010] border-red-900">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-xl text-white">Portal Error</CardTitle>
            <CardDescription className="text-red-400">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
      <Card className="w-full max-w-lg bg-[#101010] border-[#2a2a2a]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            {portalConfig?.application_name || 'Application Portal'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isAuthenticated ? 'Manage your account and application' : 'Login to access your account'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
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
              
              <div className="space-y-2">
                <label htmlFor="licenseKey" className="text-sm text-gray-300">License Key</label>
                <Input
                  id="licenseKey"
                  type="text"
                  value={loginInfo.licenseKey}
                  onChange={(e) => setLoginInfo({...loginInfo, licenseKey: e.target.value})}
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
                ) : 'Login'}
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="manage" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a]">
                <TabsTrigger value="manage" className="data-[state=active]:bg-blue-600">
                  Manage Account
                </TabsTrigger>
                <TabsTrigger value="download" className="data-[state=active]:bg-blue-600">
                  Download
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manage" className="pt-4">
                <div className="space-y-4">
                  <div className="p-3 rounded-md bg-[#151515] border border-[#2a2a2a]">
                    <h3 className="text-sm text-gray-300 mb-1">Current Hardware ID:</h3>
                    <p className="text-xs font-mono break-all text-gray-400">{hwid}</p>
                  </div>
                  
                  <Button
                    onClick={handleResetHWID}
                    disabled={isResetting}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset HWID
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="download" className="pt-4">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-300">
                    Download the latest version of{' '}
                    <span className="font-semibold text-white">
                      {portalConfig?.application_name || 'the application'}
                    </span>
                  </p>
                  
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Now
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPortalPage;
