
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PortalSettings } from '@/types/auth';
import { Json } from '@/integrations/supabase/types';
import { UserPortalConfig } from './types';

export const usePortalConfig = () => {
  const { toast } = useToast();
  const { user, isConnected } = useAuth();
  const [portalConfig, setPortalConfig] = useState<UserPortalConfig>({
    enabled: false,
    custom_path: '',
    download_url: '',
    application_name: '',
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
      // First try to get from user_portal_config table
      const { data: portalData, error: portalError } = await supabase
        .from('user_portal_config')
        .select('*')
        .eq('username', user.username)
        .maybeSingle();

      if (portalError) {
        console.error('Error fetching from user_portal_config:', portalError);
      }

      if (portalData) {
        // If found in user_portal_config, use that data
        setPortalConfig({
          id: portalData.id,
          enabled: portalData.enabled,
          custom_path: portalData.custom_path,
          download_url: portalData.download_url || '',
          application_name: portalData.application_name || '',
          created_at: portalData.created_at,
          username: portalData.username
        });
      } else {
        // If not found in user_portal_config, check web_login_regz for portal settings
        const { data: userData, error: userError } = await supabase
          .from('web_login_regz')
          .select('*')
          .eq('username', user.username)
          .maybeSingle();

        if (userError) {
          throw userError;
        }

        if (userData) {
          // Convert the raw data with portal_settings to our expected types
          // Handle the case where portal_settings might be null or have a different structure
          const portalSettings = userData.portal_settings as unknown as PortalSettings;
          
          if (portalSettings && typeof portalSettings === 'object') {
            setPortalConfig({
              enabled: portalSettings.enabled || false,
              custom_path: portalSettings.custom_path || '',
              download_url: portalSettings.download_url || '',
              application_name: portalSettings.application_name || '',
              username: user.username
            });
          }
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
      const portalSettings: PortalSettings = {
        enabled: portalConfig.enabled,
        custom_path: portalConfig.custom_path.trim(),
        download_url: portalConfig.download_url.trim(),
        application_name: portalConfig.application_name?.trim() || '',
      };

      console.log('Saving portal data:', portalSettings);

      // Save to both user_portal_config for backward compatibility
      // and to web_login_regz for the integrated approach
      
      // 1. First save to user_portal_config
      let response;
      
      if (portalConfig.id) {
        response = await supabase
          .from('user_portal_config')
          .update({
            username: user.username,
            enabled: portalConfig.enabled,
            custom_path: portalConfig.custom_path.trim(),
            download_url: portalConfig.download_url.trim(),
            application_name: portalConfig.application_name?.trim() || '',
          })
          .eq('id', portalConfig.id);
      } else {
        response = await supabase
          .from('user_portal_config')
          .insert({
            username: user.username,
            enabled: portalConfig.enabled,
            custom_path: portalConfig.custom_path.trim(),
            download_url: portalConfig.download_url.trim(),
            application_name: portalConfig.application_name?.trim() || '',
          });
      }

      if (response.error) {
        console.error('Error from Supabase (user_portal_config):', response.error);
      }

      // 2. Then update web_login_regz with the portal settings
      // Cast the portalSettings to Json type expected by Supabase
      const { error: updateError } = await supabase
        .from('web_login_regz')
        .update({
          portal_settings: portalSettings as unknown as Json
        })
        .eq('username', user.username);

      if (updateError) {
        console.error('Error updating web_login_regz:', updateError);
        throw updateError;
      }

      toast({
        title: 'Success',
        description: 'User portal configuration saved successfully.',
      });
      
      fetchPortalConfig(); // Refresh the data
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

  return {
    portalConfig,
    setPortalConfig,
    loading,
    portalUrl,
    savePortalConfig
  };
};
