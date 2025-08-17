import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Home,
  TrendingUp,
  Wallet,
  User,
  LogOut,
  History,
  CreditCard,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [navigationOpen, setNavigationOpen] = useState(false);

  // const unreadNotifications = notifications.filter((n) => !n.read);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Assets', href: '/assets', icon: Wallet },
    { name: 'History', href: '/history', icon: History },
    { name: 'Loan', href: '/loan', icon: CreditCard },
    { name: 'Trade', href: '/trade', icon: TrendingUp },
    { name: 'Support', href: '/support', icon: HelpCircle },
    { name: 'White paper', href: '/whitepaper', icon: FileText },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-800 shadow-sm border-b border-slate-700">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Logo with navigation popup */}
          <div className="relative">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onMouseEnter={() => setNavigationOpen(true)}
              onClick={() => setNavigationOpen(!navigationOpen)}
            >
              <div
                onMouseLeave={() => setNavigationOpen(false)}
                className="w-8 h-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-200">
                Ethar Alpha
              </h1>
            </div>

            {/* Navigation popup */}
            {navigationOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50"
                onMouseEnter={() => setNavigationOpen(true)}
                onMouseLeave={() => setNavigationOpen(false)}
              >
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Navigation
                  </h3>
                  <div className="space-y-1">
                    {navigation.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-cyan-600/20 text-cyan-400 border-l-2 border-cyan-400'
                              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                          onClick={() => setNavigationOpen(false)}
                        >
                          <item.icon
                            className={`mr-3 h-4 w-4 ${
                              isActive
                                ? 'text-cyan-400'
                                : 'text-slate-400 group-hover:text-slate-300'
                            }`}
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1  overflow-auto bg-slate-950">
        {children || <Outlet />}
      </main>

      {/* Click outside to close navigation */}
      {navigationOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNavigationOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
