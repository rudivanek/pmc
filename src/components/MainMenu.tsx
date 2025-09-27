import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, BookOpen, HelpCircle, List, Lightbulb } from 'lucide-react'; 
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

  // Check if current user is admin
  const isAdmin = currentUser?.email === 'rfv@datago.net';

  return (
    <>
    <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-300 dark:border-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-start justify-between">
          {/* Top row with logo and user controls */}
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center">
              <LuZap size={28} className="text-primary-500 mr-2" />
              <Link 
                to={currentUser ? "/copy-maker" : "/"} 
                className="text-3xl font-bold text-black dark:text-white hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200"
              >
                <h1 className="text-2xl sm:text-3xl">PimpMyCopy<span className="text-[8px] sm:text-[10px] font-normal ml-1">Beta 3.21</span></h1>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />
              
              {currentUser && userName && (
                <span className="hidden sm:inline-block text-sm font-medium text-gray-600 dark:text-gray-400">
                  {userName}
                </span>
              )}
              
              {/* Features and Documentation icon buttons */}
              <Link
                to="/features"
                className={`p-1.5 sm:p-2 rounded-md transition-colors duration-200 ${
                  currentPath === '/features'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Features"
              >
                <LuZap size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Link>
              
              <Link
                to="/documentation"
                className={`p-1.5 sm:p-2 rounded-md transition-colors duration-200 ${
                  currentPath === '/documentation'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Documentation"
              >
                <BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Link>
              {/* This is the new Step-by-Step Guide button */}
<Link
  to="/step-by-step"
  className={`p-1.5 sm:p-2 rounded-md transition-colors duration-200 ${
    currentPath === '/step-by-step'
      ? 'bg-primary-500 text-white'
      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
  }`}
  title="Step-by-Step Guide"
>
  <List size={16} className="sm:w-[18px] sm:h-[18px]" />
</Link>
              <Link
                to="/faq"
                className={`p-1.5 sm:p-2 rounded-md transition-colors duration-200 ${
                  currentPath === '/faq'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="FAQ"
              >
                <HelpCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Link>
              
              {/* Show Login button when user is not authenticated */}
              {!currentUser && (
                <>
                  <button
                    onClick={() => setIsBetaModalOpen(true)}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 border border-gray-300 dark:border-gray-700 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Register for Beta</span>
                    <span className="sm:hidden">Beta</span>
                  </button>
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Login to App</span>
                  <span className="sm:hidden">Login</span>
                </Link>
                </>
              )}
              
              {currentUser && onLogout && (
                <button
                  onClick={onLogout}
                  className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-200 flex items-center text-xs sm:text-sm"
                >
                  <LogOut size={16} className="mr-1 sm:mr-1.5 sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
            
        {/* Bottom row with button-style navigation - only show when user is authenticated */}
        {currentUser && (
          <div className="w-full">
            <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link 
              to="/copy-maker" 
              className={`flex items-center text-xs sm:text-sm font-medium px-2 sm:px-4 py-1.5 sm:py-2 rounded-md border transition-colors duration-200 ${
                currentPath === '/copy-maker' 
                  ? 'bg-gray-500 text-white border-gray-500' 
                  : 'bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <LuZap size={16} className="mr-1 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Copy Maker</span>
              <span className="sm:hidden">Copy</span>
            </Link>
            
            <Link 
              to="/dashboard" 
              className={`flex items-center text-xs sm:text-sm font-medium px-2 sm:px-4 py-1.5 sm:py-2 rounded-md border transition-colors duration-200 ${
                currentPath === '/dashboard' 
                  ? 'bg-gray-500 text-white border-gray-500' 
                  : 'bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <LayoutDashboard size={16} className="mr-1 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
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