import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Search, RefreshCw, Trash2, Edit, Download, Loader2, Ban, Check } from 'lucide-react';
import { format } from 'date-fns';
import { getActiveClient } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  password: string;
  banned?: boolean;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const { toast } = useToast();
  const { isConnected } = useAuth();
  
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    subscription: '',
    expiredate: format(new Date(), 'yyyy-MM-dd'),
    mobile_number: '',
    admin_approval: false,
    save_hwid: true,
    hwid_reset_count: 5,
    max_devices: 1,
    key: '',
    password: '',
    banned: false
  });

  const [editUser, setEditUser] = useState<User | null>(null);
  
  const [password, setPassword] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isConnected) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const client = getActiveClient();
        const { data, error } = await client
          .from('users')
          .select('*');
        
        if (error) {
          console.error("Error fetching users:", error);
          toast({
            title: "Failed to load users",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setUsers(data);
          console.log("Fetched users:", data);
        } else {
          console.log("No users found or empty response");
          setUsers([
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
              key: 'ABC123',
              password: 'password123',
              banned: false
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
              key: 'XYZ456',
              password: 'password456',
              banned: true
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please check your connection.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isConnected, toast]);
  
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.subscription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (!password) {
      toast({
        title: "Missing Password",
        description: "Please provide a password for the user",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const userToInsert = {
        username: newUser.username || '',
        subscription: newUser.subscription || 'standard',
        expiredate: newUser.expiredate || format(new Date(), 'yyyy-MM-dd'),
        mobile_number: newUser.mobile_number || '',
        admin_approval: newUser.admin_approval || false,
        save_hwid: newUser.save_hwid !== undefined ? newUser.save_hwid : true,
        hwid_reset_count: newUser.hwid_reset_count || 5,
        max_devices: newUser.max_devices || 1,
        key: newUser.key || `KEY${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        password: password,
        banned: newUser.banned || false
      };
      
      if (isConnected) {
        const client = getActiveClient();
        const { data, error } = await client
          .from('users')
          .insert(userToInsert)
          .select();
        
        if (error) {
          console.error("Error creating user:", error);
          toast({
            title: "Failed to create user",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setUsers(prev => [...prev, data[0] as User]);
        }
      } else {
        const newUserWithId = {
          ...userToInsert,
          id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1
        } as User;
        setUsers(prev => [...prev, newUserWithId]);
      }
      
      setIsAddUserOpen(false);
      toast({
        title: "User Created",
        description: `User ${userToInsert.username} has been created successfully`
      });
      
      setNewUser({
        username: '',
        subscription: '',
        expiredate: format(new Date(), 'yyyy-MM-dd'),
        mobile_number: '',
        admin_approval: false,
        save_hwid: true,
        hwid_reset_count: 5,
        max_devices: 1,
        key: '',
        password: '',
        banned: false
      });
      setPassword('');
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditUser = (user: User) => {
    setEditUser({ ...user });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    
    try {
      setIsLoading(true);
      
      if (isConnected) {
        const client = getActiveClient();
        const { error } = await client
          .from('users')
          .update({
            username: editUser.username,
            subscription: editUser.subscription,
            expiredate: editUser.expiredate,
            mobile_number: editUser.mobile_number,
            admin_approval: editUser.admin_approval,
            save_hwid: editUser.save_hwid,
            hwid_reset_count: editUser.hwid_reset_count,
            max_devices: editUser.max_devices,
            password: editUser.password,
            banned: editUser.banned
          })
          .eq('id', editUser.id);
        
        if (error) {
          console.error("Error updating user:", error);
          toast({
            title: "Failed to update user",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        setUsers(prev => 
          prev.map(user => 
            user.id === editUser.id ? editUser : user
          )
        );
      } else {
        setUsers(prev => 
          prev.map(user => 
            user.id === editUser.id ? editUser : user
          )
        );
      }
      
      setIsEditUserOpen(false);
      toast({
        title: "User Updated",
        description: `User ${editUser.username} has been updated successfully`
      });
      
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBan = async (user: User) => {
    try {
      const updatedBanStatus = !user.banned;
      
      if (isConnected) {
        const client = getActiveClient();
        const { error } = await client
          .from('users')
          .update({
            banned: updatedBanStatus
          })
          .eq('id', user.id);
        
        if (error) {
          console.error("Error updating ban status:", error);
          toast({
            title: "Failed to update ban status",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
      }
      
      setUsers(prev => 
        prev.map(u => 
          u.id === user.id ? { ...u, banned: updatedBanStatus } : u
        )
      );
      
      toast({
        title: updatedBanStatus ? "User Banned" : "User Unbanned",
        description: `${user.username} has been ${updatedBanStatus ? 'banned' : 'unbanned'}`
      });
      
    } catch (error) {
      console.error("Error toggling ban status:", error);
      toast({
        title: "Error",
        description: "Failed to update ban status",
        variant: "destructive"
      });
    }
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
      
      <div className="rounded-md border border-gray-800 overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#0a0a0a]">
            <TableRow className="hover:bg-[#0a0a0a] border-gray-800">
              <TableHead className="text-gray-300 w-20">ID</TableHead>
              <TableHead className="text-gray-300">Username</TableHead>
              <TableHead className="text-gray-300">Subscription</TableHead>
              <TableHead className="text-gray-300">Expires</TableHead>
              <TableHead className="text-gray-300">Key</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Ban Status</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                  {isConnected ? "No users found" : "Connect to Supabase to view users"}
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
                  <TableCell className="text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${!user.banned ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {!user.banned ? 'Active' : 'Banned'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      onClick={() => handleOpenEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 ${user.banned ? 'text-green-400 hover:text-green-300 hover:bg-green-900/20' : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'}`}
                      onClick={() => handleToggleBan(user)}
                    >
                      {user.banned ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="bg-[#101010] text-white border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update user information.
            </DialogDescription>
          </DialogHeader>
          
          {editUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-username" className="text-sm font-medium text-gray-300">Username</label>
                <Input 
                  id="edit-username" 
                  placeholder="Enter username" 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={editUser.username}
                  onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-password" className="text-sm font-medium text-gray-300">Password</label>
                <Input 
                  id="edit-password" 
                  type="password" 
                  placeholder="Enter new password (leave blank to keep current)" 
                  className="bg-[#1a1a1a] border-gray-700 text-white" 
                  value={editUser.password || ''}
                  onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-subscription" className="text-sm font-medium text-gray-300">Subscription</label>
                <Select 
                  value={editUser.subscription} 
                  onValueChange={(value) => setEditUser({...editUser, subscription: value})}
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
                <label htmlFor="edit-expiryDate" className="text-sm font-medium text-gray-300">Expiry Date</label>
                <Input 
                  id="edit-expiryDate" 
                  type="date" 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={editUser.expiredate}
                  onChange={(e) => setEditUser({...editUser, expiredate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-mobileNumber" className="text-sm font-medium text-gray-300">Mobile Number</label>
                <Input 
                  id="edit-mobileNumber" 
                  placeholder="Enter mobile number" 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={editUser.mobile_number}
                  onChange={(e) => setEditUser({...editUser, mobile_number: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-hwidResetCount" className="text-sm font-medium text-gray-300">HWID Reset Count</label>
                <Input 
                  id="edit-hwidResetCount" 
                  type="number" 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={editUser.hwid_reset_count}
                  onChange={(e) => setEditUser({...editUser, hwid_reset_count: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-maxDevices" className="text-sm font-medium text-gray-300">Max Devices</label>
                <Input 
                  id="edit-maxDevices" 
                  type="number" 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={editUser.max_devices}
                  onChange={(e) => setEditUser({...editUser, max_devices: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit-admin-approval" 
                      checked={editUser.admin_approval}
                      onCheckedChange={(checked) => setEditUser({...editUser, admin_approval: checked})}
                    />
                    <Label htmlFor="edit-admin-approval" className="text-gray-300">Admin Approval</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit-save-hwid" 
                      checked={editUser.save_hwid}
                      onCheckedChange={(checked) => setEditUser({...editUser, save_hwid: checked})}
                    />
                    <Label htmlFor="edit-save-hwid" className="text-gray-300">Save HWID</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit-banned" 
                      checked={editUser.banned}
                      onCheckedChange={(checked) => setEditUser({...editUser, banned: checked})}
                    />
                    <Label htmlFor="edit-banned" className="text-gray-300">Banned</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsEditUserOpen(false)}
              className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
