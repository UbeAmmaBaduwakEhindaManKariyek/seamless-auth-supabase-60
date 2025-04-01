
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Copy, CheckCircle, Plus, Trash } from 'lucide-react';
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

const ApiKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = getActiveClient();

  // Fetch API keys
  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      // First, check if the table exists
      const { error: tableCheckError } = await supabase
        .from('app_authentication_keys')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (tableCheckError) {
        // Table likely doesn't exist, create it
        await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS app_authentication_keys (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              key TEXT NOT NULL UNIQUE,
              description TEXT,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              created_by UUID
            );
          `
        });
      }

      const { data, error } = await supabase
        .from('app_authentication_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch API keys',
          variant: 'destructive',
        });
      } else {
        setApiKeys(data || []);
      }
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
      const { error } = await supabase
        .from('app_authentication_keys')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
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
      const { error } = await supabase
        .from('app_authentication_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        throw error;
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
