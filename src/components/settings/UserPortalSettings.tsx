
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PortalForm from './portal/PortalForm';
import PortalUrlDisplay from './portal/PortalUrlDisplay';
import { usePortalConfig } from './portal/usePortalConfig';

const UserPortalSettings = () => {
  const { portalConfig, setPortalConfig, loading, portalUrl, savePortalConfig } = usePortalConfig();

  return (
    <Card className="bg-[#101010] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">User Portal Settings</CardTitle>
        <CardDescription className="text-gray-400">
          Configure a custom portal for your application users to reset HWID and download your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <PortalForm 
          portalConfig={portalConfig} 
          setPortalConfig={setPortalConfig} 
          loading={loading} 
          onSave={savePortalConfig} 
        />
        
        <PortalUrlDisplay portalUrl={portalUrl} />
      </CardContent>
    </Card>
  );
};

export default UserPortalSettings;
