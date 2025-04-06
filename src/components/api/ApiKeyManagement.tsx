import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Copy, CheckCircle, Plus, Trash, ExternalLink, AlertCircle } from 'lucide-react';
import { getActiveClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface SqlQueryResult {
  rows: Array<any>;
  [key: string]: any;
}

const ApiKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [sqlExecutionError, setSqlExecutionError] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = getActiveClient();

  // Fetch API keys
  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      // Try direct table access first
      try {
        const { data: directData, error: directError } = await supabase
          .from('app_authentication_keys')
          .select('id, name, key, description, is_active, created_at')
          .order('created_at', { ascending: false });

        if (!directError) {
          setApiKeys(directData as ApiKey[]);
          setSqlExecutionError(false);
          setIsLoading(false);
          return;
        }
      } catch (directError) {
        console.error('Error with direct table access:', directError);
      }

      // Fall back to using the SQL execution function
      try {
        const { error: tableCheckError } = await (supabase.rpc as any)('execute_sql', {
          sql_query: `
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'app_authentication_keys'
          `
        });

        if (tableCheckError) {
          console.error('Error checking for table:', tableCheckError);
          if (tableCheckError.message?.includes('Could not find the function')) {
            setSqlExecutionError(true);
          }
          setApiKeys([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await (supabase.rpc as any)('execute_sql', {
          sql_query: `
            SELECT id, name, key, description, is_active, created_at 
            FROM app_authentication_keys 
            ORDER BY created_at DESC
          `
        });

        if (error) {
          console.error('Error fetching API keys:', error);
          if (error.message?.includes('Could not find the function')) {
            setSqlExecutionError(true);
          }
          toast({
            title: 'Error',
            description: 'Failed to fetch API keys',
            variant: 'destructive',
          });
          setApiKeys([]);
        } else {
          // Parse the rows from the result
          if (data && Array.isArray(data) && data.length > 0 && (data[0] as SqlQueryResult).rows) {
            const keys: ApiKey[] = (data[0] as SqlQueryResult).rows.map((row: any) => ({
              id: row.id,
              name: row.name,
              key: row.key,
              description: row.description,
              is_active: row.is_active,
              created_at: row.created_at
            }));
            setApiKeys(keys);
          } else {
            setApiKeys([]);
          }
        }
      } catch (error) {
        console.error('Error executing SQL function:', error);
        setSqlExecutionError(true);
        setApiKeys([]);
      }
    } catch (error) {
      console.error('Unexpected error fetching API keys:', error);
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  // Create a new API key
  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name for the API key',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      if (sqlExecutionError) {
        // Try direct insert if SQL execution function is not available
        const newKey = crypto.randomUUID();
        const { data, error } = await supabase
          .from('app_authentication_keys')
          .insert({
            name: newKeyName.trim(),
            description: newKeyDescription.trim() || null,
            key: newKey,
          })
          .select();

        if (error) {
          throw new Error(error.message);
        }

        setNewApiKey(newKey);
        await fetchApiKeys();
        toast({
          title: 'Success',
          description: 'API key created successfully',
        });
      } else {
        // Call the create-app-key edge function
        const response = await supabase.functions.invoke('create-app-key', {
          body: { name: newKeyName.trim(), description: newKeyDescription.trim() || null }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data.success && response.data.data) {
          setNewApiKey(response.data.data.key);
          await fetchApiKeys();
          toast({
            title: 'Success',
            description: 'API key created successfully',
          });
        } else {
          throw new Error('Failed to create API key');
        }
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Delete an API key
  const deleteApiKey = async (id: string) => {
    try {
      if (sqlExecutionError) {
        // Try direct delete if SQL execution function is not available
        const { error } = await supabase
          .from('app_authentication_keys')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await (supabase.rpc as any)('execute_sql', {
          sql_query: `DELETE FROM app_authentication_keys WHERE id = '${id}'`
        });

        if (error) {
          throw error;
        }
      }

      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive',
      });
    }
  };

  // Toggle API key status (active/inactive)
  const toggleApiKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      if (sqlExecutionError) {
        // Try direct update if SQL execution function is not available
        const { error } = await supabase
          .from('app_authentication_keys')
          .update({ is_active: !currentStatus })
          .eq('id', id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await (supabase.rpc as any)('execute_sql', {
          sql_query: `
            UPDATE app_authentication_keys 
            SET is_active = ${!currentStatus} 
            WHERE id = '${id}'
          `
        });

        if (error) {
          throw error;
        }
      }

      setApiKeys(apiKeys.map(key => 
        key.id === id ? { ...key, is_active: !currentStatus } : key
      ));
      
      toast({
        title: 'Success',
        description: `API key ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling API key status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update API key status',
        variant: 'destructive',
      });
    }
  };

  // Copy API key to clipboard
  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Reset the dialog form
  const resetForm = () => {
    setNewKeyName('');
    setNewKeyDescription('');
    setNewApiKey(null);
    setIsDialogOpen(false);
  };

  // Open Supabase dashboard
  const openSupabaseDashboard = () => {
    if (user?.supabaseUrl) {
      const dashboardUrl = user.supabaseUrl.replace('.supabase.co', '.supabase.co/project/sql');
      window.open(dashboardUrl, '_blank');
    }
  };

  return (
    <Card className="bg-[#101010] border-gray-800 mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-white">API Key Management</CardTitle>
          <CardDescription className="text-gray-400">
            Manage API keys for external application authentication
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#101010] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>{newApiKey ? 'API Key Created' : 'Create New API Key'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {newApiKey 
                  ? 'Your API key has been created. Please copy it now as you won\'t be able to see it again.'
                  : 'Create a new API key for external application authentication.'}
              </DialogDescription>
            </DialogHeader>
            {!newApiKey ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="Enter a name for this API key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyDescription">Description (Optional)</Label>
                  <Textarea
                    id="keyDescription"
                    placeholder="Enter a description for this API key"
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-blue-900 border-blue-700">
                  <div className="flex items-center justify-between w-full">
                    <div className="break-all pr-2">{newApiKey}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newApiKey)}
                      className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
                    >
                      {copiedKey === newApiKey ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Alert>
              </div>
            )}
            <DialogFooter>
              {!newApiKey ? (
                <>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createApiKey}
                    disabled={isCreating || !newKeyName.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={resetForm}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Done
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
        
        {isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No API keys found. Create your first API key to allow external applications to authenticate.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div 
                key={key.id} 
                className="p-4 border border-gray-800 rounded-md bg-[#0a0a0a] flex justify-between items-center"
              >
                <div className="space-y-1">
                  <div className="font-medium text-white">{key.name}</div>
                  {key.description && (
                    <div className="text-sm text-gray-400">{key.description}</div>
                  )}
                  <div className="text-xs text-gray-500">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={key.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleApiKeyStatus(key.id, key.is_active)}
                    className={key.is_active 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:bg-gray-700"}
                  >
                    {key.is_active ? "Active" : "Inactive"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteApiKey(key.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
        <div className="text-sm text-gray-400">
          Use these API keys in your applications to authenticate with the API without exposing your Supabase credentials.
        </div>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyManagement;
