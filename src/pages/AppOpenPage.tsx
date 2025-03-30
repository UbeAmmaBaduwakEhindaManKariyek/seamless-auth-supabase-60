
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2 } from 'lucide-react';

interface AppOpen {
  id: number;
  username: string;
  ip_address: string;
  hwid: string;
  os_version: string;
  pc_name: string;
  timestamp: string;
}

const AppOpenPage: React.FC = () => {
  const [appOpens, setAppOpens] = useState<AppOpen[]>([
    { id: 1, username: 'bishan', ip_address: '192.168.1.1', hwid: 'ABC123', os_version: 'Windows 10', pc_name: 'DESKTOP-1', timestamp: '2023-06-15 14:32:45' },
    { id: 2, username: 'nethma', ip_address: '192.168.1.2', hwid: 'DEF456', os_version: 'Windows 11', pc_name: 'DESKTOP-2', timestamp: '2023-06-15 15:10:22' },
    { id: 3, username: 'user123', ip_address: '192.168.1.3', hwid: 'GHI789', os_version: 'macOS 12', pc_name: 'MacBook-Pro', timestamp: '2023-06-15 15:45:12' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const { toast } = useToast();
  
  const handleClearAppOpens = () => {
    setAppOpens([]);
    toast({
      title: "App Open Records Cleared",
      description: "All application open records have been cleared successfully"
    });
  };
  
  const filteredAppOpens = appOpens.filter(appOpen => 
    appOpen.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    appOpen.ip_address.includes(searchTerm) ||
    appOpen.hwid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appOpen.os_version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appOpen.pc_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">App Open Records</h1>
        <p className="text-gray-400">View application launch records</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Button 
          variant="destructive"
          onClick={handleClearAppOpens}
          disabled={appOpens.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Clear All Records
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
              placeholder="Search records..."
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
              <TableHead className="text-gray-300">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppOpens.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  No application open records found
                </TableCell>
              </TableRow>
            ) : (
              filteredAppOpens
                .slice(0, entriesPerPage)
                .map((appOpen) => (
                  <TableRow key={appOpen.id} className="hover:bg-[#151515] border-gray-800">
                    <TableCell className="text-white">{appOpen.id}</TableCell>
                    <TableCell className="font-medium text-white">{appOpen.username}</TableCell>
                    <TableCell className="text-white">{appOpen.ip_address}</TableCell>
                    <TableCell className="text-white">{appOpen.hwid}</TableCell>
                    <TableCell className="text-white">{appOpen.os_version}</TableCell>
                    <TableCell className="text-white">{appOpen.pc_name}</TableCell>
                    <TableCell className="text-white">{appOpen.timestamp}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AppOpenPage;
