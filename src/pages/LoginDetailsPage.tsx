
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2 } from 'lucide-react';

interface LoginDetail {
  id: number;
  username: string;
  ip_address: string;
  hwid: string;
  os_version: string;
  pc_name: string;
  login_time: string;
}

const LoginDetailsPage: React.FC = () => {
  const [loginDetails, setLoginDetails] = useState<LoginDetail[]>([
    { id: 1, username: 'bishan', ip_address: '192.168.1.1', hwid: 'ABC123', os_version: 'Windows 10', pc_name: 'DESKTOP-1', login_time: '2023-06-15 14:32:45' },
    { id: 2, username: 'nethma', ip_address: '192.168.1.2', hwid: 'DEF456', os_version: 'Windows 11', pc_name: 'DESKTOP-2', login_time: '2023-06-15 15:10:22' },
    { id: 3, username: 'user123', ip_address: '192.168.1.3', hwid: 'GHI789', os_version: 'macOS 12', pc_name: 'MacBook-Pro', login_time: '2023-06-15 15:45:12' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const { toast } = useToast();
  
  const handleClearDetails = () => {
    setLoginDetails([]);
    toast({
      title: "Login Details Cleared",
      description: "All login details have been cleared successfully"
    });
  };
  
  const filteredDetails = loginDetails.filter(detail => 
    detail.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    detail.ip_address.includes(searchTerm) ||
    detail.hwid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    detail.os_version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    detail.pc_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Login Details</h1>
        <p className="text-gray-400">View detailed login information</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Button 
          variant="destructive"
          onClick={handleClearDetails}
          disabled={loginDetails.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Clear All Login Details
        </Button>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Show:</span>
            <Select value={entriesPerPage.toString()} onValueChange={(value) => setEntriesPerPage(parseInt(value))}>
              <SelectTrigger className="w-20 bg-[#1a1a1a] border-gray-700 text-white">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative flex-1 md:min-w-[250px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search details..."
              className="pl-8 bg-[#1a1a1a] border-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="rounded-md border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#0a0a0a]">
            <TableRow className="hover:bg-[#0a0a0a] border-gray-800">
              <TableHead className="text-gray-300 w-20">ID</TableHead>
              <TableHead className="text-gray-300">Username</TableHead>
              <TableHead className="text-gray-300">IP Address</TableHead>
              <TableHead className="text-gray-300">HWID</TableHead>
              <TableHead className="text-gray-300">OS Version</TableHead>
              <TableHead className="text-gray-300">PC Name</TableHead>
              <TableHead className="text-gray-300">Login Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDetails.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  No login details found
                </TableCell>
              </TableRow>
            ) : (
              filteredDetails
                .slice(0, entriesPerPage)
                .map((detail) => (
                  <TableRow key={detail.id} className="hover:bg-[#151515] border-gray-800">
                    <TableCell className="text-white">{detail.id}</TableCell>
                    <TableCell className="font-medium text-white">{detail.username}</TableCell>
                    <TableCell className="text-white">{detail.ip_address}</TableCell>
                    <TableCell className="text-white">{detail.hwid}</TableCell>
                    <TableCell className="text-white">{detail.os_version}</TableCell>
                    <TableCell className="text-white">{detail.pc_name}</TableCell>
                    <TableCell className="text-white">{detail.login_time}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LoginDetailsPage;
