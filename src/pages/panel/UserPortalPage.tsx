
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, RefreshCw, AlertCircle, LogIn } from 'lucide-react';
import { UserPortalConfig } from '@/components/settings/portal/types';
import { Json } from '@/integrations/supabase/types';

const UserPortalPage: React.FC = () => {
  const { username, custom_path } = useParams<{ username: string; custom_path: string }>();
  const [loading, setLoading] = useState(true);
  const [portalConfig, setPortalConfig] = useState<UserPortalConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchPortalConfig = async () => {
      if (!username || !custom_path) {
        setError("Invalid URL parameters");
        setLoading(false);
        return;
      }
      
      try {
        console.log(`Fetching portal config for ${username}/${custom_path}`);
        
        // First try to find the portal config in the dedicated table
        const { data: portalData, error: portalError } = await supabase
          .from('user_portal_config')
          .select('*')
          .eq('username', username)
          .eq('custom_path', custom_path)
          .eq('enabled', true)
          .maybeSingle();
          
        if (portalError) {
          console.error("Error fetching portal config:", portalError);
          throw new Error("Failed to fetch portal configuration");
        }
        
        if (portalData) {
          console.log("Found portal config in dedicated table:", portalData);
          setPortalConfig(portalData);
          setLoading(false);
          return;
        }
        
        // If not found in the dedicated table, try to find in web_login_regz
        console.log("Portal config not found in dedicated table, checking web_login_regz");
        const { data: userData, error: userError } = await supabase
          .from('web_login_regz')
          .select('username, portal_settings')
          .eq('username', username)
          .maybeSingle();
          
        if (userError) {
          console.error("Error fetching user data:", userError);
          throw new Error("Failed to fetch user data");
        }
        
        if (userData && userData.portal_settings) {
          const settings = userData.portal_settings;
          
          // Type check and safely access the portal_settings properties
          if (
            typeof settings === 'object' && 
            settings !== null &&
            !Array.isArray(settings) &&
            'custom_path' in settings &&
            'enabled' in settings &&
            'download_url' in settings &&
            'application_name' in settings
          ) {
            // Now TypeScript knows these properties exist
            const typedSettings = settings as {
              custom_path: string;
              enabled: boolean;
              download_url: string;
              application_name: string;
            };
            
            // Check if this is the correct portal path
            if (typedSettings.custom_path === custom_path) {
              console.log("Found portal config in web_login_regz:", typedSettings);
              setPortalConfig({
                enabled: typedSettings.enabled,
                custom_path: typedSettings.custom_path,
                download_url: typedSettings.download_url,
                application_name: typedSettings.application_name,
                username: username
              });
            } else {
              throw new Error("Portal not found");
            }
          } else {
            throw new Error("Invalid portal configuration format");
          }
        } else {
          throw new Error("Portal configuration not found");
        }
      } catch (err) {
        console.error("Error in fetchPortalConfig:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortalConfig();
  }, [username, custom_path]);
  
  const handleDownload = () => {
    if (portalConfig?.download_url) {
      window.location.href = portalConfig.download_url;
      
      toast({
        title: "Download Started",
        description: `${portalConfig.application_name} download has started.`,
      });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#101010] border-[#2a2a2a]">
          <CardHeader className="space-y-2">
            <Skeleton className="h-8 w-3/4 bg-[#2a2a2a]" />
            <Skeleton className="h-4 w-full bg-[#2a2a2a]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full bg-[#2a2a2a]" />
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !portalConfig) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#101010] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-xl text-red-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Portal Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="bg-red-900/20 border-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error || "The requested portal could not be found."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a] text-white" asChild>
              <Link to="/">
                <LogIn className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#101010] border-[#2a2a2a]">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{portalConfig.application_name}</CardTitle>
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://github.com/${username}.png`} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <CardDescription>
            Download portal for {portalConfig.application_name} by {username}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            This is the official download portal for {portalConfig.application_name}.
            Click the button below to download the latest version.
          </p>
          <Button 
            onClick={handleDownload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download {portalConfig.application_name}
          </Button>
        </CardContent>
        <CardFooter className="text-xs text-gray-500 justify-center">
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserPortalPage;
