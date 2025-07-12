
import { ReactNode, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Code, 
  Settings, 
  LogOut, 
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
      showAlways: true
    },
    {
      path: '/admin',
      label: 'Admin Panel',
      icon: <ShieldCheck className="mr-3 h-5 w-5" />,
      showAlways: false,
      adminOnly: true
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <Settings className="mr-3 h-5 w-5" />,
      showAlways: true
    }
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link to="/" className="text-xl font-bold text-blue-600">BuildifyAI</Link>
        </div>
        <div className="p-4">
          <nav className="space-y-1">
            {navigationItems.map(item => (
              (item.showAlways || (item.adminOnly && isAdmin)) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 text-sm rounded-md ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
          <div className="md:hidden">
            <Link to="/" className="text-xl font-bold text-blue-600">BuildifyAI</Link>
          </div>
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center">
                  <span className="mr-2">{user?.name || user?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navigationItems.map(item => (
                  (item.showAlways || (item.adminOnly && isAdmin)) && (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center cursor-pointer">
                        {item.icon}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  )
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;