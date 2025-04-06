
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPortalPage, setIsPortalPage] = useState(false);
  const [portalDetails, setPortalDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Check if this is a portal page
    const pathSegments = location.pathname.split('/');
    if (pathSegments.length >= 4 && pathSegments[1] === 'portal') {
      checkPortalPath(pathSegments[2], pathSegments[3]);
    } else {
      setLoading(false);
    }
  }, [location.pathname]);

  const checkPortalPath = async (username: string, customPath: string) => {
    setLoading(true);
    try {
      // Check if this portal exists
      const { data, error } = await supabase
        .from('user_portal_config')
        .select('*')
        .eq('username', username)
        .eq('custom_path', customPath)
        .eq('enabled', true)
        .maybeSingle();

      if (data) {
        setIsPortalPage(true);
        setPortalDetails(data);
        
        // If portal exists, redirect to the correct URL format
        navigate(`/portal/${username}/${customPath}`);
      }
    } catch (error) {
      console.error('Error checking portal path:', error);
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
