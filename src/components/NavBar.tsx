import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Edit3, CreditCard, BarChart3, LogOut, Home, Sun, Moon } from 'lucide-react';

interface NavBarProps {
  logoRef?: React.Ref<HTMLSpanElement>;
  hideLogo?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ logoRef, hideLogo }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const darkMode = localStorage.getItem('hlm-dark') === 'true';
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Helper for active link styling
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm fixed top-0 left-0 w-full z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/" className="flex items-center space-x-2 font-bold text-blue-700 dark:text-blue-300 text-xl">
          <Home className="h-6 w-6" />
          <span
            ref={logoRef}
            style={hideLogo ? { opacity: 0 } : undefined}
            className="transition-opacity duration-200"
          >
            HLM
          </span>
        </Link>
        <div className="flex space-x-2 sm:space-x-4 items-center">
          <Link
            to="/master"
            className={`p-2 rounded-lg flex items-center space-x-1 transition ${isActive('/master') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'hover:bg-blue-50 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300'}`}
            title="Master"
          >
            <Users className="h-5 w-5" />
            <span className="hidden sm:inline">Master</span>
          </Link>
          <Link
            to="/entry"
            className={`p-2 rounded-lg flex items-center space-x-1 transition ${isActive('/entry') ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'hover:bg-green-50 dark:hover:bg-green-800 text-green-600 dark:text-green-300'}`}
            title="Daily Entry"
          >
            <Edit3 className="h-5 w-5" />
            <span className="hidden sm:inline">Daily Entry</span>
          </Link>
          <Link
            to="/payments"
            className={`p-2 rounded-lg flex items-center space-x-1 transition ${isActive('/payments') ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' : 'hover:bg-orange-50 dark:hover:bg-orange-800 text-orange-600 dark:text-orange-300'}`}
            title="Payments"
          >
            <CreditCard className="h-5 w-5" />
            <span className="hidden sm:inline">Payments</span>
          </Link>
          <Link
            to="/summary"
            className={`p-2 rounded-lg flex items-center space-x-1 transition ${isActive('/summary') ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200' : 'hover:bg-purple-50 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-300'}`}
            title="Summary"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="hidden sm:inline">Summary</span>
          </Link>
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="ml-2 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-300 flex items-center space-x-1 transition"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

// ThemeToggle Component
const ThemeToggle = () => {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'));

  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setDark(d => !d)}
      className="ml-4 p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
    >
      {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
    </button>
  );
};