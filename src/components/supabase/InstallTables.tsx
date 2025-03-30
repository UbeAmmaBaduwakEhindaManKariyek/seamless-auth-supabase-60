
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock } from 'lucide-react';

const InstallTables: React.FC = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const handleInstall = async () => {
    if (!user?.supabaseUrl || !user?.supabaseKey) {
      toast({
        title: "Missing Supabase configuration",
        description: "Please save your Supabase URL and API key first",
        variant: "destructive",
      });
      return;
    }
    
    setIsInstalling(true);
    
    // Simulate installation process
    setTimeout(() => {
      setIsInstalling(false);
      setIsCompleted(true);
      toast({
        title: "Tables installed successfully",
        description: "All required database tables have been created",
      });
    }, 2500);
  };

  return (
    <Card className="bg-[#101010] border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Install Database Tables</CardTitle>
        <CardDescription className="text-gray-400">
          Create all required tables in your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCompleted && (
          <Alert className="bg-green-900 border-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Tables installed successfully</AlertTitle>
            <AlertDescription>
              All database tables have been created in your Supabase project.
            </AlertDescription>
          </Alert>
        )}
        
        {isInstalling && (
          <Alert className="bg-blue-900 border-blue-700">
            <Clock className="h-4 w-4 animate-spin" />
            <AlertTitle>Installing tables...</AlertTitle>
            <AlertDescription>
              Please wait while we create the necessary database tables.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <h3 className="text-white font-medium">The following tables will be created:</h3>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            <li>app_version</li>
            <li>application_open</li>
            <li>license_keys</li>
            <li>login_details</li>
            <li>login_logs</li>
            <li>messages</li>
            <li>regz_cheat_status</li>
            <li>subscription_types</li>
            <li>users</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInstall} 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isInstalling || isCompleted || !user?.supabaseUrl || !user?.supabaseKey}
        >
          {isInstalling ? 'Installing...' : isCompleted ? 'Tables Installed' : 'Install All Tables'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InstallTables;
