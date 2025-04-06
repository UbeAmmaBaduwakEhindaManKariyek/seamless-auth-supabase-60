
import React, { useState, useEffect } from 'react';
import { useSupabaseData, updateSupabaseData, deleteSupabaseData, saveSupabaseData } from '@/hooks/useSupabaseData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, UserPlus, RefreshCw, Settings, Ban, Edit, Trash, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface User {
  id: number;
  username: string;
  subscription: string;
  admin_approval: boolean;
  banned: boolean;
  expiredate: string | null;
  mobile_number: string | null;
  hwid_reset_count?: number;
  save_hwid?: boolean;
  max_devices?: number;
  password?: string;
}

interface Subscription {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_active: boolean;
}

const UsersPage = () => {
  const { data: users, isLoading, error, isConnected } = useSupabaseData<User>('users', {
    orderBy: { column: 'id', ascending: false }
  });
  const { data: subscriptions } = useSupabaseData<Subscription>('subscription_types', {
    filter: [{ column: 'is_active', operator: 'eq', value: true }]
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const [activePage, setActivePage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'banned'>('all');
  const usersPerPage = 10;
  
  // Modal states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    subscription: '',
    mobile_number: '',
    expiredate: new Date().toISOString().split('T')[0],
    hwid_reset_count: 5,
    max_devices: 1,
    admin_approval: false,
    save_hwid: true,
    banned: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Filter and paginate users
  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    if (filter === 'approved') return u.admin_approval === true;
    if (filter === 'pending') return u.admin_approval === false;
    if (filter === 'banned') return u.banned === true;
    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (activePage - 1) * usersPerPage,
    activePage * usersPerPage
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setActivePage(1);
  }, [filter]);

  const openCreateUserDialog = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      subscription: subscriptions.length > 0 ? subscriptions[0].name : '',
      mobile_number: '',
      expiredate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 days from now
      hwid_reset_count: 5,
      max_devices: 1,
      admin_approval: false,
      save_hwid: true,
      banned: false
    });
    setUserDialogOpen(true);
  };

  const openEditUserDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      subscription: user.subscription || '',
      mobile_number: user.mobile_number || '',
      expiredate: user.expiredate ? new Date(user.expiredate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hwid_reset_count: user.hwid_reset_count || 5,
      max_devices: user.max_devices || 1,
      admin_approval: user.admin_approval,
      save_hwid: user.save_hwid !== undefined ? user.save_hwid : true,
      banned: user.banned
    });
    setUserDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user
        const updateData: Partial<User> = { ...formData };
        delete updateData.password; // Don't update password unless specifically provided
        
        const result = await updateSupabaseData<User>(
          'users',
          updateData,
          'id',
          editingUser.id
        );

        if (result.error) {
          throw new Error(result.error.message);
        }

        toast({
          title: "User updated",
          description: `User ${formData.username} has been updated successfully.`,
        });
      } else {
        // Create new user
        if (!formData.password) {
          throw new Error("Password is required");
        }

        const result = await saveSupabaseData<User>('users', formData as User);

        if (result.error) {
          throw new Error(result.error.message);
        }

        toast({
          title: "User created",
          description: `User ${formData.username} has been created successfully.`,
        });
      }

      setUserDialogOpen(false);
      // Reload page to refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error saving user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const result = await deleteSupabaseData('users', 'id', userToDelete.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "User deleted",
        description: `User ${userToDelete.username} has been deleted successfully.`,
      });
      
      setConfirmDeleteOpen(false);
      // Reload page to refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleToggleBan = async (user: User) => {
    try {
      const result = await updateSupabaseData<User>(
        'users',
        { banned: !user.banned },
        'id',
        user.id
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: user.banned ? "User unbanned" : "User banned",
        description: `User ${user.username} has been ${user.banned ? 'unbanned' : 'banned'} successfully.`,
      });
      
      // Reload page to refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error toggling ban status:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold mb-6 text-white">Users</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>You need to connect to your Supabase database to view users.</span>
            <Button asChild className="w-fit">
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Go to Settings
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold mb-6 text-white">Users</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Users</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{error.message}</span>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="w-fit">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button asChild variant="outline" className="w-fit">
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Check Settings
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#0a0a0a] p-4 md:p-6 rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-200">Users</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto" onClick={openCreateUserDialog}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card className="bg-[#121212] border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">User Management</CardTitle>
          <CardDescription className="text-gray-400">
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="grid grid-cols-4 mb-6 bg-[#1a1a1a]">
              <TabsTrigger value="all" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">All Users</TabsTrigger>
              <TabsTrigger value="approved" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Approved</TabsTrigger>
              <TabsTrigger value="pending" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Pending</TabsTrigger>
              <TabsTrigger value="banned" className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Banned</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <UserTable 
                users={currentUsers}
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={setActivePage}
                onEdit={openEditUserDialog}
                onDelete={confirmDelete}
                onToggleBan={handleToggleBan}
              />
            </TabsContent>
            
            <TabsContent value="approved" className="space-y-4">
              <UserTable 
                users={currentUsers}
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={setActivePage}
                onEdit={openEditUserDialog}
                onDelete={confirmDelete}
                onToggleBan={handleToggleBan}
              />
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              <UserTable 
                users={currentUsers}
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={setActivePage}
                onEdit={openEditUserDialog}
                onDelete={confirmDelete}
                onToggleBan={handleToggleBan}
              />
            </TabsContent>
            
            <TabsContent value="banned" className="space-y-4">
              <UserTable 
                users={currentUsers}
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={setActivePage}
                onEdit={openEditUserDialog}
                onDelete={confirmDelete}
                onToggleBan={handleToggleBan}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Create/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="bg-[#121212] text-white border-gray-800 max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingUser ? 'Update user information' : 'Create a new user with the following information.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password {editingUser && "(leave blank to keep current)"}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  required={!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription</Label>
                <Select
                  value={formData.subscription || ''}
                  onValueChange={(value) => handleSelectChange('subscription', value)}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectValue placeholder="Select a subscription" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                    {subscriptions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.name}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiredate">Expiry Date</Label>
                <Input
                  id="expiredate"
                  name="expiredate"
                  type="date"
                  value={formData.expiredate || ''}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  name="mobile_number"
                  value={formData.mobile_number || ''}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hwid_reset_count">HWID Reset Count</Label>
                <Input
                  id="hwid_reset_count"
                  name="hwid_reset_count"
                  type="number"
                  value={formData.hwid_reset_count || 5}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_devices">Max Devices</Label>
                <Input
                  id="max_devices"
                  name="max_devices"
                  type="number"
                  value={formData.max_devices || 1}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin_approval">Admin Approval</Label>
                <Switch 
                  id="admin_approval"
                  checked={formData.admin_approval}
                  onCheckedChange={(checked) => handleSwitchChange('admin_approval', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="save_hwid">Save HWID</Label>
                <Switch 
                  id="save_hwid"
                  checked={formData.save_hwid}
                  onCheckedChange={(checked) => handleSwitchChange('save_hwid', checked)}
                />
              </div>
              
              {editingUser && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="banned">Banned</Label>
                  <Switch 
                    id="banned"
                    checked={formData.banned}
                    onCheckedChange={(checked) => handleSwitchChange('banned', checked)}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setUserDialogOpen(false)}
                className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-[#2a2a2a]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingUser ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingUser ? 'Update User' : 'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="bg-[#121212] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setConfirmDeleteOpen(false)}
              className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-[#2a2a2a]"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface UserTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleBan: (user: User) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  currentPage, 
  totalPages, 
  onPageChange,
  onEdit,
  onDelete,
  onToggleBan
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No users found matching the current filter.
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="border border-gray-800 rounded-md w-full">
          <TableHeader className="bg-[#1a1a1a]">
            <TableRow className="hover:bg-[#1a1a1a]">
              <TableHead className="text-gray-300 w-[60px]">ID</TableHead>
              <TableHead className="text-gray-300">Username</TableHead>
              <TableHead className="text-gray-300">Subscription</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Expiration</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-t border-gray-800 hover:bg-[#1e1e1e]">
                <TableCell className="text-gray-200">{user.id}</TableCell>
                <TableCell className="text-gray-200">{user.username}</TableCell>
                <TableCell className="text-gray-200">{user.subscription || 'default'}</TableCell>
                <TableCell>
                  {user.banned ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-900 text-red-200">
                      Banned
                    </span>
                  ) : user.admin_approval ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-900 text-green-200">
                      Approved
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-900 text-yellow-200">
                      Pending
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-gray-200">
                  {formatDate(user.expiredate)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => onEdit(user)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">Edit</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant={user.banned ? "outline" : "destructive"} 
                      className={user.banned ? "border-gray-700 text-gray-300 hover:bg-gray-800" : ""}
                      onClick={() => onToggleBan(user)}
                    >
                      {user.banned ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:ml-2">Unban</span>
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:ml-2">Ban</span>
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(user)}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-gray-300">
          <Button 
            variant="outline" 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
};

export default UsersPage;
