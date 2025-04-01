
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex">
      {/* Sidebar for larger screens */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={cn(
        "flex-1 transition-all duration-300 w-full", 
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="pt-20 px-4 md:px-6 pb-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
