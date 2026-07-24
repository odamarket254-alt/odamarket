import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ADMIN_NAVIGATION } from './navigation';
import SearchModal from './SearchModal';
import NotificationsDrawer from './NotificationsDrawer';
import QuickActionsMenu from './QuickActionsMenu';
import UserMenu from './UserMenu';

interface AdminHeaderProps {
  user: any;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminHeader({ user, setSidebarOpen }: AdminHeaderProps) {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // Always start with Dashboard if we're in admin
    if (paths[0] === 'admin') {
      breadcrumbs.push({ label: 'Dashboard', path: '/admin/dashboard' });
      
      // Find current active item from navigation config
      let currentPath = '';
      for (let i = 2; i < paths.length; i++) {
        currentPath += '/' + paths[i];
        
        // Find match in navigation
        let match = null;
        for (const item of ADMIN_NAVIGATION) {
          if (item.path && item.path.endsWith(currentPath)) {
             match = item.label;
             break;
          }
          if (item.children) {
             const childMatch = item.children.find(c => c.path.endsWith(currentPath) || c.path.split('?')[0].endsWith(currentPath));
             if (childMatch) {
                // Add parent if not already added
                if (!breadcrumbs.find(b => b.label === item.label)) {
                   breadcrumbs.push({ label: item.label, path: '#' }); // Parent is usually not clickable if it just expands
                }
                match = childMatch.label;
                break;
             }
          }
        }
        
        if (match) {
           breadcrumbs.push({ 
             label: match, 
             path: `/admin/dashboard${currentPath}` 
           });
        } else {
           // Fallback to capitalizing the path segment
           breadcrumbs.push({ 
             label: paths[i].charAt(0).toUpperCase() + paths[i].slice(1).replace('-', ' '), 
             path: `/admin/dashboard${currentPath}` 
           });
        }
      }
    }
    
    // Deduplicate
    return breadcrumbs.filter((v, i, a) => a.findIndex(t => (t.label === v.label)) === i);
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF8] border-b border-[#E8DCC9] h-16 flex items-center justify-between px-4 lg:px-8">
      {/* Left side: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-[#5F5A54] hover:bg-[#E8DCC9] rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <nav className="hidden md:flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path + index}>
              {index > 0 && <ChevronRight className="w-4 h-4 text-[#8B857D]" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-[#3A2418]">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-[#5F5A54] hover:text-[#C65A28] transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right side: Actions & User */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="hidden sm:block">
           <SearchModal />
        </div>
        
        {/* Date/Time (Hidden on small screens) */}
        <div className="hidden lg:flex items-center text-sm text-[#5F5A54] font-medium px-4 border-r border-[#E8DCC9] h-8">
          {format(time, "EEE, MMM d • h:mm a")}
        </div>

        {/* Quick Actions */}
        <QuickActionsMenu />

        {/* Notifications */}
        <NotificationsDrawer />

        {/* Divider */}
        <div className="w-px h-8 bg-[#E8DCC9] hidden sm:block mx-1"></div>

        {/* User Menu */}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
