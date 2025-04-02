
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CreateAppModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, version: string) => void;
  isCreating: boolean;
}

const CreateAppModal: React.FC<CreateAppModalProps> = ({ open, onClose, onCreate, isCreating }) => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [errors, setErrors] = useState<{
    name?: string;
    version?: string;
  }>({});

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
    
    // Submit
    onCreate(name, version);
  };
  
  const handleClose = () => {
    setName('');
    setVersion('1.0');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
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
              className="bg-gray-800 border-gray-700 text-white"
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
              className="bg-gray-800 border-gray-700 text-white"
            />
            {errors.version && <p className="text-red-400 text-xs">{errors.version}</p>}
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
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
