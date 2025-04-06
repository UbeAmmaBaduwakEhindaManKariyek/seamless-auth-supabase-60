
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { getActiveClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface AppVersion {
  id: number;
  version: string;
  created_at: string;
}

const AppVersionManager: React.FC = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<AppVersion | null>(null);
  const [newVersion, setNewVersion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sqlExecutionError, setSqlExecutionError] = useState<boolean>(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = getActiveClient();

  // Fetch current version
  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try direct table access first
        try {
          const { data: tableData, error: tableError } = await supabase
            .from('app_version')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (!tableError) {
            if (tableData && tableData.length > 0) {
              setVersions(tableData);
              setCurrentVersion(tableData[0]);
              setNewVersion(tableData[0].version);
              setSqlExecutionError(false);
              setIsLoading(false);
              return;
            }
          } else {
            console.error("Error accessing app_version table directly:", tableError);
          }
        } catch (directError) {
          console.error("Error with direct table access:", directError);
        }
        
        // Fall back to using the SQL execution function
        try {
          // First, check if the table exists
          const { error: tableCheckError } = await supabase.rpc('execute_sql', {
            sql_query: `
              SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'app_version'
            `
          });
            
          if (tableCheckError) {
            if (tableCheckError.message?.includes('Could not find the function')) {
              setSqlExecutionError(true);
              throw new Error('SQL execution function not available');
            }
            
            // Table likely doesn't exist, create it
            await supabase.rpc('execute_sql', {
              sql_query: `
                CREATE TABLE IF NOT EXISTS app_version (
                  id SERIAL PRIMARY KEY,
                  version TEXT NOT NULL,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );
              `
            });
            
            // Insert initial version
            await supabase.rpc('execute_sql', {
              sql_query: `INSERT INTO app_version (version) VALUES ('1.0.0')`
            });
          }
          
          const { data, error } = await supabase.rpc('execute_sql', {
            sql_query: `
              SELECT * FROM app_version 
              ORDER BY created_at DESC
            `
          });
            
          if (error) {
            if (error.message?.includes('Could not find the function')) {
              setSqlExecutionError(true);
              throw new Error('SQL execution function not available');
            }
            throw error;
          }
          
          if (data && data.length > 0 && data[0].rows) {
            const versionData = data[0].rows.map((row: any) => ({
              id: row.id,
              version: row.version,
              created_at: row.created_at
            }));
            setVersions(versionData);
            setCurrentVersion(versionData[0]);
            setNewVersion(versionData[0].version);
          } else {
            // If no versions exist, create an initial one
            const { data: newData, error: insertError } = await supabase.rpc('execute_sql', {
              sql_query: `
                INSERT INTO app_version (version) VALUES ('1.0.0') 
                RETURNING id, version, created_at
              `
            });
              
            if (insertError) throw insertError;
            
            if (newData && newData.length > 0 && newData[0].rows) {
              const initialVersion = {
                id: newData[0].rows[0].id,
                version: newData[0].rows[0].version,
                created_at: newData[0].rows[0].created_at
              };
              setVersions([initialVersion]);
              setCurrentVersion(initialVersion);
              setNewVersion(initialVersion.version);
            }
          }
        } catch (sqlError) {
          console.error("Error using SQL execution function:", sqlError);
          if (sqlError.message?.includes('SQL execution function not available')) {
            // Create the app_version table directly
            try {
              const { error: createTableError } = await supabase
                .from('app_version')
                .insert({ version: '1.0.0' })
                .select()
                .single();
                
              if (!createTableError) {
                // Fetch the newly created version
                const { data: newVersionData, error: newVersionError } = await supabase
                  .from('app_version')
                  .select('*')
                  .order('created_at', { ascending: false });
                  
                if (!newVersionError && newVersionData && newVersionData.length > 0) {
                  setVersions(newVersionData);
                  setCurrentVersion(newVersionData[0]);
                  setNewVersion(newVersionData[0].version);
                } else {
                  throw newVersionError || new Error('Failed to fetch new version data');
                }
              } else {
                throw createTableError;
              }
            } catch (fallbackError) {
              console.error("Error with fallback method:", fallbackError);
              throw fallbackError;
            }
          } else {
            throw sqlError;
          }
        }
      } catch (err) {
        console.error("Error fetching app version:", err);
        setError("Failed to fetch app version data");
        toast({
          title: "Error",
          description: "Failed to fetch app version data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVersions();
  }, []);

  // Update version
  const updateVersion = async () => {
    if (!newVersion.trim()) {
      toast({
        title: "Validation Error",
        description: "Version cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (currentVersion?.version === newVersion) {
      toast({
        title: "No Changes",
        description: "The version is unchanged",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      if (sqlExecutionError) {
        // Use direct table access if SQL execution is not available
        const { data, error } = await supabase
          .from('app_version')
          .insert({ version: newVersion.trim() })
          .select()
          .single();
          
        if (error) throw error;
        
        setVersions([data, ...versions]);
        setCurrentVersion(data);
      } else {
        // Use SQL execution function
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: `
            INSERT INTO app_version (version) 
            VALUES ('${newVersion.trim()}') 
            RETURNING id, version, created_at
          `
        });
          
        if (error) {
          if (error.message?.includes('Could not find the function')) {
            setSqlExecutionError(true);
            // Try direct insert instead
            const { data: directData, error: directError } = await supabase
              .from('app_version')
              .insert({ version: newVersion.trim() })
              .select()
              .single();
              
            if (directError) throw directError;
            
            setVersions([directData, ...versions]);
            setCurrentVersion(directData);
          } else {
            throw error;
          }
        } else if (data && data.length > 0 && data[0].rows) {
          const newVersionData = {
            id: data[0].rows[0].id,
            version: data[0].rows[0].version,
            created_at: data[0].rows[0].created_at
          };
          setVersions([newVersionData, ...versions]);
          setCurrentVersion(newVersionData);
        }
      }
      
      toast({
        title: "Success",
        description: "Application version updated successfully",
      });
    } catch (err) {
      console.error("Error updating app version:", err);
      setError("Failed to update app version");
      toast({
        title: "Error",
        description: "Failed to update app version",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open Supabase dashboard
  const openSupabaseDashboard = () => {
    if (user?.supabaseUrl) {
      const dashboardUrl = user.supabaseUrl.replace('.supabase.co', '.supabase.co/project/sql');
      window.open(dashboardUrl, '_blank');
    }
  };

  return (
    <Card className="bg-[#101010] border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">App Version Control</CardTitle>
        <CardDescription className="text-gray-400">
          Manage your application version number
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <Alert className="bg-red-900 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {sqlExecutionError && (
              <Alert className="bg-amber-900 border-amber-700 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between w-full">
                  <span>
                    The execute_sql function is not available in your Supabase database. 
                    Using direct table access as a fallback.
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={openSupabaseDashboard}
                    className="bg-amber-800 hover:bg-amber-700 border-amber-600 ml-2"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    SQL Editor
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Current Version</p>
              <p className="text-lg font-semibold text-white">{currentVersion?.version}</p>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {currentVersion ? new Date(currentVersion.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <div className="border-t border-gray-800 pt-4 mt-4">
              <p className="text-sm font-medium text-gray-400 mb-2">Update Version</p>
              <div className="flex space-x-2">
                <Input
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="e.g. 1.2.0"
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
                <Button 
                  onClick={updateVersion} 
                  disabled={isSaving || !newVersion.trim() || currentVersion?.version === newVersion}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Update"}
                </Button>
              </div>
            </div>
            
            {versions.length > 1 && (
              <div className="border-t border-gray-800 pt-4 mt-4">
                <p className="text-sm font-medium text-gray-400 mb-2">Version History</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {versions.map((version, index) => (
                    <div key={version.id} className="text-sm">
                      <span className="text-white font-medium">{version.version}</span>
                      <span className="text-gray-500 ml-2">
                        {new Date(version.created_at).toLocaleString()}
                      </span>
                      {index === 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-800 text-blue-100 rounded">
                          Current
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500">
          This version number will be used by applications to check for updates
        </p>
      </CardFooter>
    </Card>
  );
};

export default AppVersionManager;
