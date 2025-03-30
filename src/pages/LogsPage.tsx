
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2 } from 'lucide-react';

interface Log {
  id: number;
  username: string;
  status: string;
  timestamp: string;
}

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([
    { id: 1, username: 'bishan', status: 'Success', timestamp: '2023-06-15 14:32:45' },
    { id: 2, username: 'nethma', status: 'Failed', timestamp: '2023-06-15 15:10:22' },
    { id: 3, username: 'user123', status: 'Success', timestamp: '2023-06-15 15:45:12' },
    { id: 4, username: 'testuser', status: 'Failed', timestamp: '2023-06-15 16:02:33' },
    { id: 5, username: 'admin', status: 'Success', timestamp: '2023-06-15 16:30:05' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const { toast } = useToast();
  
  const handleClearLogs = () => {
    setLogs([]);
    toast({
      title: "Logs Cleared",
      description: "All logs have been cleared successfully"
    });
  };
  
  const filteredLogs = logs.filter(log => 
    log.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Logs</h1>
        <p className="text-gray-400">View application login logs</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Button 
          variant="destructive"
          onClick={handleClearLogs}
          disabled={logs.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Clear All Logs
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
              placeholder="Search logs..."
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
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs
                .slice(0, entriesPerPage)
                .map((log) => (
                  <TableRow key={log.id} className="hover:bg-[#151515] border-gray-800">
                    <TableCell className="text-white">{log.id}</TableCell>
                    <TableCell className="font-medium text-white">{log.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === 'Success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-white">{log.timestamp}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LogsPage;
