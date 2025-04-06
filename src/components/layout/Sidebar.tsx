
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Menu,
  Users,
  Key,
  Tag,
  FileText,
  Webhook,
  Settings,
  Database,
  Home,
  LogOut,
  FileWarning,
  FileCode,
  Grid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isMobile = false }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Applications', path: '/applications', icon: <Grid className="w-5 h-5" /> },
    { name: 'Users', path: '/users', icon: <Users className="w-5 h-5" /> },
    { name: 'Licenses', path: '/licenses', icon: <Key className="w-5 h-5" /> },
    { name: 'Subscriptions', path: '/subscriptions', icon: <Tag className="w-5 h-5" /> },
    { name: 'App Open', path: '/app-open', icon: <FileText className="w-5 h-5" /> },
    { name: 'Login Details', path: '/login-details', icon: <FileWarning className="w-5 h-5" /> },
    { name: 'Logs', path: '/logs', icon: <Database className="w-5 h-5" /> },
    { name: 'API Docs', path: '/api-docs', icon: <FileCode className="w-5 h-5" /> },
    { name: 'Webhooks', path: '/webhooks', icon: <Webhook className="w-5 h-5" /> },
    { name: 'Emu Users', path: '/emu-users', icon: <Users className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-card to-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-lg">R</div>
          <span className="text-xl font-bold">Regz System</span>
        </div>
      </div>

      {/* User profile section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 bg-blue-600">
            <AvatarFallback>{user?.username ? getInitials(user.username) : 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{user?.username || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 py-4 px-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "sidebar-link group",
                isActive && "active"
              )}
              onClick={isMobile ? toggleSidebar : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <Button 
          variant="destructive" 
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  // If this is for mobile, return just the content
  if (isMobile) {
    return sidebarContent;
  }

  // Otherwise return the desktop sidebar
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-card text-foreground transition-all duration-300 z-30 hidden md:block",
      isOpen ? "w-64" : "w-0 opacity-0"
    )}>
      {isOpen && sidebarContent}
    </aside>
  );
};

export default Sidebar;
