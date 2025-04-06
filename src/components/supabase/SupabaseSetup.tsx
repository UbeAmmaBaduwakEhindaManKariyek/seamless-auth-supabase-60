import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { getActiveClient } from '@/integrations/supabase/client';

const SupabaseSetup: React.FC = () => {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isCreatingFunction, setIsCreatingFunction] = useState(false);
  const { saveSupabaseConfig, user, isConnected, checkConnection } = useAuth();

  useEffect(() => {
    if (user?.supabaseUrl) {
      setUrl(user.supabaseUrl);
    }
    if (user?.supabaseKey) {
      setApiKey(user.supabaseKey);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url && apiKey) {
      setIsSubmitting(true);
      try {
        await saveSupabaseConfig(url, apiKey);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const testConnection = async () => {
    if (!url || !apiKey) {
      return;
    }
    
    setIsTestingConnection(true);
    try {
      const success = await saveSupabaseConfig(url, apiKey);
      return success;
    } finally {
      setIsTestingConnection(false);
    }
  };

  const createExecuteSqlFunction = async () => {
    if (!isConnected || !user?.supabaseUrl) {
      return;
    }
    
    setIsCreatingFunction(true);
    try {
      const supabase = getActiveClient();
      
      try {
        const { data: testData, error: testError } = await (supabase.rpc as any)('execute_sql', {
          sql_query: 'SELECT 1'
        });
        
        if (!testError) {
          return true;
        }
      } catch (err) {
        console.log('Function check failed, trying to create it');
      }
      
      try {
        const { error } = await supabase.functions.invoke('create-execute-sql-function', {
          body: {}
        });
        
        if (error) {
          console.error('Error creating execute_sql function:', error);
          return false;
        }
        
        return true;
      } catch (err) {
        console.error('Error invoking function creation:', err);
        return false;
      }
    } finally {
      setIsCreatingFunction(false);
    }
  };

  const openSupabaseDashboard = () => {
    if (user?.supabaseUrl) {
      const dashboardUrl = user.supabaseUrl.replace('.supabase.co', '.supabase.co/project/sql');
      window.open(dashboardUrl, '_blank');
    }
  };

  return (
    <Card className="bg-[#101010] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Supabase Connection</CardTitle>
        <CardDescription className="text-gray-400">
          Connect to your Supabase project for database functionality
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {isConnected && (
            <Alert className="bg-green-900 border-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Connected!</AlertTitle>
              <AlertDescription>
                Your Supabase connection has been configured and is working.
              </AlertDescription>
            </Alert>
          )}
          
          {!isConnected && user?.supabaseUrl && (
            <Alert className="bg-red-900 border-red-700">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>
                Could not connect to Supabase with the provided URL and API key. Please verify your credentials.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <label htmlFor="supabaseUrl" className="text-sm font-medium text-gray-300">
              Supabase URL
            </label>
            <Input
              id="supabaseUrl"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
            <p className="text-xs text-gray-400">
              Example: https://tevmesjpsrsiuwswgzfb.supabase.co
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="supabaseKey" className="text-sm font-medium text-gray-300">
              Supabase API Key
            </label>
            <Input
              id="supabaseKey"
              placeholder="your-api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
            <p className="text-xs text-gray-400">
              Use the anon/public key from your Supabase project settings
            </p>
          </div>
          
          {isConnected && (
            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a] flex items-center"
                onClick={openSupabaseDashboard}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open SQL Editor
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                onClick={createExecuteSqlFunction}
                disabled={isCreatingFunction}
              >
                {isCreatingFunction ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating SQL Function...
                  </>
                ) : (
                  'Create execute_sql Function'
                )}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline"
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
            onClick={testConnection}
            disabled={isTestingConnection || !url || !apiKey}
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : 'Test Connection'}
          </Button>
          
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? 'Update Connection' : 'Connect to Supabase'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SupabaseSetup;
