
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Search, Loader2 } from 'lucide-react';
import { getActiveClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface AppOpenRecord {
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
  timestamp: string;
}

const AppOpenPage: React.FC = () => {
  const [records, setRecords] = useState<AppOpenRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toast } = useToast();
  const { isConnected } = useAuth();
  
  useEffect(() => {
    const fetchAppOpenRecords = async () => {
      if (!isConnected) {
        setRecords([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const client = getActiveClient();
        const { data, error } = await client
          .from('application_open')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error("Error fetching application open records:", error);
          toast({
            title: "Failed to load records",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setRecords(data as AppOpenRecord[]);
        } else {
          // Mock data if no records found
          setRecords([
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
              timestamp: new Date().toISOString()
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
              timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch application open records:", error);
        toast({
          title: "Error",
          description: "Failed to load application open records",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppOpenRecords();
  }, [isConnected, toast]);
  
  const filteredRecords = records.filter(record =>
    record.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.hwid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.pc_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredRecords.length / entriesPerPage);
  const displayedRecords = filteredRecords.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  
  const handleExport = () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "No Records",
        description: "There are no records to export",
        variant: "destructive"
      });
      return;
    }
    
    const csvContent = [
      ['ID', 'Username', 'IP Address', 'HWID', 'PC Name', 'OS Version', 'CPU Serial', 'Motherboard', 'RAM', 'GPU', 'Storage', 'Timestamp'].join(','),
      ...filteredRecords.map(record => [
        record.id,
        record.username || '',
        record.ip_address || '',
        record.hwid || '',
        record.pc_name || '',
        record.os_version || '',
        record.cpu_serial || '',
        record.motherboard_serial || '',
        record.ram_capacity || '',
        record.graphics_card || '',
        record.storage_capacity || '',
        record.timestamp || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `app-open-records-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `${filteredRecords.length} record(s) exported to CSV`
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">App Open Records</h1>
        <p className="text-gray-400">View application open events and hardware information</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Button
          variant="outline"
          className="bg-[#1a1a1a] border-gray-700 text-white"
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" /> Export Records
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
              placeholder="Search records..."
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
                <TableHead className="text-gray-300">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-[#151515] border-gray-800">
                  <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayedRecords.length === 0 ? (
                <TableRow className="hover:bg-[#151515] border-gray-800">
                  <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                    {isConnected ? "No records found" : "Connect to Supabase to view records"}
                  </TableCell>
                </TableRow>
              ) : (
                displayedRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-[#151515] border-gray-800">
                    <TableCell className="text-white">{record.username || 'N/A'}</TableCell>
                    <TableCell className="text-white">{record.ip_address || 'N/A'}</TableCell>
                    <TableCell className="text-white">
                      <div className="truncate max-w-[120px]">{record.hwid || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="text-white">{record.pc_name || 'N/A'}</TableCell>
                    <TableCell className="text-white">{record.os_version || 'N/A'}</TableCell>
                    <TableCell className="text-white">
                      {record.timestamp ? format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
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

export default AppOpenPage;
