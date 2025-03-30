
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const SupabaseSetup: React.FC = () => {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveSupabaseConfig, user, isConnected } = useAuth();

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
          {isConnected && (
            <Alert className="bg-green-900 border-green-700">
              <AlertTitle>Connected!</AlertTitle>
              <AlertDescription>
                Your Supabase connection has been configured and is working.
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
              value={url || (user?.supabaseUrl || '')}
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
              value={apiKey || (user?.supabaseKey || '')}
              onChange={(e) => setApiKey(e.target.value)}
              required
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
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
