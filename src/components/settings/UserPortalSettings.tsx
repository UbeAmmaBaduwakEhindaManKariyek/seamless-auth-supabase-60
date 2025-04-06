import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPortalConfig {
  id?: number;
  enabled: boolean;
  custom_path: string;
  download_url: string;
  created_at?: string;
  username?: string;
}

const UserPortalSettings = () => {
  const { toast } = useToast();
  const { user, isConnected } = useAuth();
  const [portalConfig, setPortalConfig] = useState<UserPortalConfig>({
    enabled: false,
    custom_path: '',
    download_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string>('');

  useEffect(() => {
    if (isConnected && user?.username) {
      fetchPortalConfig();
    }
  }, [isConnected, user]);

  useEffect(() => {
    if (user?.username && portalConfig.custom_path) {
      const baseUrl = window.location.origin;
      setPortalUrl(`${baseUrl}/portal/${user.username}/${portalConfig.custom_path}`);
    } else {
      setPortalUrl('');
    }
  }, [portalConfig.custom_path, user?.username]);

  const fetchPortalConfig = async () => {
    if (!user?.username) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_portal_config')
        .select('*')
        .eq('username', user.username)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPortalConfig({
          id: data.id,
          enabled: data.enabled,
          custom_path: data.custom_path,
          download_url: data.download_url || '',
          created_at: data.created_at,
          username: data.username
        });
      }
    } catch (error) {
      console.error('Error fetching portal configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load portal configuration.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePortalConfig = async () => {
    if (!user?.username || !portalConfig.custom_path.trim()) {
      toast({
        title: 'Invalid configuration',
        description: 'Please provide a custom path for your portal.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const portalData = {
        username: user.username,
        enabled: portalConfig.enabled,
        custom_path: portalConfig.custom_path.trim(),
        download_url: portalConfig.download_url.trim(),
      };

      let response;
      
      if (portalConfig.id) {
        response = await (supabase as any)
          .from('user_portal_config')
          .update(portalData)
          .eq('id', portalConfig.id);
      } else {
        response = await (supabase as any)
          .from('user_portal_config')
          .insert(portalData);
      }

      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Success',
        description: 'User portal configuration saved successfully.',
      });
      
      fetchPortalConfig();
    } catch (error) {
      console.error('Error saving portal configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save portal configuration.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#101010] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">User Portal Settings</CardTitle>
        <CardDescription className="text-gray-400">
          Configure a custom portal for your application users to reset HWID and download your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="portal-enabled" className="text-white">Enable User Portal</Label>
            <p className="text-sm text-gray-400">Allow your users to access a custom portal page</p>
          </div>
          <Switch
            id="portal-enabled"
            checked={portalConfig.enabled}
            onCheckedChange={(checked) => setPortalConfig(prev => ({ ...prev, enabled: checked }))}
            disabled={loading}
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="custom-path" className="text-white">Custom Path</Label>
            <p className="text-sm text-gray-400 mb-2">
              Choose a unique identifier for your portal URL
            </p>
            <Input
              id="custom-path"
              placeholder="my-app"
              value={portalConfig.custom_path}
              onChange={(e) => setPortalConfig(prev => ({ ...prev, custom_path: e.target.value }))}
              disabled={loading}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
          </div>

          <div>
            <Label htmlFor="download-url" className="text-white">Download URL</Label>
            <p className="text-sm text-gray-400 mb-2">
              Enter the URL where users can download your application
            </p>
            <Input
              id="download-url"
              placeholder="https://example.com/download/my-app.exe"
              value={portalConfig.download_url}
              onChange={(e) => setPortalConfig(prev => ({ ...prev, download_url: e.target.value }))}
              disabled={loading}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
          </div>
        </div>

        {portalUrl && (
          <div className="p-4 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-semibold">Your Portal URL:</span>
            </p>
            <p className="text-sm text-blue-400 break-all">{portalUrl}</p>
            <p className="text-xs text-gray-400 mt-2">
              Users will be able to reset HWID and download your application from this URL
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={savePortalConfig} 
            disabled={loading || !portalConfig.custom_path.trim()}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserPortalSettings;
