
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// This component will redirect from the old /portal/ URLs to the new /panel/ URLs
const UserPortalRedirect: React.FC = () => {
  const { username, custom_path } = useParams<{ username: string; custom_path: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (username && custom_path) {
      navigate(`/panel/${username}/${custom_path}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [username, custom_path, navigate]);

  return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
};

export default UserPortalRedirect;
