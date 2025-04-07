
import React from 'react';

interface PortalUrlDisplayProps {
  portalUrl: string;
}

const PortalUrlDisplay = ({ portalUrl }: PortalUrlDisplayProps) => {
  if (!portalUrl) return null;
  
  return (
    <div className="p-4 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
      <p className="text-sm text-gray-300 mb-2">
        <span className="font-semibold">Your Portal URL:</span>
      </p>
      <p className="text-sm text-blue-400 break-all">{portalUrl}</p>
      <p className="text-xs text-gray-400 mt-2">
        Users can register, login, reset HWID, and download your application from this URL
      </p>
    </div>
  );
};

export default PortalUrlDisplay;
