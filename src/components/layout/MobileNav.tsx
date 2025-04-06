
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Key,
  Tag,
  FileText,
  Settings,
  Database,
  FileWarning,
  FileCode,
  Grid,
  Webhook
} from 'lucide-react';

const MobileNav: React.FC = () => {
  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="mobile-nav-icon" /> },
    { name: 'Users', path: '/users', icon: <Users className="mobile-nav-icon" /> },
    { name: 'Licenses', path: '/licenses', icon: <Key className="mobile-nav-icon" /> },
    { name: 'Apps', path: '/applications', icon: <Grid className="mobile-nav-icon" /> },
    { name: 'More', path: '#more', icon: <Database className="mobile-nav-icon" /> }
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        item.path === '#more' ? (
          <button 
            key={item.path}
            className="mobile-nav-item"
            onClick={() => document.getElementById('mobile-menu-button')?.click()}
          >
            {item.icon}
            <span>{item.name}</span>
          </button>
        ) : (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `mobile-nav-item ${isActive ? 'text-blue-500' : ''}`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        )
      ))}
    </nav>
  );
};

export default MobileNav;
