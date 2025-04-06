
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar for larger screens - fixed to the left */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Mobile navigation drawer */}
      <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DrawerContent className="bg-card border-t border-border min-h-[80vh]">
          <div className="h-[80vh] overflow-auto">
            <Sidebar isOpen={true} toggleSidebar={() => setIsMobileMenuOpen(false)} isMobile={true} />
          </div>
        </DrawerContent>
      </Drawer>
      
      <div className={cn(
        "content-area transition-all duration-300", 
        sidebarOpen ? "with-sidebar" : ""
      )}>
        <Navbar 
          toggleSidebar={toggleSidebar} 
          toggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        <main className="pt-20 px-4 md:px-6 pb-20 md:pb-6 min-h-screen">
          <Outlet />
        </main>
        
        {/* Mobile bottom navigation */}
        <MobileNav />
      </div>
    </div>
  );
};

export default DashboardLayout;
