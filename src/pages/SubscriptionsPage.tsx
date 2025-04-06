import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { getActiveClient, fromTable } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Subscription {
  id: string;
  name: string;
  description?: string;
  price?: number;
  is_active?: boolean;
  created_at?: string;
}

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isCreateSubscriptionOpen, setIsCreateSubscriptionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [newSubscription, setNewSubscription] = useState<{ 
    name: string; 
    description: string; 
    price: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    price: '0',
    is_active: true
  });
  
  const { toast } = useToast();
  const { isConnected } = useAuth();
  
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!isConnected) {
        setSubscriptions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const client = getActiveClient();
        const { data, error } = await fromTable('subscription_types')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching subscriptions:", error);
          toast({
            title: "Failed to load subscriptions",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setSubscriptions(data);
        } else {
          // Mock data if no records found
          setSubscriptions([
            { 
              id: '1', 
              name: 'standard', 
              description: 'Standard subscription plan',
              price: 9.99,
              is_active: true,
              created_at: new Date().toISOString()
            },
            { 
              id: '2', 
              name: 'premium', 
              description: 'Premium subscription with additional features',
              price: 19.99,
              is_active: true,
              created_at: new Date().toISOString()
            },
            { 
              id: '3', 
              name: 'enterprise', 
              description: 'Enterprise-level subscription',
              price: 49.99,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
        toast({
          title: "Error",
          description: "Failed to load subscription data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscriptions();
  }, [isConnected, toast]);
  
  const handleCreateSubscription = async () => {
    if (!newSubscription.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a subscription name",
        variant: "destructive"
      });
      return;
    }
    
    if (subscriptions.some(sub => sub.name === newSubscription.name)) {
      toast({
        title: "Duplicate Subscription",
        description: "A subscription with that name already exists",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isConnected) {
        const client = getActiveClient();
        const { data, error } = await fromTable('subscription_types')
          .insert({
            name: newSubscription.name,
            description: newSubscription.description || null,
            price: parseFloat(newSubscription.price) || 0,
            is_active: newSubscription.is_active
          })
          .select();
        
        if (error) {
          console.error("Error creating subscription:", error);
          toast({
            title: "Failed to create subscription",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setSubscriptions(prev => [data[0], ...prev]);
        }
      } else {
        // Mock creation for demo
        const newSub: Subscription = {
          id: Math.random().toString(36).substring(2, 9),
          name: newSubscription.name,
          description: newSubscription.description,
          price: parseFloat(newSubscription.price) || 0,
          is_active: newSubscription.is_active,
          created_at: new Date().toISOString()
        };
        
        setSubscriptions(prev => [newSub, ...prev]);
      }
      
      setIsCreateSubscriptionOpen(false);
      toast({
        title: "Subscription Created",
        description: `Subscription "${newSubscription.name}" has been created successfully`
      });
      
      // Reset form
      setNewSubscription({
        name: '',
        description: '',
        price: '0',
        is_active: true
      });
    } catch (error) {
      console.error("Failed to create subscription:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAll = async () => {
    if (subscriptions.length === 0) {
      toast({
        title: "No Subscriptions",
        description: "There are no subscriptions to delete",
        variant: "destructive"
      });
      return;
    }
    
    if (!isConnected) {
      setSubscriptions([]);
      toast({
        title: "Subscriptions Deleted",
        description: "All subscriptions have been deleted"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const client = getActiveClient();
      const { error } = await client
        .from('subscription_types')
        .delete()
        .neq('id', '0'); // Delete all records
      
      if (error) {
        console.error("Error deleting subscriptions:", error);
        toast({
          title: "Failed to delete subscriptions",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setSubscriptions([]);
      toast({
        title: "Subscriptions Deleted",
        description: "All subscriptions have been deleted"
      });
    } catch (error) {
      console.error("Failed to delete subscriptions:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscriptions</h1>
        <p className="text-gray-400">Manage subscription levels and tiers</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-4 md:items-center w-full md:w-auto">
          <Button 
            onClick={() => setIsCreateSubscriptionOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create Subscription
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDeleteAll}
            disabled={isLoading || subscriptions.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete All Subscriptions
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
              placeholder="Search subscriptions..."
              className="bg-[#1a1a1a] border-gray-700 text-white"
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
              <TableHead className="text-gray-300">Subscription Name</TableHead>
              <TableHead className="text-gray-300">Description</TableHead>
              <TableHead className="text-gray-300">Price</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Created</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading subscriptions...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSubscriptions.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                  {searchTerm ? "No matching subscriptions found" : "No subscriptions found. Create a subscription to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions
                .slice(0, entriesPerPage)
                .map((subscription) => (
                  <TableRow key={subscription.id} className="hover:bg-[#151515] border-gray-800">
                    <TableCell className="font-medium text-white">{subscription.name}</TableCell>
                    <TableCell className="text-white">{subscription.description || 'N/A'}</TableCell>
                    <TableCell className="text-white">${subscription.price?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="text-white">
                      <span className={`px-2 py-1 rounded-full text-xs ${subscription.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {subscription.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-white">
                      {subscription.created_at && format(new Date(subscription.created_at), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
      
      <Dialog open={isCreateSubscriptionOpen} onOpenChange={setIsCreateSubscriptionOpen}>
        <DialogContent className="bg-[#101010] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Subscription</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new subscription level or tier.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subscriptionName" className="text-sm font-medium text-gray-300">Subscription Name</label>
              <Input 
                id="subscriptionName" 
                placeholder="e.g. Premium" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newSubscription.name}
                onChange={(e) => setNewSubscription({...newSubscription, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-300">Description</label>
              <Input 
                id="description" 
                placeholder="Description of the subscription" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newSubscription.description}
                onChange={(e) => setNewSubscription({...newSubscription, description: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium text-gray-300">Price</label>
              <Input 
                id="price" 
                type="number"
                min="0" 
                step="0.01"
                placeholder="0.00" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newSubscription.price}
                onChange={(e) => setNewSubscription({...newSubscription, price: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="is-active" 
                checked={newSubscription.is_active}
                onCheckedChange={(checked) => setNewSubscription({...newSubscription, is_active: checked})}
              />
              <Label htmlFor="is-active" className="text-gray-300">Active</Label>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateSubscriptionOpen(false)}
              className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSubscription}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsPage;
