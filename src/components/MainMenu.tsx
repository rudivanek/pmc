import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, BookOpen, HelpCircle, List, Lightbulb, Menu, X } from 'lucide-react'; 
import { LuZap } from "react-icons/lu";
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import BetaRegistrationModal from './BetaRegistrationModal';
import TemplateSuggestionModal from './TemplateSuggestionModal';

interface MainMenuProps {
  userName?: string;
  onLogout?: () => void;
  onOpenTemplateSuggestion?: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ userName, onLogout, onOpenTemplateSuggestion }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isBetaModalOpen, setIsBetaModalOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Check if current user is admin
  const isAdmin = currentUser?.email === 'rfv@datago.net';

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  return (
    <>
    <header className="w-full py-4 px-4 sm:py-6 sm:px-6 lg:px-8 border-b border-gray-300 dark:border-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <LuZap size={24} className="text-primary-500 mr-2 sm:mr-2" />
            <Link 
              to={currentUser ? "/copy-maker" : "/"} 
              className="text-2xl sm:text-3xl font-bold text-black dark:text-white hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200"
            >
              PimpMyCopy<span className="text-[8px] sm:text-[10px] font-normal ml-1">Beta 3.21</span>
            </Link>
          </div>
          
          {/* Desktop Navigation - hidden on mobile */}
          <div className="hidden sm:flex items-center space-x-4">
            <ThemeToggle />
            
              
              <Link
                to="/documentation"
                className={`p-2 rounded-md transition-colors duration-200 ${
                  currentPath === '/documentation'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Documentation"
            <div className="flex items-center">
                <BookOpen size={18} />
              </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/step-by-step"
                className={`p-2 rounded-md transition-colors duration-200 ${
                  currentPath === '/step-by-step'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Step-by-Step Guide"
              >
                <List size={18} />
              </Link>
              
              <Link
                to="/faq"
                className={`p-2 rounded-md transition-colors duration-200 ${
                  currentPath === '/faq'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="FAQ"
              >
                <HelpCircle size={18} />
              </Link>
            </div>
            
            {/* Auth buttons - desktop */}
            {!currentUser ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsBetaModalOpen(true)}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 border border-gray-300 dark:border-gray-700 text-sm"
                >
                  Register for Beta
                </button>
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 text-sm"
                >
                  Login to App
                </Link>
              </div>
            ) : (
              <button
                onClick={onLogout}
                className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-200 flex items-center text-sm"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            )}
          </div>
          
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="sm:hidden w-full mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            {/* User info and theme toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                {currentUser && userName && (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {userName}
                  </span>
                )}
              </div>
            </div>
            
            {/* Main navigation icons in horizontal row */}
            <div className="flex items-center justify-center space-x-4 py-2">
              <Link 
                to="/copy-maker" 
                className={`p-3 rounded-lg border transition-colors duration-200 ${
                  currentPath === '/copy-maker' 
                    ? 'bg-gray-500 text-white border-gray-500' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Copy Maker"
              >
                <LuZap size={20} />
              </Link>
              
              <Link 
                to="/dashboard" 
                className={`p-3 rounded-lg border transition-colors duration-200 ${
                  currentPath === '/dashboard' 
                    ? 'bg-gray-500 text-white border-gray-500' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Dashboard"
              >
                <LayoutDashboard size={20} />
              </Link>
              
              <Link
                to="/features"
                className={`p-3 rounded-lg transition-colors duration-200 ${
                  currentPath === '/features'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Features"
              >
                <LuZap size={20} />
              </Link>
              
              <Link
                to="/documentation"
                className={`p-3 rounded-lg transition-colors duration-200 ${
                  currentPath === '/documentation'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Documentation"
              >
                <BookOpen size={20} />
              </Link>
              
              <Link
                to="/step-by-step"
                className={`p-3 rounded-lg transition-colors duration-200 ${
                  currentPath === '/step-by-step'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Step-by-Step Guide"
              >
                <List size={20} />
              </Link>
              
              <Link
                to="/faq"
                className={`p-3 rounded-lg transition-colors duration-200 ${
                  currentPath === '/faq'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="FAQ"
              >
                <HelpCircle size={20} />
              </Link>
              
              {currentUser && onLogout && (
                <button
                  onClick={onLogout}
                  className="p-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-200 flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              )}
            {/* Auth buttons */}
            {!currentUser ? (
              <div className="flex items-center space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsBetaModalOpen(true)}
                  className="flex-1 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors border border-gray-300 dark:border-gray-700 text-sm"
                >
                  Register for Beta
                </button>
                <Link
                  to="/login"
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm text-center"
                >
                  Login to App
                </Link>
              </div>
            ) : (
              <button
                onClick={onLogout}
                className="p-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-200 flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                title="Logout"
            >
                <LogOut size={20} className="mr-2" />
                Logout
              </button>
            )}
          </div>
        </div>
        
        {/* Desktop bottom navigation - only show when user is authenticated */}
        {currentUser && (
          <div className="hidden sm:block w-full mt-4">
            <nav className="flex items-center space-x-2">
              <Link 
                to="/copy-maker" 
                className={`flex items-center text-sm font-medium px-4 py-2 rounded-md border transition-colors duration-200 ${
                  currentPath === '/copy-maker' 
                    ? 'bg-gray-500 text-white border-gray-500' 
                    : 'bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <LuZap size={18} className="mr-2" />
                Copy Maker
              </Link>
              
              <Link 
                to="/dashboard" 
                className={`flex items-center text-sm font-medium px-4 py-2 rounded-md border transition-colors duration-200 ${
                  currentPath === '/dashboard' 
                    ? 'bg-gray-500 text-white border-gray-500' 
                    : 'bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <LayoutDashboard size={18} className="mr-2" />
                Dashboard
              </Link>
            </nav>
          </div>
        )}
      </div>
        </div>
    </header>
    
    {/* Beta Registration Modal */}
    <BetaRegistrationModal
      isOpen={isBetaModalOpen}
      onClose={() => setIsBetaModalOpen(false)}
    />
    </>
  );
};

export default MainMenu;