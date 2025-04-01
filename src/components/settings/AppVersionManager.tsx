
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { getActiveClient } from '@/integrations/supabase/client';
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
  
  const { toast } = useToast();
  const supabase = getActiveClient();

  // Fetch current version
  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First, check if the table exists
        const { error: tableCheckError } = await supabase
          .from('app_version')
          .select('count', { count: 'exact', head: true })
          .limit(1);
          
        if (tableCheckError) {
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
          await supabase
            .from('app_version')
            .insert({ version: '1.0.0' });
        }
        
        const { data, error } = await supabase
          .from('app_version')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setVersions(data);
          setCurrentVersion(data[0]);
          setNewVersion(data[0].version);
        } else {
          // If no versions exist, create an initial one
          const { data: newData, error: insertError } = await supabase
            .from('app_version')
            .insert({ version: '1.0.0' })
            .select()
            .single();
            
          if (insertError) throw insertError;
          
          setVersions([newData]);
          setCurrentVersion(newData);
          setNewVersion(newData.version);
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
      const { data, error } = await supabase
        .from('app_version')
        .insert({ version: newVersion.trim() })
        .select()
        .single();
        
      if (error) throw error;
      
      setVersions([data, ...versions]);
      setCurrentVersion(data);
      
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
