
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Search, Loader2, TrashIcon } from 'lucide-react';
import { getActiveClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface LogEntry {
  id: number;
  username: string;
  status: string;
  timestamp: string;
}

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toast } = useToast();
  const { isConnected } = useAuth();
  
  useEffect(() => {
    const fetchLogs = async () => {
      if (!isConnected) {
        setLogs([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const client = getActiveClient();
        const { data, error } = await client
          .from('login_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error("Error fetching logs:", error);
          toast({
            title: "Failed to load logs",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setLogs(data as LogEntry[]);
        } else {
          // Mock data if no records found
          setLogs([
            {
              id: 1,
              username: 'johndoe',
              status: 'successful',
              timestamp: new Date().toISOString()
            },
            {
              id: 2,
              username: 'janesmith',
              status: 'failed',
              timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
              id: 3,
              username: 'admin',
              status: 'successful',
              timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
        toast({
          title: "Error",
          description: "Failed to load logs",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [isConnected, toast]);
  
  const filteredLogs = logs.filter(log =>
    log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredLogs.length / entriesPerPage);
  const displayedLogs = filteredLogs.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  
  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast({
        title: "No Records",
        description: "There are no logs to export",
        variant: "destructive"
      });
      return;
    }
    
    const csvContent = [
      ['ID', 'Username', 'Status', 'Timestamp'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.username,
        log.status,
        log.timestamp
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `login-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `${filteredLogs.length} log(s) exported to CSV`
    });
  };
  
  const handleClearLogs = async () => {
    if (!isConnected) {
      setLogs([]);
      toast({
        title: "Logs Cleared",
        description: "All logs have been cleared"
      });
      return;
    }
    
    if (logs.length === 0) {
      toast({
        title: "No Logs",
        description: "There are no logs to clear",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const client = getActiveClient();
      const { error } = await client
        .from('login_logs')
        .delete()
        .gt('id', 0); // Delete all logs
      
      if (error) {
        console.error("Error clearing logs:", error);
        toast({
          title: "Failed to clear logs",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setLogs([]);
      toast({
        title: "Logs Cleared",
        description: "All logs have been cleared successfully"
      });
    } catch (error) {
      console.error("Failed to clear logs:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Login Logs</h1>
        <p className="text-gray-400">View login activity and authentication status</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-gray-700 text-white"
            onClick={handleExport}
            disabled={logs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export Logs
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
          >
            <TrashIcon className="mr-2 h-4 w-4" /> Clear All Logs
          </Button>
        </div>
        
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
              placeholder="Search logs..."
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
        <Table>
          <TableHeader className="bg-[#0a0a0a]">
            <TableRow className="hover:bg-[#0a0a0a] border-gray-800">
              <TableHead className="text-gray-300 w-20">ID</TableHead>
              <TableHead className="text-gray-300">Username</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading logs...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedLogs.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                  {isConnected ? "No logs found" : "Connect to Supabase to view logs"}
                </TableCell>
              </TableRow>
            ) : (
              displayedLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-[#151515] border-gray-800">
                  <TableCell className="text-white">{log.id}</TableCell>
                  <TableCell className="text-white">{log.username}</TableCell>
                  <TableCell className="text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      log.status.toLowerCase() === 'successful' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-white">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

export default LogsPage;
