import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getActiveClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AppSettings {
  id?: number;
  version: string;
  website_url: string;
  account_url: string;
  safety_status: string;
}

interface Message {
  id?: number;
  type: string;
  text: string;
}

interface Version {
  id: number;
  version: string;
  created_at: string;
}

const SettingsPage: React.FC = () => {
  const [appSettings, setAppSettings] = useState<AppSettings>({
    version: '1.0',
    website_url: 'https://example.com',
    account_url: 'https://example.com/account',
    safety_status: 'Safe'
  });
  
  const [messages, setMessages] = useState<{[key: string]: string}>({
    welcome: 'Welcome to the dashboard!',
    login: 'Please login to continue'
  });
  
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingMessages, setIsSavingMessages] = useState(false);
  
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  
  const { toast } = useToast();
  const { isConnected } = useAuth();
  
  useEffect(() => {
    const fetchAppSettings = async () => {
      if (!isConnected) return;
      
      setIsLoadingSettings(true);
      try {
        const client = getActiveClient();
        const { data, error } = await client
          .from('regz_cheat_status')
          .select('*')
          .order('id', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error("Error fetching app settings:", error);
          toast({
            title: "Error",
            description: "Failed to load application settings",
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setAppSettings({
            id: data[0].id,
            version: data[0].version,
            website_url: data[0].website_url,
            account_url: data[0].account_url,
            safety_status: data[0].safety_status
          });
        }
      } catch (error) {
        console.error("Failed to fetch app settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    
    fetchAppSettings();
  }, [isConnected, toast]);
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!isConnected) return;
      
      setIsLoadingMessages(true);
      try {
        const client = getActiveClient();
        const { data, error } = await client
          .from('messages')
          .select('*');
          
        if (error) {
          console.error("Error fetching messages:", error);
          toast({
            title: "Error",
            description: "Failed to load message settings",
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          const messagesObj: {[key: string]: string} = {};
          data.forEach((msg) => {
            messagesObj[msg.type] = msg.text;
          });
          
          setMessages({
            welcome: messagesObj.welcome || 'Welcome to the dashboard!',
            login: messagesObj.login || 'Please login to continue'
          });
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    fetchMessages();
  }, [isConnected, toast]);
  
  useEffect(() => {
    const fetchVersions = async () => {
      if (!isConnected) return;
      
      setIsLoadingVersions(true);
      try {
        const client = getActiveClient();
        const { data, error } = await client
          .from('app_version')
          .select('*')
          .order('id', { ascending: false });
          
        if (error) {
          console.error("Error fetching app versions:", error);
          toast({
            title: "Error",
            description: "Failed to load application versions",
            variant: "destructive"
          });
          return;
        }
        
        if (data) {
          setVersions(data);
        }
      } catch (error) {
        console.error("Failed to fetch app versions:", error);
      } finally {
        setIsLoadingVersions(false);
      }
    };
    
    fetchVersions();
  }, [isConnected, toast]);
  
  const handleAppSettingsChange = (key: keyof AppSettings, value: string) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleMessageChange = (key: string, value: string) => {
    setMessages(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSaveAppSettings = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Supabase first",
        variant: "destructive"
      });
      return;
    }
    
    setIsSavingSettings(true);
    try {
      const client = getActiveClient();
      
      if (appSettings.id) {
        const { error } = await client
          .from('regz_cheat_status')
          .update({
            version: appSettings.version,
            website_url: appSettings.website_url,
            account_url: appSettings.account_url,
            safety_status: appSettings.safety_status
          })
          .eq('id', appSettings.id);
          
        if (error) {
          console.error("Error updating app settings:", error);
          toast({
            title: "Error",
            description: "Failed to update application settings",
            variant: "destructive"
          });
          return;
        }
      } else {
        const { error } = await client
          .from('regz_cheat_status')
          .insert({
            version: appSettings.version,
            website_url: appSettings.website_url,
            account_url: appSettings.account_url,
            safety_status: appSettings.safety_status
          });
          
        if (error) {
          console.error("Error creating app settings:", error);
          toast({
            title: "Error",
            description: "Failed to create application settings",
            variant: "destructive"
          });
          return;
        }
      }
      
      const { error: versionError } = await client
        .from('app_version')
        .upsert({
          version: appSettings.version,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'version'
        });
        
      if (versionError) {
        console.error("Error updating app version:", versionError);
      } else {
        const { data } = await client
          .from('app_version')
          .select('*')
          .order('id', { ascending: false });
          
        if (data) {
          setVersions(data);
        }
      }
      
      toast({
        title: "Settings Saved",
        description: "Application settings have been updated successfully",
      });
    } catch (error) {
      console.error("Failed to save app settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSavingSettings(false);
    }
  };
  
  const handleSaveMessages = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Supabase first",
        variant: "destructive"
      });
      return;
    }
    
    setIsSavingMessages(true);
    try {
      const client = getActiveClient();
      
      const { error: welcomeError } = await client
        .from('messages')
        .upsert({
          type: 'welcome',
          text: messages.welcome
        }, {
          onConflict: 'type'
        });
        
      if (welcomeError) {
        console.error("Error updating welcome message:", welcomeError);
        toast({
          title: "Error",
          description: "Failed to update welcome message",
          variant: "destructive"
        });
        return;
      }
      
      const { error: loginError } = await client
        .from('messages')
        .upsert({
          type: 'login',
          text: messages.login
        }, {
          onConflict: 'type'
        });
        
      if (loginError) {
        console.error("Error updating login message:", loginError);
        toast({
          title: "Error",
          description: "Failed to update login message",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Messages Saved",
        description: "Application messages have been updated successfully",
      });
    } catch (error) {
      console.error("Failed to save messages:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSavingMessages(false);
    }
  };
  
  const handleAddVersion = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Supabase first",
        variant: "destructive"
      });
      return;
    }
    
    if (!newVersion.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid version",
        variant: "destructive"
      });
      return;
    }
    
    setIsAddingVersion(true);
    try {
      const client = getActiveClient();
      
      const { error } = await client
        .from('app_version')
        .insert({
          version: newVersion,
          created_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error adding app version:", error);
        toast({
          title: "Error",
          description: "Failed to add new version",
          variant: "destructive"
        });
        return;
      }
      
      const { data } = await client
        .from('app_version')
        .select('*')
        .order('id', { ascending: false });
        
      if (data) {
        setVersions(data);
      }
      
      toast({
        title: "Version Added",
        description: `Version ${newVersion} has been added successfully`,
      });
      
      setNewVersion('');
      setIsVersionDialogOpen(false);
    } catch (error) {
      console.error("Failed to add version:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAddingVersion(false);
    }
  };
  
  const handleSelectVersion = (version: string) => {
    setAppSettings(prev => ({ ...prev, version }));
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
            {isLoadingSettings ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-gray-400">Loading settings...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="appVersion" className="text-sm font-medium text-gray-300">Application Version</label>
                  <Input 
                    id="appVersion" 
                    value={appSettings.version}
                    onChange={(e) => handleAppSettingsChange('version', e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="safetyStatus" className="text-sm font-medium text-gray-300">Safety Status</label>
                  <Select 
                    value={appSettings.safety_status} 
                    onValueChange={(value) => handleAppSettingsChange('safety_status', value)}
                  >
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
                    value={appSettings.website_url}
                    onChange={(e) => handleAppSettingsChange('website_url', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="accountUrl" className="text-sm font-medium text-gray-300">Account URL</label>
                  <Input 
                    id="accountUrl" 
                    placeholder="https://example.com/account" 
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    value={appSettings.account_url}
                    onChange={(e) => handleAppSettingsChange('account_url', e.target.value)}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveAppSettings} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!isConnected || isLoadingSettings || isSavingSettings}
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : "Save Application Settings"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-[#101010] border-gray-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold text-white">Version Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage application versions
                </CardDescription>
              </div>
              <Button 
                onClick={() => setIsVersionDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Version
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingVersions ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-gray-400">Loading versions...</span>
              </div>
            ) : (
              <div className="border border-gray-800 rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#0a0a0a]">
                    <TableRow className="hover:bg-[#0a0a0a] border-gray-800">
                      <TableHead className="text-gray-300">Version</TableHead>
                      <TableHead className="text-gray-300">Created At</TableHead>
                      <TableHead className="text-gray-300 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.length === 0 ? (
                      <TableRow className="hover:bg-[#151515] border-gray-800">
                        <TableCell colSpan={3} className="text-center py-4 text-gray-400">
                          No versions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      versions.map((version) => (
                        <TableRow key={version.id} className="hover:bg-[#151515] border-gray-800">
                          <TableCell className="font-medium text-white">{version.version}</TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(version.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-blue-900 hover:text-white"
                              onClick={() => handleSelectVersion(version.version)}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-[#101010] border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Message Settings</CardTitle>
            <CardDescription className="text-gray-400">
              Configure application messages and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-gray-400">Loading messages...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="welcomeMessage" className="text-sm font-medium text-gray-300">Welcome Message</label>
                  <Textarea 
                    id="welcomeMessage" 
                    value={messages.welcome}
                    onChange={(e) => handleMessageChange('welcome', e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white min-h-[100px]"
                  />
                  <p className="text-xs text-gray-400">This message is displayed when users first open the application.</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="loginMessage" className="text-sm font-medium text-gray-300">Login Message</label>
                  <Textarea 
                    id="loginMessage" 
                    value={messages.login}
                    onChange={(e) => handleMessageChange('login', e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white min-h-[100px]"
                  />
                  <p className="text-xs text-gray-400">This message is displayed on the login screen.</p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveMessages} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!isConnected || isLoadingMessages || isSavingMessages}
            >
              {isSavingMessages ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : "Save Messages"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="bg-[#101010] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Version</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter a new version number for the application
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="newVersion" className="text-sm font-medium text-gray-300">Version Number</label>
              <Input 
                id="newVersion" 
                placeholder="e.g. 1.2.0" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsVersionDialogOpen(false)}
              className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddVersion}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!newVersion.trim() || isAddingVersion}
            >
              {isAddingVersion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : 'Add Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
