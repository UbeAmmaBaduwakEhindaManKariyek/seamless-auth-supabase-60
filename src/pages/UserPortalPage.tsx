
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDown, KeyRound, Download } from 'lucide-react';

const UserPortalPage = () => {
  const { username, custom_path } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalConfig, setPortalConfig] = useState<any>(null);
  const [loginDetails, setLoginDetails] = useState({
    username: '',
    license_key: '',
  });
  
  useEffect(() => {
    fetchPortalConfig();
  }, [username, custom_path]);

  const fetchPortalConfig = async () => {
    if (!username || !custom_path) {
      setError('Invalid portal URL');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_portal_config')
        .select('*')
        .eq('username', username)
        .eq('custom_path', custom_path)
        .eq('enabled', true)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        setError('Portal not found or is disabled');
      } else {
        setPortalConfig(data);
      }
    } catch (error) {
      console.error('Error fetching portal:', error);
      setError('Portal not found or is disabled');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetHWID = async () => {
    if (!loginDetails.username || !loginDetails.license_key) {
      toast({
        title: 'Missing information',
        description: 'Please enter your username and license key',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      // First verify the license belongs to this user
      const { data: licenseData, error: licenseError } = await supabase
        .from('license_keys')
        .select('*')
        .eq('license_key', loginDetails.license_key)
        .single();

      if (licenseError || !licenseData) {
        toast({
          title: 'Invalid license',
          description: 'The license key you entered is not valid',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Reset the HWID by clearing the array
      const { error: updateError } = await supabase
        .from('license_keys')
        .update({ hwid: [] })
        .eq('license_key', loginDetails.license_key);

      if (updateError) {
        throw updateError;
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

  if (loading) {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
      <Card className="w-full max-w-md bg-[#101010] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">User Portal</CardTitle>
          <CardDescription className="text-gray-400">
            Reset your HWID or download the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reset" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reset">Reset HWID</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reset" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={loginDetails.username}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="license_key">License Key</Label>
                <Input
                  id="license_key"
                  name="license_key"
                  placeholder="Enter your license key"
                  value={loginDetails.license_key}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPortalPage;
