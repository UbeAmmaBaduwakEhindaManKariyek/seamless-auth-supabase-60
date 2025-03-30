
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Github } from 'lucide-react';

interface EmuUser {
  username: string;
  password: string;
  motherboard_serial: string;
  expiration_date: string;
}

const EmuUsersPage: React.FC = () => {
  const [emuUsers, setEmuUsers] = useState<EmuUser[]>([]);
  const [githubToken, setGithubToken] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  
  // Simulated fetch users from GitHub
  const fetchUsers = () => {
    if (!githubUrl || !githubToken) {
      toast({
        title: "Missing Information",
        description: "Please provide both GitHub URL and token",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      setIsLoading(false);
      
      // Mock data for demo purposes
      const mockUsers: EmuUser[] = [
        {
          username: "bishan",
          password: "bishan@1505",
          motherboard_serial: "ABC123",
          expiration_date: "2025-12-31"
        },
        {
          username: "nethma",
          password: "@nethmabaduwak",
          motherboard_serial: "",
          expiration_date: "2025-12-31"
        }
      ];
      
      setEmuUsers(mockUsers);
      
      toast({
        title: "Users Fetched",
        description: `Successfully fetched ${mockUsers.length} users from GitHub`
      });
    }, 1500);
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Emu Users</h1>
        <p className="text-gray-400">Manage users from GitHub repository</p>
      </div>
      
      <Card className="bg-[#101010] border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">GitHub Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Connect to GitHub to fetch user data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="githubUrl" className="text-sm font-medium text-gray-300">GitHub URL</label>
            <Input 
              id="githubUrl" 
              placeholder="https://raw.githubusercontent.com/username/repo/branch/file.json" 
              className="bg-[#1a1a1a] border-gray-700 text-white"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="githubToken" className="text-sm font-medium text-gray-300">GitHub Token</label>
            <Input 
              id="githubToken" 
              placeholder="github_pat_..." 
              className="bg-[#1a1a1a] border-gray-700 text-white"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={fetchUsers}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Fetching Users...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" /> Fetch Users from GitHub
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="rounded-md border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#0a0a0a]">
            <TableRow className="hover:bg-[#0a0a0a] border-gray-800">
              <TableHead className="text-gray-300">Username</TableHead>
              <TableHead className="text-gray-300">Password</TableHead>
              <TableHead className="text-gray-300">Motherboard Serial</TableHead>
              <TableHead className="text-gray-300">Expiration Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emuUsers.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                  No users found. Configure GitHub and fetch users to get started.
                </TableCell>
              </TableRow>
            ) : (
              emuUsers.map((user, index) => (
                <TableRow key={index} className="hover:bg-[#151515] border-gray-800">
                  <TableCell className="font-medium text-white">{user.username}</TableCell>
                  <TableCell className="text-white">{user.password}</TableCell>
                  <TableCell className="text-white">{user.motherboard_serial || 'N/A'}</TableCell>
                  <TableCell className="text-white">{user.expiration_date}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmuUsersPage;
