
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PortalSettings } from "@/types/auth";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("404 Error: User attempted to access non-existent route:", location.pathname);

    // Check if this is a portal path
    const pathSegments = location.pathname.split('/');
    if (pathSegments.length >= 3 && pathSegments[1] === 'portal') {
      const username = pathSegments[2];
      const customPath = pathSegments[3] || '';
      console.log(`Detected portal path: ${username}/${customPath}`);
      
      // Always redirect to the standardized URL format with proper segments
      if (username && customPath) {
        navigate(`/portal/${username}/${customPath}`, { replace: true });
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [location.pathname, navigate]);

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
        <p className="text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
        
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
