
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CopyBlock, atomOneDark } from 'react-code-blocks';

const ApiDocsPage = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "API code has been copied to clipboard.",
    });
  };

  return (
    <div className="container max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      
      <Card className="mb-6 bg-[#101010] border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-white">Authentication API</CardTitle>
          <CardDescription className="text-gray-400">
            Use these endpoints to authenticate your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">API Key</h3>
              <p className="text-gray-400 mb-2">
                You need an API key to use these endpoints. You can create and manage API keys in the 
                <a href="/settings" className="text-blue-400 hover:text-blue-300 ml-1">Settings</a> page.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Authentication Endpoint</h3>
              <p className="text-gray-400 mb-2">Use this endpoint to authenticate users in your application:</p>
              
              <Tabs defaultValue="fetch" className="w-full">
                <TabsList className="bg-[#1a1a1a]">
                  <TabsTrigger value="fetch">Fetch API</TabsTrigger>
                  <TabsTrigger value="axios">Axios</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                <TabsContent value="fetch" className="mt-2">
                  <div className="relative">
                    <button 
                      className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => copyToClipboard(`const response = await fetch('${window.location.origin}/functions/v1/app-auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'user_username_or_mobile_number',
    password: 'user_password_or_license_key',
    appKey: 'YOUR_API_KEY'
  })
});

const data = await response.json();
if (data.success) {
  // Authentication successful
  console.log(data.data);
} else {
  // Authentication failed
  console.error(data.error);
}`)}
                    >
                      Copy
                    </button>
                    <CopyBlock
                      text={`const response = await fetch('${window.location.origin}/functions/v1/app-auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'user_username_or_mobile_number',
    password: 'user_password_or_license_key',
    appKey: 'YOUR_API_KEY'
  })
});

const data = await response.json();
if (data.success) {
  // Authentication successful
  console.log(data.data);
} else {
  // Authentication failed
  console.error(data.error);
}`}
                      language="javascript"
                      showLineNumbers={true}
                      theme={atomOneDark}
                      codeBlock
                      wrapLongLines
                    />
                  </div>
                </TabsContent>
                <TabsContent value="axios" className="mt-2">
                  <div className="relative">
                    <button 
                      className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => copyToClipboard(`import axios from 'axios';

try {
  const response = await axios.post('${window.location.origin}/functions/v1/app-auth', {
    username: 'user_username_or_mobile_number',
    password: 'user_password_or_license_key',
    appKey: 'YOUR_API_KEY'
  });

  if (response.data.success) {
    // Authentication successful
    console.log(response.data.data);
  } else {
    // Authentication failed
    console.error(response.data.error);
  }
} catch (error) {
  console.error('Authentication error:', error);
}`)}
                    >
                      Copy
                    </button>
                    <CopyBlock
                      text={`import axios from 'axios';

try {
  const response = await axios.post('${window.location.origin}/functions/v1/app-auth', {
    username: 'user_username_or_mobile_number',
    password: 'user_password_or_license_key',
    appKey: 'YOUR_API_KEY'
  });

  if (response.data.success) {
    // Authentication successful
    console.log(response.data.data);
  } else {
    // Authentication failed
    console.error(response.data.error);
  }
} catch (error) {
  console.error('Authentication error:', error);
}`}
                      language="javascript"
                      showLineNumbers={true}
                      theme={atomOneDark}
                      codeBlock
                      wrapLongLines
                    />
                  </div>
                </TabsContent>
                <TabsContent value="curl" className="mt-2">
                  <div className="relative">
                    <button 
                      className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => copyToClipboard(`curl -X POST '${window.location.origin}/functions/v1/app-auth' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "username": "user_username_or_mobile_number",
    "password": "user_password_or_license_key",
    "appKey": "YOUR_API_KEY"
  }'`)}
                    >
                      Copy
                    </button>
                    <CopyBlock
                      text={`curl -X POST '${window.location.origin}/functions/v1/app-auth' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "username": "user_username_or_mobile_number",
    "password": "user_password_or_license_key",
    "appKey": "YOUR_API_KEY"
  }'`}
                      language="bash"
                      showLineNumbers={true}
                      theme={atomOneDark}
                      codeBlock
                      wrapLongLines
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Response Format</h3>
              <div className="relative">
                <CopyBlock
                  text={`// Success Response
{
  "success": true,
  "data": {
    "username": "user123",
    "subscription": "premium",
    "expire_date": "2023-12-31T23:59:59Z",
    "hwid": "device-hardware-id",
    "banned": false,
    "save_hwid": true,
    "token": "session-token-uuid"
  }
}

// Error Response
{
  "success": false,
  "error": "Invalid credentials"
}`}
                  language="javascript"
                  showLineNumbers={true}
                  theme={atomOneDark}
                  codeBlock
                  wrapLongLines
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Version Management API */}
      <Card className="mb-6 bg-[#101010] border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl text-white">App Version API</CardTitle>
          <CardDescription className="text-gray-400">
            API for checking application versions and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-4">
            This API will be implemented soon. You'll be able to check for application updates
            and notify users when a new version is available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocsPage;
