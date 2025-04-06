
import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, UserPlus, RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  username: string;
  subscription: string;
  admin_approval: boolean;
  banned: boolean;
  expiredate: string | null;
  mobile_number: string | null;
}

const UsersPage = () => {
  const { data: users, isLoading, error, isConnected } = useSupabaseData<User>('users', {
    orderBy: { column: 'id', ascending: false }
  });
  const { user } = useAuth();
  const [activePage, setActivePage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'banned'>('all');
  const usersPerPage = 10;

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
    <div className="space-y-6 bg-[#0a0a0a] p-6 rounded-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-200">Users</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
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
              />
            </TabsContent>
            
            <TabsContent value="approved" className="space-y-4">
              <UserTable 
                users={currentUsers}
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={setActivePage}
              />
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              <UserTable 
                users={currentUsers}
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={setActivePage}
              />
            </TabsContent>
            
            <TabsContent value="banned" className="space-y-4">
              <UserTable 
                users={currentUsers}
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={setActivePage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface UserTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No users found matching the current filter.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-gray-300">Username</th>
              <th className="py-3 px-4 text-left font-medium text-gray-300">Subscription</th>
              <th className="py-3 px-4 text-left font-medium text-gray-300">Status</th>
              <th className="py-3 px-4 text-left font-medium text-gray-300">Expiration</th>
              <th className="py-3 px-4 text-left font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray-800 hover:bg-[#1e1e1e]">
                <td className="py-3 px-4 text-gray-200">{user.username}</td>
                <td className="py-3 px-4 text-gray-200">{user.subscription || 'default'}</td>
                <td className="py-3 px-4">
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
                </td>
                <td className="py-3 px-4 text-gray-200">
                  {user.expiredate ? new Date(user.expiredate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive">
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
