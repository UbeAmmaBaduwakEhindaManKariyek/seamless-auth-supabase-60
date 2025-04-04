
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Loader2, CheckCircle, RefreshCw, Pause, Play, Trash2, Plus, User, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createCustomClient, testConnection } from '@/integrations/supabase/client';
import ApplicationCredentials from '@/components/applications/ApplicationCredentials';
import CreateAppModal from '@/components/applications/CreateAppModal';
import { Application } from '@/types/applications';
import { Link } from 'react-router-dom';

const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Create a Supabase client using the user's credentials
  const userSupabase = user?.supabaseUrl && user?.supabaseKey 
    ? createCustomClient(user.supabaseUrl, user.supabaseKey)
    : null;

  // Check connection first, then fetch applications if connection is good
  const checkConnectionAndFetch = useCallback(async () => {
    if (!userSupabase || !user) {
      setConnectionError("No valid Supabase connection found. Please check your credentials in settings.");
      setIsLoading(false);
      return false;
    }

    setIsCheckingConnection(true);
    try {
      const isConnected = await testConnection(userSupabase);
      
      if (!isConnected) {
        setConnectionError("Failed to connect to your Supabase project. The service might be down or your credentials may be invalid.");
        setIsLoading(false);
        setIsCheckingConnection(false);
        return false;
      }
      
      setConnectionError(null);
      setIsCheckingConnection(false);
      return true;
    } catch (error) {
      console.error("Connection test error:", error);
      setConnectionError("An unexpected error occurred while testing the connection.");
      setIsLoading(false);
      setIsCheckingConnection(false);
      return false;
    }
  }, [userSupabase, user]);

  useEffect(() => {
    const initPage = async () => {
      if (await checkConnectionAndFetch()) {
        fetchApplications();
      }
    };
    
    initPage();
  }, [userSupabase, retryCount, checkConnectionAndFetch]);

  const fetchApplications = async () => {
    if (!userSupabase) {
      setConnectionError("Cannot connect to your Supabase project. Please check your credentials in settings.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setConnectionError(null);
      
      // Check if the applications_registry table exists in the user's Supabase
      const { error: checkTableError } = await userSupabase
        .from('applications_registry')
        .select('count', { count: 'exact', head: true });
        
      if (checkTableError) {
        console.error("Error checking applications_registry table:", checkTableError);
        
        // Attempt to create the table if it doesn't exist
        try {
          const createTableSql = `
            CREATE TABLE IF NOT EXISTS public.applications_registry (
              id BIGSERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              owner_id TEXT NOT NULL,
              app_secret TEXT NOT NULL,
              version TEXT NOT NULL,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMPTZ DEFAULT now(),
              updated_at TIMESTAMPTZ DEFAULT now()
            )
          `;
          
          const { error: createError } = await userSupabase.rpc('execute_sql', { 
            sql_query: createTableSql 
          });
          
          if (createError) {
            console.error("Failed to create applications_registry table:", createError);
            if (createError.message.includes("Could not find the function")) {
              setConnectionError("Your Supabase project doesn't have the required SQL execution function. Please ensure you have the correct permissions or contact support.");
            } else {
              setConnectionError("Failed to create necessary tables in your Supabase project. Please ensure you have the right permissions.");
            }
            setIsLoading(false);
            return;
          }
          
          toast({
            title: "Applications table created",
            description: "A new applications registry has been created in your Supabase project.",
          });
        } catch (createErr) {
          console.error("Error creating table:", createErr);
          setConnectionError("Failed to create necessary tables in your Supabase project.");
          setIsLoading(false);
          return;
        }
      }

      // Fetch applications from the user's Supabase
      const { data, error } = await userSupabase
        .from('applications_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        if (error.message.includes("connect error")) {
          setConnectionError("Connection to Supabase failed. The service might be down or unreachable.");
        } else {
          setConnectionError(`Failed to fetch applications: ${error.message}`);
        }
        setIsLoading(false);
        return;
      }

      setApplications(data as Application[] || []);
      if (data && data.length > 0 && !selectedApp) {
        setSelectedApp(data[0] as Application);
      }
    } catch (err) {
      console.error("Error:", err);
      setConnectionError(`An unexpected error occurred: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSecret = async (appId: number) => {
    if (!userSupabase) {
      toast({
        title: "Connection error",
        description: "Cannot connect to your Supabase project",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setRefreshing(true);
      const { data, error } = await userSupabase
        .from('applications_registry')
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
        prev.map(app => app.id === appId ? data as Application : app)
      );
      if (selectedApp?.id === appId) setSelectedApp(data as Application);
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
    if (!userSupabase) {
      toast({
        title: "Connection error",
        description: "Cannot connect to your Supabase project",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await userSupabase
        .from('applications_registry')
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
        prev.map(app => app.id === appId ? data as Application : app)
      );
      if (selectedApp?.id === appId) setSelectedApp(data as Application);
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
    if (!userSupabase) {
      toast({
        title: "Connection error",
        description: "Cannot connect to your Supabase project",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await userSupabase
        .from('applications_registry')
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
    if (!userSupabase) {
      toast({
        title: "Connection error",
        description: "Cannot connect to your Supabase project",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreatingApp(true);
      
      if (!user || !user.username) {
        toast({
          title: "User information missing",
          description: "Unable to create application without user data",
          variant: "destructive",
        });
        return;
      }

      const newApp: Omit<Application, 'id'> = {
        name,
        version,
        owner_id: user.username,
        app_secret: crypto.randomUUID(),
        is_active: true,
      };

      const { data, error } = await userSupabase
        .from('applications_registry')
        .insert(newApp)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Application created",
        description: `'${name}' has been successfully created`,
      });
      
      setApplications(prev => [data as Application, ...prev]);
      setSelectedApp(data as Application);
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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    toast({
      title: "Retrying connection",
      description: "Attempting to reconnect to Supabase...",
    });
  };

  // Display loading state with an appropriate message
  if (isLoading) {
    return (
      <div className="container max-w-5xl pt-8">
        {user && (
          <Card className="mb-6 border-gray-800 bg-gray-900 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your account information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Username</p>
                  <p className="text-white font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">{user.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Account Type</p>
                  <p className="text-white font-medium">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.isAdmin ? 'bg-purple-600 text-purple-100' : 'bg-blue-600 text-blue-100'
                    }`}>
                      {user.isAdmin ? 'Administrator' : 'Regular User'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Supabase Connection</p>
                  <p className="text-white font-medium">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.supabaseUrl && user.supabaseKey ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                    }`}>
                      {isCheckingConnection ? 'Checking...' : (user.supabaseUrl && user.supabaseKey ? 'Connected' : 'Not Connected')}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <h1 className="text-3xl font-bold mb-6">Manage Applications</h1>
        
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
          <p className="text-lg text-gray-400 text-center">
            Connecting to Supabase and loading your applications...
          </p>
          <p className="text-sm text-gray-500 text-center max-w-md">
            This may take a moment if this is your first time accessing the applications or if we need to set up your database tables.
          </p>
        </div>
      </div>
    );
  }

  // Display connection error with retry option
  if (connectionError) {
    return (
      <div className="container max-w-5xl pt-8">
        {user && (
          <Card className="mb-6 border-gray-800 bg-gray-900 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your account information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Username</p>
                  <p className="text-white font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">{user.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Account Type</p>
                  <p className="text-white font-medium">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.isAdmin ? 'bg-purple-600 text-purple-100' : 'bg-blue-600 text-blue-100'
                    }`}>
                      {user.isAdmin ? 'Administrator' : 'Regular User'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Supabase Connection</p>
                  <p className="text-white font-medium">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-red-100">
                      Connection Failed
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <h1 className="text-3xl font-bold mb-6">Manage Applications</h1>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {connectionError}
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col items-center justify-center gap-4 p-8 border border-red-800 rounded-lg bg-red-950/30">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-center">Unable to Load Your Applications</h2>
          <p className="text-center text-gray-400 max-w-md">
            We couldn't connect to your Supabase project. Please check your connection settings and try again.
          </p>
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
            
            <Button 
              asChild
              variant="outline" 
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
            >
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Check Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl">
      {user && (
        <Card className="mb-6 border-gray-800 bg-gray-900 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>User Profile</CardTitle>
                <CardDescription className="text-gray-300">
                  Your account information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Username</p>
                <p className="text-white font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white font-medium">{user.email || "Not provided"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Account Type</p>
                <p className="text-white font-medium">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.isAdmin ? 'bg-purple-600 text-purple-100' : 'bg-blue-600 text-blue-100'
                  }`}>
                    {user.isAdmin ? 'Administrator' : 'Regular User'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Supabase Connection</p>
                <p className="text-white font-medium">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-600 text-green-100">
                    Connected
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <h1 className="text-3xl font-bold mb-6">Manage Applications</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Applications</h2>
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!userSupabase}
          >
            <Plus className="h-4 w-4" />
            Create Application
          </Button>
        </div>
        
        {!userSupabase ? (
          <Alert>
            <AlertTitle>No valid Supabase connection</AlertTitle>
            <AlertDescription>
              Please check your Supabase URL and API key in your account settings.
            </AlertDescription>
          </Alert>
        ) : applications.length === 0 ? (
          <Alert>
            <AlertTitle>No applications found</AlertTitle>
            <AlertDescription>
              You haven't created any applications yet. Click the "Create Application" button to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-gray-800">
              <CardHeader className="bg-gray-900 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle>Application Management</CardTitle>
                  {selectedApp && (
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        selectedApp.is_active 
                          ? 'bg-green-600 text-green-100' 
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
              <CardContent className="pt-6 bg-gray-900 text-white">
                <Tabs defaultValue={selectedApp?.id.toString() || "0"}>
                  <TabsList className="grid grid-cols-3 mb-6 bg-gray-800">
                    {applications.slice(0, 3).map(app => (
                      <TabsTrigger 
                        key={app.id} 
                        value={app.id.toString()}
                        onClick={() => setSelectedApp(app)}
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
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
              <CardFooter className="border-t border-gray-800 flex flex-wrap gap-2 justify-between bg-gray-900 text-white rounded-b-lg">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => selectedApp && refreshSecret(selectedApp.id)}
                    disabled={refreshing || !selectedApp}
                    className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  >
                    {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh Secret
                  </Button>
                  
                  {selectedApp && (
                    <Button 
                      variant="outline"
                      onClick={() => selectedApp && toggleAppStatus(selectedApp.id, selectedApp.is_active)}
                      className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
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
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Application
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            <Card className="bg-gray-900 text-white border-gray-800">
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
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4">Application Name</th>
                        <th className="text-left py-3 px-4">Version</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id} className="border-b border-gray-800">
                          <td className="py-3 px-4">{app.name}</td>
                          <td className="py-3 px-4">{app.version}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              app.is_active ? 'bg-green-600 text-green-100' : 'bg-gray-700 text-gray-200'
                            }`}>
                              {app.is_active ? 'Active' : 'Paused'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedApp(app)}
                              className={selectedApp?.id === app.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}
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
