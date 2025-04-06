
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Plus, Search, Loader2 } from 'lucide-react';
import CreateAppModal from '@/components/applications/CreateAppModal';
import ApplicationCredentials from '@/components/applications/ApplicationCredentials';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveClient } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Application {
  id: string;
  name: string;
  app_secret: string;
  version: string;
  is_active: boolean;
  created_at: string;
  owner_id: string;
}

interface SearchConfig {
  query: string;
  filter: string;
}

const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({ query: '', filter: 'all' });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    fetchApplications();
  }, []);
  
  useEffect(() => {
    filterApplications();
  }, [searchConfig, applications]);
  
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const supabase = getActiveClient();
      
      try {
        // First try direct table access
        const { data, error } = await supabase
          .from('applications_registry')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (!error) {
          setApplications(data as Application[]);
          setIsLoading(false);
          return;
        }
      } catch (directError) {
        console.error('Error accessing table directly:', directError);
      }
      
      // If direct access fails, try using SQL
      try {
        const { data, error } = await (supabase.rpc as any)('execute_sql', {
          sql_query: `
            SELECT * FROM applications_registry 
            ORDER BY created_at DESC
          `
        });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0 && data[0].rows) {
          setApplications(data[0].rows as Application[]);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch applications',
          variant: 'destructive',
        });
        setApplications([]);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterApplications = () => {
    let filtered = [...applications];
    
    // Apply search query
    if (searchConfig.query) {
      const query = searchConfig.query.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(query) || 
        app.version.toLowerCase().includes(query)
      );
    }
    
    // Apply filter
    if (searchConfig.filter === 'active') {
      filtered = filtered.filter(app => app.is_active);
    } else if (searchConfig.filter === 'inactive') {
      filtered = filtered.filter(app => !app.is_active);
    }
    
    setFilteredApps(filtered);
  };
  
  const toggleAppStatus = async (appId: string, currentStatus: boolean) => {
    try {
      const supabase = getActiveClient();
      const { error } = await supabase
        .from('applications_registry')
        .update({ is_active: !currentStatus })
        .eq('id', appId);
        
      if (error) {
        throw error;
      }
      
      setApplications(applications.map(app => 
        app.id === appId ? { ...app, is_active: !currentStatus } : app
      ));
      
      toast({
        title: 'Success',
        description: `Application ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling application status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };
  
  const handleAppCreated = async (newApp: Application) => {
    setApplications([newApp, ...applications]);
    setIsCreateModalOpen(false);
    toast({
      title: 'Success',
      description: 'Application created successfully',
    });
  };
  
  const handleCredentialsDialogClosed = () => {
    setSelectedApp(null);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchConfig({ ...searchConfig, query: e.target.value });
  };
  
  const handleFilterChange = (filter: string) => {
    setSearchConfig({ ...searchConfig, filter });
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Applications</h1>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Create Application
        </Button>
      </div>
      
      <Card className="mb-6 bg-[#101010] border-gray-800">
        <CardHeader>
          <CardTitle>Application Registry</CardTitle>
          <CardDescription>Manage your registered applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <div className="relative w-1/2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search applications..."
                value={searchConfig.query}
                onChange={handleSearch}
                className="pl-10 bg-[#1a1a1a] border-gray-700 text-white w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="filter" className="text-gray-400">
                <Filter className="h-4 w-4 mr-2 inline-block" />
                Filter:
              </Label>
              <Tabs defaultValue="all" value={searchConfig.filter} className="w-[300px]">
                <TabsList className="bg-[#1a1a1a]">
                  <TabsTrigger value="all" onClick={() => handleFilterChange('all')}>All</TabsTrigger>
                  <TabsTrigger value="active" onClick={() => handleFilterChange('active')}>Active</TabsTrigger>
                  <TabsTrigger value="inactive" onClick={() => handleFilterChange('inactive')}>Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {applications.length === 0 ? 
                "No applications found. Create your first application to get started." : 
                "No applications match your search criteria."
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-3 text-gray-400 font-medium">Name</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Version</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Created</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Status</th>
                    <th className="text-right p-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="border-b border-gray-800 hover:bg-[#151515]">
                      <td className="p-3 text-white">{app.name}</td>
                      <td className="p-3 text-gray-300">{app.version}</td>
                      <td className="p-3 text-gray-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span 
                          className={`px-2 py-1 rounded text-xs ${
                            app.is_active 
                              ? 'bg-green-900 text-green-100' 
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {app.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedApp(app)}
                            className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
                          >
                            Credentials
                          </Button>
                          <Button
                            variant={app.is_active ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => toggleAppStatus(app.id, app.is_active)}
                            className={app.is_active ? "" : "bg-green-700 hover:bg-green-800 border-green-600 text-white"}
                          >
                            {app.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-gray-800 pt-4">
          <div className="text-sm text-gray-400">
            Total applications: {applications.length}
          </div>
        </CardFooter>
      </Card>
      
      <CreateAppModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onAppCreated={handleAppCreated}
      />
      
      {selectedApp && (
        <ApplicationCredentials
          application={selectedApp}
          onClose={handleCredentialsDialogClosed}
        />
      )}
    </div>
  );
};

export default ApplicationsPage;
