
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const [appVersion, setAppVersion] = useState('1.0');
  const [safetyStatus, setSafetyStatus] = useState('Safe');
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome to the dashboard!');
  const [loginMessage, setLoginMessage] = useState('Please login to continue');
  
  const { toast } = useToast();
  
  const handleSaveAppSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Application settings have been updated successfully",
    });
  };
  
  const handleSaveMessages = () => {
    toast({
      title: "Messages Saved",
      description: "Application messages have been updated successfully",
    });
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure application settings and messages</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#101010] border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Application Settings</CardTitle>
            <CardDescription className="text-gray-400">
              Configure general application settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="appVersion" className="text-sm font-medium text-gray-300">Application Version</label>
              <Input 
                id="appVersion" 
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="safetyStatus" className="text-sm font-medium text-gray-300">Safety Status</label>
              <Select value={safetyStatus} onValueChange={setSafetyStatus}>
                <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectItem value="Safe">Safe</SelectItem>
                  <SelectItem value="Detected">Detected</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="websiteUrl" className="text-sm font-medium text-gray-300">Website URL</label>
              <Input 
                id="websiteUrl" 
                placeholder="https://example.com" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="accountUrl" className="text-sm font-medium text-gray-300">Account URL</label>
              <Input 
                id="accountUrl" 
                placeholder="https://example.com/account" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveAppSettings} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Save Application Settings
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-[#101010] border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Message Settings</CardTitle>
            <CardDescription className="text-gray-400">
              Configure application messages and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="welcomeMessage" className="text-sm font-medium text-gray-300">Welcome Message</label>
              <Textarea 
                id="welcomeMessage" 
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="bg-[#1a1a1a] border-gray-700 text-white min-h-[100px]"
              />
              <p className="text-xs text-gray-400">This message is displayed when users first open the application.</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="loginMessage" className="text-sm font-medium text-gray-300">Login Message</label>
              <Textarea 
                id="loginMessage" 
                value={loginMessage}
                onChange={(e) => setLoginMessage(e.target.value)}
                className="bg-[#1a1a1a] border-gray-700 text-white min-h-[100px]"
              />
              <p className="text-xs text-gray-400">This message is displayed on the login screen.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveMessages} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Save Messages
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
