
import React, { useState } from 'react';
import { Bell, Link2, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Drawer, DrawerTrigger } from '@/components/ui/drawer';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-[#101010] text-white py-4 px-6 flex justify-between items-center fixed w-full top-0 z-40">
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleSidebar} 
          className="p-1 rounded-md hover:bg-gray-800 transition-colors hidden md:block"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <DrawerTrigger asChild className="md:hidden">
          <button 
            className="p-1 rounded-md hover:bg-gray-800 transition-colors"
            aria-label="Open Mobile Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </DrawerTrigger>
        
        <div className="text-xl font-bold">Regz Login System</div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Bell className="h-5 w-5 cursor-pointer" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
        <Link2 className="h-5 w-5 cursor-pointer" />
      </div>
    </nav>
  );
};

export default Navbar;
