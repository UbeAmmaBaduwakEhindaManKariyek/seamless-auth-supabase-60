
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { UserPortalConfig } from './types';

interface PortalFormProps {
  portalConfig: UserPortalConfig;
  setPortalConfig: React.Dispatch<React.SetStateAction<UserPortalConfig>>;
  loading: boolean;
  onSave: () => Promise<void>;
}

const PortalForm = ({ portalConfig, setPortalConfig, loading, onSave }: PortalFormProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="portal-enabled" className="text-white">Enable User Portal</Label>
          <p className="text-sm text-gray-400">Allow your users to access a custom portal page</p>
        </div>
        <Switch
          id="portal-enabled"
          checked={portalConfig.enabled}
          onCheckedChange={(checked) => setPortalConfig(prev => ({ ...prev, enabled: checked }))}
          disabled={loading}
        />
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="app-name" className="text-white">Application Name</Label>
          <p className="text-sm text-gray-400 mb-2">
            This will be displayed as the title on your portal page
          </p>
          <Input
            id="app-name"
            placeholder="My Application"
            value={portalConfig.application_name || ''}
            onChange={(e) => setPortalConfig(prev => ({ ...prev, application_name: e.target.value }))}
            disabled={loading}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
          />
        </div>

        <div>
          <Label htmlFor="custom-path" className="text-white">Custom Path</Label>
          <p className="text-sm text-gray-400 mb-2">
            Choose a unique identifier for your portal URL
          </p>
          <Input
            id="custom-path"
            placeholder="my-app"
            value={portalConfig.custom_path}
            onChange={(e) => setPortalConfig(prev => ({ ...prev, custom_path: e.target.value }))}
            disabled={loading}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
          />
        </div>

        <div>
          <Label htmlFor="download-url" className="text-white">Download URL</Label>
          <p className="text-sm text-gray-400 mb-2">
            Enter the URL where users can download your application
          </p>
          <Input
            id="download-url"
            placeholder="https://example.com/download/my-app.exe"
            value={portalConfig.download_url}
            onChange={(e) => setPortalConfig(prev => ({ ...prev, download_url: e.target.value }))}
            disabled={loading}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={onSave} 
          disabled={loading || !portalConfig.custom_path.trim()}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};

export default PortalForm;
