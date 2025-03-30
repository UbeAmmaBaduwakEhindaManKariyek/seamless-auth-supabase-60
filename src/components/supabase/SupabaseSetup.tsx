
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SupabaseSetup: React.FC = () => {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { saveSupabaseConfig, user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && apiKey) {
      saveSupabaseConfig(url, apiKey);
    }
  };

  return (
    <Card className="bg-[#101010] border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Supabase Connection</CardTitle>
        <CardDescription className="text-gray-400">
          Connect to your Supabase project for database functionality
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {user?.supabaseUrl && user?.supabaseKey && (
            <Alert className="bg-green-900 border-green-700">
              <AlertTitle>Connected!</AlertTitle>
              <AlertDescription>
                Your Supabase connection has been configured.
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
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
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
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Save Connection
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SupabaseSetup;
