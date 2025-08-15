import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface HeaderProps {
  showAuthButtons?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showAuthButtons = true }) => {
  const { isAuthenticated, user } = useAuthStore();
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-2 rounded-lg group-hover:from-blue-600 group-hover:to-cyan-500 transition-all duration-200">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-200">
              Ethar Alpha
            </span>
          </Link>

          {/* Navigation Links */}
          {/* <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              Home
            </Link> 
          </nav> */}

          {/* Auth Buttons / Dashboard */}
          {showAuthButtons && (
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
