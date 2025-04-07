
import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const UserPortalRedirect: React.FC = () => {
  const { username, custom_path } = useParams<{ username: string; custom_path: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get the rest of the path after /portal/:username/:custom_path
    const restPath = location.pathname.replace(`/portal/${username}/${custom_path}`, '');
    
    // Redirect to the new panel URL format, maintaining any additional path segments
    const newPath = `/panel/${username}/${custom_path}${restPath}${location.search}${location.hash}`;
    console.log(`Redirecting from old portal URL to: ${newPath}`);
    navigate(newPath, { replace: true });
  }, [username, custom_path, location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <h2 className="text-xl text-white">Redirecting to new portal URL...</h2>
      </div>
    </div>
  );
};

export default UserPortalRedirect;
