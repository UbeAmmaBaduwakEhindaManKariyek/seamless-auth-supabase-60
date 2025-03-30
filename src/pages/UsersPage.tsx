
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, RefreshCw, Trash2, Edit, Download } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: number;
  username: string;
  subscription: string;
  expiredate: string;
  mobile_number: string;
  admin_approval: boolean;
  save_hwid: boolean;
  hwid_reset_count: number;
  max_devices: number;
  key: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: 'bishan',
      subscription: 'premium',
      expiredate: '2025-12-31',
      mobile_number: '123-456-7890',
      admin_approval: true,
      save_hwid: true,
      hwid_reset_count: 5,
      max_devices: 2,
      key: 'ABC123'
    },
    {
      id: 2,
      username: 'nethma',
      subscription: 'standard',
      expiredate: '2025-06-30',
      mobile_number: '987-654-3210',
      admin_approval: false,
      save_hwid: false,
      hwid_reset_count: 3,
      max_devices: 1,
      key: 'XYZ456'
    }
  ]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const { toast } = useToast();
  
  // New user form state
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    subscription: '',
    expiredate: format(new Date(), 'yyyy-MM-dd'),
    mobile_number: '',
    admin_approval: false,
    save_hwid: true,
    hwid_reset_count: 5,
    max_devices: 1,
    key: ''
  });
  
  const handleAddUser = () => {
    if (!newUser.username || !newUser.subscription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const user: User = {
      id: users.length + 1,
      username: newUser.username || '',
      subscription: newUser.subscription || 'standard',
      expiredate: newUser.expiredate || format(new Date(), 'yyyy-MM-dd'),
      mobile_number: newUser.mobile_number || '',
      admin_approval: newUser.admin_approval || false,
      save_hwid: newUser.save_hwid !== undefined ? newUser.save_hwid : true,
      hwid_reset_count: newUser.hwid_reset_count || 5,
      max_devices: newUser.max_devices || 1,
      key: newUser.key || `KEY${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };
    
    setUsers([...users, user]);
    setIsAddUserOpen(false);
    toast({
      title: "User Created",
      description: `User ${user.username} has been created successfully`
    });
    
    // Reset form
    setNewUser({
      username: '',
      subscription: '',
      expiredate: format(new Date(), 'yyyy-MM-dd'),
      mobile_number: '',
      admin_approval: false,
      save_hwid: true,
      hwid_reset_count: 5,
      max_devices: 1,
      key: ''
    });
  };
  
  const generateRandomKey = () => {
    setNewUser({
      ...newUser,
      key: `KEY${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    });
  };
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
        <p className="text-gray-400">Manage user accounts</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-4 md:items-center w-full md:w-auto">
          <Button 
            onClick={() => setIsAddUserOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create User
          </Button>
          <Button variant="outline" className="bg-[#1a1a1a] border-gray-700 text-white">
            <Download className="mr-2 h-4 w-4" /> Export Users
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete All Users
            </Button>
          </div>
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
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search users..."
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
              <TableHead className="text-gray-300">Subscription</TableHead>
              <TableHead className="text-gray-300">Expires</TableHead>
              <TableHead className="text-gray-300">Key</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-[#151515] border-gray-800">
                  <TableCell className="text-white">{user.id}</TableCell>
                  <TableCell className="font-medium text-white">{user.username}</TableCell>
                  <TableCell className="text-white">{user.subscription}</TableCell>
                  <TableCell className="text-white">{user.expiredate}</TableCell>
                  <TableCell className="text-white">{user.key}</TableCell>
                  <TableCell className="text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.admin_approval ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {user.admin_approval ? 'Approved' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="bg-[#101010] text-white border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new user with the following information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-300">Username</label>
              <Input 
                id="username" 
                placeholder="Enter username" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter password" 
                className="bg-[#1a1a1a] border-gray-700 text-white" 
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subscription" className="text-sm font-medium text-gray-300">Subscription</label>
              <Select 
                value={newUser.subscription} 
                onValueChange={(value) => setNewUser({...newUser, subscription: value})}
              >
                <SelectTrigger className="w-full bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectValue placeholder="Select a subscription" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="expiryDate" className="text-sm font-medium text-gray-300">Expiry Date</label>
              <Input 
                id="expiryDate" 
                type="date" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newUser.expiredate}
                onChange={(e) => setNewUser({...newUser, expiredate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="licenseKey" className="text-sm font-medium text-gray-300">License Key</label>
              <div className="flex gap-2">
                <Input 
                  id="licenseKey" 
                  placeholder="Generate or enter manually" 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={newUser.key}
                  onChange={(e) => setNewUser({...newUser, key: e.target.value})}
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
                  onClick={generateRandomKey}
                >
                  Generate
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="mobileNumber" className="text-sm font-medium text-gray-300">Mobile Number</label>
              <Input 
                id="mobileNumber" 
                placeholder="Enter mobile number" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newUser.mobile_number}
                onChange={(e) => setNewUser({...newUser, mobile_number: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="hwidResetCount" className="text-sm font-medium text-gray-300">HWID Reset Count</label>
              <Input 
                id="hwidResetCount" 
                type="number" 
                placeholder="5" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newUser.hwid_reset_count?.toString() || '5'}
                onChange={(e) => setNewUser({...newUser, hwid_reset_count: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="maxDevices" className="text-sm font-medium text-gray-300">Max Devices</label>
              <Input 
                id="maxDevices" 
                type="number" 
                placeholder="1" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newUser.max_devices?.toString() || '1'}
                onChange={(e) => setNewUser({...newUser, max_devices: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex items-center justify-start space-x-4 mt-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="admin-approval" 
                  checked={newUser.admin_approval}
                  onCheckedChange={(checked) => setNewUser({...newUser, admin_approval: checked})}
                />
                <Label htmlFor="admin-approval" className="text-gray-300">Admin Approval</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="save-hwid" 
                  checked={newUser.save_hwid}
                  onCheckedChange={(checked) => setNewUser({...newUser, save_hwid: checked})}
                />
                <Label htmlFor="save-hwid" className="text-gray-300">Save HWID</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsAddUserOpen(false)}
              className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
