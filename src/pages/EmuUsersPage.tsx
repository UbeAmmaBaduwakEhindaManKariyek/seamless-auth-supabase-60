
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Github, Search, Edit, Trash, UserPlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface EmuUser {
  username: string;
  password: string;
  motherboard_serial: string;
  expiration_date: string;
}

const EmuUsersPage: React.FC = () => {
  const [emuUsers, setEmuUsers] = useState<EmuUser[]>([]);
  const [githubToken, setGithubToken] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EmuUser | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<EmuUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<EmuUser>>({
    username: '',
    password: '',
    motherboard_serial: '',
    expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const usersPerPage = 10;
  
  // Filter users based on search query
  const filteredUsers = emuUsers.filter(user => {
    if (!searchQuery) return true;
    
    return (
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.motherboard_serial.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (activePage - 1) * usersPerPage,
    activePage * usersPerPage
  );
  
  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery]);
  
  // Simulated fetch users from GitHub
  const fetchUsers = () => {
    if (!githubUrl || !githubToken) {
      toast({
        title: "Missing Information",
        description: "Please provide both GitHub URL and token",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      setIsLoading(false);
      
      // Mock data for demo purposes
      const mockUsers: EmuUser[] = [
        {
          username: "bishan",
          password: "bishan@1505",
          motherboard_serial: "ABC123",
          expiration_date: "2025-12-31"
        },
        {
          username: "nethma",
          password: "@nethmabaduwak",
          motherboard_serial: "",
          expiration_date: "2025-12-31"
        }
      ];
      
      setEmuUsers(mockUsers);
      
      toast({
        title: "Users Fetched",
        description: `Successfully fetched ${mockUsers.length} users from GitHub`
      });
    }, 1500);
  };
  
  const openCreateUserDialog = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      motherboard_serial: '',
      expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setUserDialogOpen(true);
  };

  const openEditUserDialog = (user: EmuUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      motherboard_serial: user.motherboard_serial,
      expiration_date: user.expiration_date
    });
    setUserDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingUser) {
        // Update existing user
        const updatedUsers = emuUsers.map(user => 
          user.username === editingUser.username 
            ? { ...user, ...formData, password: formData.password || user.password } 
            : user
        );
        setEmuUsers(updatedUsers);
        
        toast({
          title: "User updated",
          description: `User ${formData.username} has been updated successfully.`,
        });
      } else {
        // Create new user
        if (!formData.password) {
          throw new Error("Password is required");
        }
        
        const newUser = {
          username: formData.username || '',
          password: formData.password || '',
          motherboard_serial: formData.motherboard_serial || '',
          expiration_date: formData.expiration_date || new Date().toISOString().split('T')[0]
        };
        
        setEmuUsers([...emuUsers, newUser]);
        
        toast({
          title: "User created",
          description: `User ${formData.username} has been created successfully.`,
        });
      }

      setUserDialogOpen(false);
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

  const confirmDelete = (user: EmuUser) => {
    setUserToDelete(user);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUsers = emuUsers.filter(user => user.username !== userToDelete.username);
      setEmuUsers(updatedUsers);
      
      toast({
        title: "User deleted",
        description: `User ${userToDelete.username} has been deleted successfully.`,
      });
      
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6 bg-[#0a0a0a] p-4 md:p-6 rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-200">Emu Users</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto text-white" 
          onClick={openCreateUserDialog}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>
      
      <Card className="bg-[#101010] border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">GitHub Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Connect to GitHub to fetch user data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="githubUrl" className="text-sm font-medium text-gray-300">GitHub URL</label>
            <Input 
              id="githubUrl" 
              placeholder="https://raw.githubusercontent.com/username/repo/branch/file.json" 
              className="bg-[#1a1a1a] border-gray-700 text-white"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="githubToken" className="text-sm font-medium text-gray-300">GitHub Token</label>
            <Input 
              id="githubToken" 
              placeholder="github_pat_..." 
              className="bg-[#1a1a1a] border-gray-700 text-white"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={fetchUsers}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Fetching Users...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" /> Fetch Users from GitHub
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="bg-[#101010] border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-white">Emu Users List</CardTitle>
          <CardDescription className="text-gray-400">
            {emuUsers.length} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
            <Input
              placeholder="Search by username or serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-gray-700 text-white"
            />
          </div>
          
          {isMobile ? (
            // Mobile view - card based
            <div className="space-y-4">
              {currentUsers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  {emuUsers.length === 0 ? 
                    "No users found. Configure GitHub and fetch users to get started." : 
                    "No users match your search criteria."}
                </div>
              ) : (
                currentUsers.map((user, index) => (
                  <div key={index} className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
                    <h3 className="text-white font-medium mb-2">{user.username}</h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>Password: {user.password}</div>
                      <div>Serial: {user.motherboard_serial || 'N/A'}</div>
                      <div>Expires: {user.expiration_date}</div>
                    </div>
                    <div className="flex gap-2 justify-end mt-3">
                      <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => openEditUserDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => confirmDelete(user)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Desktop view - table based
            <div className="overflow-x-auto">
              <Table className="border border-gray-800 rounded-md w-full">
                <TableHeader className="bg-[#1a1a1a]">
                  <TableRow className="hover:bg-[#1a1a1a] border-gray-800">
                    <TableHead className="text-gray-300">Username</TableHead>
                    <TableHead className="text-gray-300">Password</TableHead>
                    <TableHead className="text-gray-300">Motherboard Serial</TableHead>
                    <TableHead className="text-gray-300">Expiration Date</TableHead>
                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.length === 0 ? (
                    <TableRow className="hover:bg-[#151515] border-gray-800">
                      <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                        {emuUsers.length === 0 ? 
                          "No users found. Configure GitHub and fetch users to get started." : 
                          "No users match your search criteria."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentUsers.map((user, index) => (
                      <TableRow key={index} className="border-t border-gray-800 hover:bg-[#151515]">
                        <TableCell className="text-white">{user.username}</TableCell>
                        <TableCell className="text-white">{user.password}</TableCell>
                        <TableCell className="text-white">{user.motherboard_serial || 'N/A'}</TableCell>
                        <TableCell className="text-white">{user.expiration_date}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => openEditUserDialog(user)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:ml-2">Edit</span>
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => confirmDelete(user)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:ml-2">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-gray-300">
              <Button 
                variant="outline" 
                onClick={() => setActivePage(Math.max(1, activePage - 1))}
                disabled={activePage === 1}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                size={isMobile ? "sm" : "default"}
              >
                Previous
              </Button>
              <span className={isMobile ? "text-sm" : ""}>
                Page {activePage} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setActivePage(Math.min(totalPages, activePage + 1))}
                disabled={activePage === totalPages}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                size={isMobile ? "sm" : "default"}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* User Create/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="bg-[#121212] text-white border-gray-800 max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingUser ? 'Update user information' : 'Create a new user with the following information.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
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
                <Label htmlFor="motherboard_serial">Motherboard Serial</Label>
                <Input
                  id="motherboard_serial"
                  name="motherboard_serial"
                  value={formData.motherboard_serial || ''}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiry Date</Label>
                <Input
                  id="expiration_date"
                  name="expiration_date"
                  type="date"
                  value={formData.expiration_date || ''}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  required
                />
              </div>
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
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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

export default EmuUsersPage;
