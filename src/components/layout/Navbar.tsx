
import React from 'react';
import { Bell, Link2, Menu, X, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavbarProps {
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, toggleMobileMenu, isMobileMenuOpen }) => {
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="bg-card border-b border-border py-3 px-4 md:px-6 flex justify-between items-center fixed w-full top-0 z-40">
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleSidebar} 
          className="p-1 rounded-md hover:bg-gray-800 transition-colors hidden md:flex"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <button 
          id="mobile-menu-button"
          onClick={toggleMobileMenu}
          className="mobile-menu-button"
          aria-label="Open Mobile Menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        
        <div className="text-lg font-bold hidden sm:block">Regz Login System</div>
      </div>
      
      <div className="hidden md:flex mx-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="w-full pl-8 bg-muted border-gray-700" 
            placeholder="Search..." 
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
        
        <Avatar className="h-8 w-8 bg-blue-600 hidden sm:flex">
          <AvatarFallback>{user?.username ? getInitials(user.username) : 'U'}</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
};

export default Navbar;
