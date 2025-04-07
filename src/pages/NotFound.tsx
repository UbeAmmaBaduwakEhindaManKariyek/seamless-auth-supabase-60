
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PortalSettings } from "@/types/auth";

interface PortalConfig {
  username: string;
  portal_settings: PortalSettings;
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPortalPage, setIsPortalPage] = useState(false);
  const [portalDetails, setPortalDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("404 Error: User attempted to access non-existent route:", location.pathname);

    // Check if this is a portal page
    const pathSegments = location.pathname.split('/');
    if (pathSegments.length >= 3 && pathSegments[1] === 'portal') {
      const username = pathSegments[2];
      const customPath = pathSegments[3] || '';
      console.log(`Checking if this is a portal path: ${username}/${customPath}`);
      checkPortalPath(username, customPath);
    } else {
      setLoading(false);
    }
  }, [location.pathname]);

  const checkPortalPath = async (username: string, customPath: string) => {
    setLoading(true);
    try {
      console.log(`Checking portal path: ${username}/${customPath}`);
      
      // First check in user_portal_config table
      const { data: portalData, error: portalError } = await supabase
        .from('user_portal_config')
        .select('*')
        .eq('username', username)
        .eq('custom_path', customPath)
        .eq('enabled', true)
        .maybeSingle();
        
      if (portalData) {
        console.log('Portal found in user_portal_config:', portalData);
        // Portal found in user_portal_config
        setIsPortalPage(true);
        setPortalDetails(portalData);
        
        // Always redirect to the standardized URL format
        navigate(`/portal/${username}/${customPath}`, { replace: true });
        return;
      }
      
      console.log('Portal not found in user_portal_config, checking web_login_regz');
      
      // If not found in user_portal_config, check web_login_regz table
      const { data: userData, error: userError } = await supabase
        .from('web_login_regz')
        .select('username, portal_settings')
        .eq('username', username)
        .maybeSingle();
        
      if (userError) {
        console.error('Error fetching user data:', userError);
        setIsPortalPage(false);
        setPortalDetails(null);
        setLoading(false);
        return;
      }
      
      console.log('User data from web_login_regz:', userData);
      
      // Convert portal_settings to proper type and check if valid
      if (userData && userData.portal_settings) {
        // Safely cast to the correct type
        let portalSettings: PortalSettings;
        
        try {
          portalSettings = userData.portal_settings as unknown as PortalSettings;
          console.log('Portal settings from web_login_regz:', portalSettings);
          
          if (portalSettings && 
              typeof portalSettings === 'object' &&
              portalSettings.custom_path === customPath &&
              portalSettings.enabled === true) {
            
            console.log('Valid portal found in web_login_regz');
            // Portal found in web_login_regz portal_settings
            setIsPortalPage(true);
            setPortalDetails({
              ...portalSettings,
              username: userData.username
            });
            
            // Always redirect to the standardized URL format
            navigate(`/portal/${username}/${customPath}`, { replace: true });
            return;
          } else {
            console.log('Portal settings found but not valid or enabled');
          }
        } catch (error) {
          console.error('Error parsing portal settings:', error);
        }
      }
      
      // Portal not found in either table or is disabled
      setIsPortalPage(false);
      setPortalDetails(null);
    } catch (error) {
      console.error('Error checking portal path:', error);
      setIsPortalPage(false);
      setPortalDetails(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center p-6 max-w-md w-full bg-[#101010] border border-[#2a2a2a] rounded-lg">
        <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-gray-400 mb-4">Oops! Page not found</p>
        
        {isPortalPage ? (
          <div className="space-y-4">
            <p className="text-gray-400">The portal you're trying to access is not available.</p>
            <p className="text-sm text-gray-500">This could be because the portal is disabled or the URL is incorrect.</p>
          </div>
        ) : (
          <p className="text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
        )}
        
        <div className="mt-6">
          <Button 
            onClick={() => navigate("/")} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
