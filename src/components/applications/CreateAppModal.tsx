import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { getActiveClient, fromTable } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Application } from '@/types/applications';

interface CreateAppModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (newApp: Application) => void;
  isCreating: boolean;
}

const CreateAppModal: React.FC<CreateAppModalProps> = ({ open, onClose, onCreate, isCreating }) => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [errors, setErrors] = useState<{
    name?: string;
    version?: string;
  }>({});
  const { toast } = useToast();
  const supabase = getActiveClient();

  // Fetch the latest app version when the modal opens
  useEffect(() => {
    if (open) {
      fetchLatestAppVersion();
    }
  }, [open]);

  const fetchLatestAppVersion = async () => {
    try {
      const { data, error } = await fromTable('app_version')
        .select('version')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setVersion(data.version);
      } else {
        setVersion('1.0');
      }
    } catch (err) {
      console.error("Error fetching app version:", err);
      toast({
        title: "Warning",
        description: "Could not fetch latest app version. Using default version.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: {name?: string; version?: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Application name is required';
    }
    
    if (!version.trim()) {
      newErrors.version = 'Version is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Generate a random app secret
    const appSecret = generateRandomAppSecret();
    
    // Create a new application record
    createApplication(name, version, appSecret);
  };
  
  const generateRandomAppSecret = () => {
    return Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };
  
  const createApplication = async (name: string, version: string, appSecret: string) => {
    try {
      const { data, error } = await fromTable('applications_registry')
        .insert({
          name,
          version,
          app_secret: appSecret,
          owner_id: Math.random().toString(36).slice(2, 12), // Generate a random owner ID for demo
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Call the onCreate callback with the new application
      onCreate(data as Application);
      
      // Reset form fields
      setName('');
      setVersion('1.0');
      setErrors({});
      
    } catch (err) {
      console.error("Error creating application:", err);
      toast({
        title: "Error",
        description: "Failed to create application. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleClose = () => {
    setName('');
    setVersion('1.0');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#121212] text-white border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Create New Application</DialogTitle>
          <DialogDescription className="text-gray-400">
            Fill in the details to create a new application
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">Application Name</Label>
            <Input
              id="app-name"
              placeholder="My Application"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="app-version">Version</Label>
            <Input
              id="app-version"
              placeholder="1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
            {errors.version && <p className="text-red-400 text-xs">{errors.version}</p>}
            <p className="text-xs text-gray-400">
              This will use the latest version from your app settings.
            </p>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAppModal;
