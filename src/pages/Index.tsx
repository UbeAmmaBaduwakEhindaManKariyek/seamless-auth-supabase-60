
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Welcome to KeyAuth Manager</h1>
        <p className="text-xl text-gray-400 mb-8">
          {user ? `Logged in as ${user.username}` : 'Please login or register to continue'}
        </p>
        
        <div className="space-x-4">
          {!user ? (
            <>
              <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                <Link to="/register">Register</Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
