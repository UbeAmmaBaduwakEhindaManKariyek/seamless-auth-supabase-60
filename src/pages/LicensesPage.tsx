
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Download, Trash2, Clock, FileDown } from 'lucide-react';

interface License {
  id: string;
  key: string;
  creationDate: string;
  generatedBy: string;
  duration: string;
  used: boolean;
}

const LicensesPage: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isCreateKeysOpen, setIsCreateKeysOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [keyAmount, setKeyAmount] = useState(10);
  const [keyDuration, setKeyDuration] = useState('30');
  const [keyDurationType, setKeyDurationType] = useState('days');
  
  const { toast } = useToast();
  
  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) key += '-';
    }
    return key;
  };
  
  const handleCreateKeys = () => {
    const newKeys: License[] = [];
    
    for (let i = 0; i < keyAmount; i++) {
      newKeys.push({
        id: Math.random().toString(36).substring(2, 9),
        key: generateRandomKey(),
        creationDate: new Date().toISOString().split('T')[0],
        generatedBy: 'Admin',
        duration: `${keyDuration} ${keyDurationType}`,
        used: false
      });
    }
    
    setLicenses([...licenses, ...newKeys]);
    setIsCreateKeysOpen(false);
    
    toast({
      title: "License Keys Created",
      description: `${keyAmount} license keys generated successfully`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Licenses</h1>
        <p className="text-gray-400">Manage license keys for your application</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-4 md:items-center w-full md:w-auto">
          <Button 
            onClick={() => setIsCreateKeysOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create Keys
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => toast({
              title: "Feature",
              description: "This feature would add time to unused keys"
            })}
          >
            <Clock className="mr-2 h-4 w-4" /> Add Time To Unused Keys
          </Button>
          <Button variant="outline" className="bg-[#1a1a1a] border-gray-700 text-white">
            <Download className="mr-2 h-4 w-4" /> Export Keys
          </Button>
        </div>
        
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
            <Input
              placeholder="Search keys..."
              className="bg-[#1a1a1a] border-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <Button variant="destructive" className="w-full md:w-auto">
            <Trash2 className="mr-2 h-4 w-4" /> Delete All Keys
          </Button>
          <Button variant="destructive" className="w-full md:w-auto">
            <Trash2 className="mr-2 h-4 w-4" /> Delete All Used Keys
          </Button>
          <Button variant="destructive" className="w-full md:w-auto">
            <Trash2 className="mr-2 h-4 w-4" /> Delete All Unused Keys
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#0a0a0a]">
            <TableRow className="hover:bg-[#0a0a0a] border-gray-800">
              <TableHead className="text-gray-300 w-20">Select</TableHead>
              <TableHead className="text-gray-300">Key</TableHead>
              <TableHead className="text-gray-300">Creation Date</TableHead>
              <TableHead className="text-gray-300">Generated By</TableHead>
              <TableHead className="text-gray-300">Duration</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                  No license keys found. Create some keys to get started.
                </TableCell>
              </TableRow>
            ) : (
              licenses
                .filter(license => license.key.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, entriesPerPage)
                .map((license) => (
                  <TableRow key={license.id} className="hover:bg-[#151515] border-gray-800">
                    <TableCell>
                      <input type="checkbox" className="rounded bg-[#1a1a1a] border-gray-700 text-blue-600" />
                    </TableCell>
                    <TableCell className="font-medium text-white">{license.key}</TableCell>
                    <TableCell className="text-white">{license.creationDate}</TableCell>
                    <TableCell className="text-white">{license.generatedBy}</TableCell>
                    <TableCell className="text-white">{license.duration}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${license.used ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                        {license.used ? 'Used' : 'Unused'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <p className="text-center text-sm text-gray-500">
        <span className="text-blue-500">Blue</span> actions will show a confirmation. <span className="text-red-500">Red</span> actions will not show a confirmation!
      </p>
      
      <Dialog open={isCreateKeysOpen} onOpenChange={setIsCreateKeysOpen}>
        <DialogContent className="bg-[#101010] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create License Keys</DialogTitle>
            <DialogDescription className="text-gray-400">
              Generate new license keys for your users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="keyAmount" className="text-sm font-medium text-gray-300">Amount of Keys</label>
              <Input 
                id="keyAmount" 
                type="number" 
                min="1"
                max="1000"
                placeholder="10" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={keyAmount}
                onChange={(e) => setKeyAmount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label htmlFor="keyDuration" className="text-sm font-medium text-gray-300">Duration</label>
                <Input 
                  id="keyDuration" 
                  type="number"
                  min="1" 
                  placeholder="30" 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={keyDuration}
                  onChange={(e) => setKeyDuration(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 flex-1">
                <label htmlFor="durationType" className="text-sm font-medium text-gray-300">Duration Type</label>
                <Select value={keyDurationType} onValueChange={setKeyDurationType}>
                  <SelectTrigger className="w-full bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectValue placeholder="Select duration type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="bg-[#1a1a1a] p-4 rounded-md border border-gray-800">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Preview:</h4>
                <div className="text-green-400 font-mono text-xs">
                  {generateRandomKey()}<br />
                  {generateRandomKey()}<br />
                  {generateRandomKey()}
                  <div className="text-gray-500 mt-2">+ {keyAmount > 3 ? (keyAmount - 3) : 0} more keys</div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateKeysOpen(false)}
              className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateKeys}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generate Keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicensesPage;
