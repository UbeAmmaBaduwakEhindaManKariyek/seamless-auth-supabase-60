
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PortalUrlDisplayProps {
  portalUrl: string;
}

const PortalUrlDisplay = ({ portalUrl }: PortalUrlDisplayProps) => {
  const [copied, setCopied] = useState(false);
  
  if (!portalUrl) return null;
  
  // Transform the URL to use the new panel path structure
  const panelUrl = portalUrl.replace('/portal/', '/panel/');
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(panelUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="p-4 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-300">Your Portal URL:</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 bg-[#252525] hover:bg-[#303030] border-[#2a2a2a]"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-sm text-blue-400 break-all">{panelUrl}</p>
      <p className="text-xs text-gray-400 mt-2">
        Users can register, login, reset HWID, and download your application from this URL
      </p>
    </div>
  );
};

export default PortalUrlDisplay;
