
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, MoreHorizontal } from 'lucide-react';

interface Subscription {
  id: string;
  name: string;
  licenseLevel: number;
}

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    { id: '1', name: 'default', licenseLevel: 1 }
  ]);
  const [isCreateSubscriptionOpen, setIsCreateSubscriptionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [newSubscription, setNewSubscription] = useState<{ name: string; licenseLevel: string }>({
    name: '',
    licenseLevel: '1'
  });
  
  const { toast } = useToast();
  
  const handleCreateSubscription = () => {
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
    
    const subscription: Subscription = {
      id: Math.random().toString(36).substring(2, 9),
      name: newSubscription.name,
      licenseLevel: parseInt(newSubscription.licenseLevel)
    };
    
    setSubscriptions([...subscriptions, subscription]);
    setIsCreateSubscriptionOpen(false);
    toast({
      title: "Subscription Created",
      description: `Subscription "${subscription.name}" has been created successfully`
    });
    
    // Reset form
    setNewSubscription({
      name: '',
      licenseLevel: '1'
    });
  };
  
  const handleDeleteAll = () => {
    if (subscriptions.length === 0) {
      toast({
        title: "No Subscriptions",
        description: "There are no subscriptions to delete",
        variant: "destructive"
      });
      return;
    }
    
    setSubscriptions([]);
    toast({
      title: "Subscriptions Deleted",
      description: "All subscriptions have been deleted"
    });
  };
  
  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create Subscription
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDeleteAll}
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
              <TableHead className="text-gray-300 w-20">Select</TableHead>
              <TableHead className="text-gray-300">Subscription Name</TableHead>
              <TableHead className="text-gray-300">License Level</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow className="hover:bg-[#151515] border-gray-800">
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                  No subscriptions found. Create a subscription to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions
                .slice(0, entriesPerPage)
                .map((subscription) => (
                  <TableRow key={subscription.id} className="hover:bg-[#151515] border-gray-800">
                    <TableCell>
                      <input type="checkbox" className="rounded bg-[#1a1a1a] border-gray-700 text-blue-600" />
                    </TableCell>
                    <TableCell className="font-medium text-white">{subscription.name}</TableCell>
                    <TableCell className="text-white">{subscription.licenseLevel}</TableCell>
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
              <label htmlFor="licenseLevel" className="text-sm font-medium text-gray-300">License Level</label>
              <Input 
                id="licenseLevel" 
                type="number"
                min="1" 
                placeholder="1" 
                className="bg-[#1a1a1a] border-gray-700 text-white"
                value={newSubscription.licenseLevel}
                onChange={(e) => setNewSubscription({...newSubscription, licenseLevel: e.target.value})}
              />
              <p className="text-xs text-gray-400">Higher numbers indicate higher tier subscriptions.</p>
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
            >
              Create Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsPage;
