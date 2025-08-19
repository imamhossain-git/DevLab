import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FlaskConical, LogOut, User, Settings } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <FlaskConical className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white">DevLab</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                <Link 
                  to="/labs" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Labs
                </Link>
                <Link 
                  to="/profile" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Progress
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-300">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}