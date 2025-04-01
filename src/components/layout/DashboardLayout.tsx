
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex">
      {/* Sidebar for larger screens */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Mobile navigation drawer */}
      <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DrawerContent className="bg-[#101010] text-white border-t border-gray-800 min-h-[80vh]">
          <div className="h-[80vh] overflow-auto">
            <Sidebar isOpen={true} toggleSidebar={() => setIsMobileMenuOpen(false)} isMobile={true} />
          </div>
        </DrawerContent>
      </Drawer>
      
      <div className={cn(
        "flex-1 transition-all duration-300 w-full", 
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        <Navbar 
          toggleSidebar={toggleSidebar} 
          toggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="pt-20 px-4 md:px-6 pb-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
