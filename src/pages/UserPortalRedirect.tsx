
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';

const UserPortalRedirect: React.FC = () => {
  const { username, custom_path } = useParams<{ username: string; custom_path: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      if (!username || !custom_path) {
        setError("Invalid URL parameters");
        return;
      }
      
      // Get the rest of the path after /portal/:username/:custom_path
      const restPath = location.pathname.replace(`/portal/${username}/${custom_path}`, '');
      
      // Redirect to the new panel URL format, maintaining any additional path segments
      const newPath = `/panel/${username}/${custom_path}${restPath}${location.search}${location.hash}`;
      console.log(`Redirecting from old portal URL to: ${newPath}`);
      navigate(newPath, { replace: true });
    } catch (err) {
      console.error("Error in redirect:", err);
      setError("Failed to redirect. Please try again.");
    }
  }, [username, custom_path, location, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <h2 className="text-xl text-red-500">Redirect Error: {error}</h2>
          <Link to="/" className="text-blue-500 hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

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
