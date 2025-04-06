import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Search, Loader2 } from 'lucide-react';
import { getActiveClient, fromTable } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface LoginDetail {
  id: number;
  username: string;
  ip_address: string;
  hwid: string;
  motherboard_serial: string;
  cpu_serial: string;
  os_version: string;
  ram_capacity: string;
  graphics_card: string;
  storage_capacity: string;
  pc_name: string;
  login_time: string;
}

const LoginDetailsPage: React.FC = () => {
  const [loginDetails, setLoginDetails] = useState<LoginDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toast } = useToast();
  const { isConnected } = useAuth();
  
  useEffect(() => {
    const fetchLoginDetails = async () => {
      if (!isConnected) {
        setLoginDetails([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await fromTable('login_details')
          .select('*')
          .order('login_time', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error("Error fetching login details:", error);
          toast({
            title: "Failed to load login details",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setLoginDetails(data as LoginDetail[]);
        } else {
          setLoginDetails([
            {
              id: 1,
              username: 'johndoe',
              ip_address: '192.168.1.1',
              hwid: 'HW12345',
              motherboard_serial: 'MB98765',
              cpu_serial: 'CPU54321',
              os_version: 'Windows 11 Pro',
              ram_capacity: '16GB',
              graphics_card: 'NVIDIA RTX 3070',
              storage_capacity: '1TB SSD',
              pc_name: 'DESKTOP-ABC123',
              login_time: new Date().toISOString()
            },
            {
              id: 2,
              username: 'janesmith',
              ip_address: '192.168.1.2',
              hwid: 'HW67890',
              motherboard_serial: 'MB12345',
              cpu_serial: 'CPU09876',
              os_version: 'Windows 10 Home',
              ram_capacity: '8GB',
              graphics_card: 'AMD Radeon RX 580',
              storage_capacity: '500GB SSD',
              pc_name: 'LAPTOP-XYZ456',
              login_time: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch login details:", error);
        toast({
          title: "Error",
          description: "Failed to load login details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLoginDetails();
  }, [isConnected, toast]);
  
  const filteredDetails = loginDetails.filter(detail =>
    detail.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    detail.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    detail.hwid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    detail.pc_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredDetails.length / entriesPerPage);
  const displayedDetails = filteredDetails.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  
  const handleExport = () => {
    if (filteredDetails.length === 0) {
      toast({
        title: "No Records",
        description: "There are no login details to export",
        variant: "destructive"
      });
      return;
    }
    
    const csvContent = [
      ['ID', 'Username', 'IP Address', 'HWID', 'PC Name', 'OS Version', 'CPU Serial', 'Motherboard', 'RAM', 'GPU', 'Storage', 'Login Time'].join(','),
      ...filteredDetails.map(detail => [
        detail.id,
        detail.username || '',
        detail.ip_address || '',
        detail.hwid || '',
        detail.pc_name || '',
        detail.os_version || '',
        detail.cpu_serial || '',
        detail.motherboard_serial || '',
        detail.ram_capacity || '',
        detail.graphics_card || '',
        detail.storage_capacity || '',
        detail.login_time || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `login-details-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `${filteredDetails.length} record(s) exported to CSV`
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Login Details</h1>
        <p className="text-gray-400">View login events and user hardware information</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Button
          variant="outline"
          className="bg-[#1a1a1a] border-gray-700 text-white"
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" /> Export Details
        </Button>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Show:</span>
            <Select
              value={entriesPerPage.toString()}
              onValueChange={(value) => {
                setEntriesPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="rounded-md border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#0a0a0a]">
              <TableRow className="hover:bg-[#0a0a0a] border-gray-800">
                <TableHead className="text-gray-300">Username</TableHead>
                <TableHead className="text-gray-300">IP Address</TableHead>
                <TableHead className="text-gray-300">HWID</TableHead>
                <TableHead className="text-gray-300">PC Name</TableHead>
                <TableHead className="text-gray-300">OS Version</TableHead>
                <TableHead className="text-gray-300">Login Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-[#151515] border-gray-800">
                  <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading login details...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayedDetails.length === 0 ? (
                <TableRow className="hover:bg-[#151515] border-gray-800">
                  <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                    {isConnected ? "No login details found" : "Connect to Supabase to view login details"}
                  </TableCell>
                </TableRow>
              ) : (
                displayedDetails.map((detail) => (
                  <TableRow key={detail.id} className="hover:bg-[#151515] border-gray-800">
                    <TableCell className="text-white">{detail.username || 'N/A'}</TableCell>
                    <TableCell className="text-white">{detail.ip_address || 'N/A'}</TableCell>
                    <TableCell className="text-white">
                      <div className="truncate max-w-[120px]">{detail.hwid || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="text-white">{detail.pc_name || 'N/A'}</TableCell>
                    <TableCell className="text-white">{detail.os_version || 'N/A'}</TableCell>
                    <TableCell className="text-white">
                      {detail.login_time ? format(new Date(detail.login_time), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-gray-700 text-white"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <span className="text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-gray-700 text-white"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoginDetailsPage;
