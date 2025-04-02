
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Loader2, CheckCircle, RefreshCw, Pause, Play, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveClient } from '@/integrations/supabase/client';
import ApplicationCredentials from '@/components/applications/ApplicationCredentials';
import CreateAppModal from '@/components/applications/CreateAppModal';
import { Application } from '@/types/applications';

const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = getActiveClient();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        toast({
          title: "Failed to load applications",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setApplications(data || []);
      if (data && data.length > 0 && !selectedApp) {
        setSelectedApp(data[0]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSecret = async (appId: number) => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('applications')
        .update({ app_secret: crypto.randomUUID() })
        .eq('id', appId)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Secret refreshed",
        description: "Your application secret has been updated",
      });
      
      setApplications(prev => 
        prev.map(app => app.id === appId ? data : app)
      );
      if (selectedApp?.id === appId) setSelectedApp(data);
    } catch (err) {
      console.error("Error refreshing secret:", err);
      toast({
        title: "Failed to refresh secret",
        description: "An error occurred while refreshing the application secret",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const toggleAppStatus = async (appId: number, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ is_active: !currentStatus })
        .eq('id', appId)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: `Application ${!currentStatus ? "activated" : "paused"}`,
        description: `Your application has been ${!currentStatus ? "activated" : "paused"}`,
      });
      
      setApplications(prev => 
        prev.map(app => app.id === appId ? data : app)
      );
      if (selectedApp?.id === appId) setSelectedApp(data);
    } catch (err) {
      console.error("Error toggling app status:", err);
      toast({
        title: "Failed to update status",
        description: "An error occurred while updating the application status",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (appId: number) => {
    if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId);

      if (error) throw error;
      
      toast({
        title: "Application deleted",
        description: "Your application has been successfully deleted",
      });
      
      setApplications(prev => prev.filter(app => app.id !== appId));
      if (selectedApp?.id === appId) {
        const remainingApps = applications.filter(app => app.id !== appId);
        setSelectedApp(remainingApps.length > 0 ? remainingApps[0] : null);
      }
    } catch (err) {
      console.error("Error deleting application:", err);
      toast({
        title: "Failed to delete application",
        description: "An error occurred while deleting the application",
        variant: "destructive",
      });
    }
  };

  const handleCreateApp = async (name: string, version: string) => {
    try {
      setIsCreatingApp(true);
      const newApp = {
        name,
        version,
        owner_id: user?.id,
        app_secret: crypto.randomUUID(),
        is_active: true
      };

      const { data, error } = await supabase
        .from('applications')
        .insert(newApp)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Application created",
        description: `'${name}' has been successfully created`,
      });
      
      setApplications(prev => [data, ...prev]);
      setSelectedApp(data);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error creating application:", err);
      toast({
        title: "Failed to create application",
        description: "An error occurred while creating the application",
        variant: "destructive",
      });
    } finally {
      setIsCreatingApp(false);
    }
  };

  return (
    <div className="container max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Manage Applications</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Applications</h2>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Application
            </Button>
          </div>
          
          {applications.length === 0 ? (
            <Alert>
              <AlertTitle>No applications found</AlertTitle>
              <AlertDescription>
                You haven't created any applications yet. Click the "Create Application" button to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="bg-gray-800 text-white">
                  <div className="flex justify-between items-center">
                    <CardTitle>Application Management</CardTitle>
                    {selectedApp && (
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          selectedApp.is_active 
                            ? 'bg-green-700 text-green-100' 
                            : 'bg-gray-700 text-gray-200'
                        }`}>
                          {selectedApp.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-gray-300">
                    Configure and manage your application credentials
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue={selectedApp?.id.toString() || "0"}>
                    <TabsList className="grid grid-cols-3 mb-6">
                      {applications.slice(0, 3).map(app => (
                        <TabsTrigger 
                          key={app.id} 
                          value={app.id.toString()}
                          onClick={() => setSelectedApp(app)}
                        >
                          {app.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {applications.map(app => (
                      <TabsContent key={app.id} value={app.id.toString()}>
                        <ApplicationCredentials application={app} />
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
                <CardFooter className="border-t border-gray-700 flex flex-wrap gap-2 justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => selectedApp && refreshSecret(selectedApp.id)}
                      disabled={refreshing || !selectedApp}
                    >
                      {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Refresh Secret
                    </Button>
                    
                    {selectedApp && (
                      <Button 
                        variant="outline"
                        onClick={() => selectedApp && toggleAppStatus(selectedApp.id, selectedApp.is_active)}
                      >
                        {selectedApp.is_active ? 
                          <><Pause className="h-4 w-4 mr-2" /> Pause Application</> : 
                          <><Play className="h-4 w-4 mr-2" /> Activate Application</>
                        }
                      </Button>
                    )}
                  </div>
                  
                  {selectedApp && (
                    <Button 
                      variant="destructive"
                      onClick={() => selectedApp && deleteApplication(selectedApp.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Application
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              <Card className="bg-gray-800 text-white">
                <CardHeader>
                  <CardTitle>Application List</CardTitle>
                  <CardDescription className="text-gray-300">
                    All your registered applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4">Application Name</th>
                          <th className="text-left py-3 px-4">Version</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app.id} className="border-b border-gray-700">
                            <td className="py-3 px-4">{app.name}</td>
                            <td className="py-3 px-4">{app.version}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                app.is_active ? 'bg-green-700 text-green-100' : 'bg-gray-600 text-gray-200'
                              }`}>
                                {app.is_active ? 'Active' : 'Paused'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedApp(app)}
                                className={selectedApp?.id === app.id ? 'bg-blue-800' : ''}
                              >
                                {selectedApp?.id === app.id ? 'Selected' : 'Select'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      
      <CreateAppModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreate={handleCreateApp}
        isCreating={isCreatingApp}
      />
    </div>
  );
};

export default ApplicationsPage;
