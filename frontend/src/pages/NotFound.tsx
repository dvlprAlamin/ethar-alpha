import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, TrendingUp } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back to trading!
          </p>
        </div>

        {/* Animated Elements */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-cyan-600/20 rounded-full animate-pulse"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-blue-600/30 rounded-full animate-ping"></div>
          </div>
          <div className="relative z-10 flex items-center justify-center">
            <Search className="w-12 h-12 text-slate-600" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-slate-800 text-slate-300 font-medium rounded-lg border border-slate-700 hover:bg-slate-700 hover:text-white transition-all duration-200 hover:border-slate-600"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Additional Links */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm mb-4">Popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/dashboard"
              className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link
              to="/trade"
              className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200"
            >
              Trade
            </Link>
            <Link
              to="/assets"
              className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200"
            >
              Assets
            </Link>
            <Link
              to="/support"
              className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;