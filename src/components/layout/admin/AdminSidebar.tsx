import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '../../ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, Store } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ADMIN_NAVIGATION } from './navigation';

interface AdminSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setIsCollapsed: (isCollapsed: boolean) => void;
  userRole: string;
}

export default function AdminSidebar({ 
  isOpen, 
  isCollapsed, 
  setIsOpen, 
  setIsCollapsed,
  userRole 
}: AdminSidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  useEffect(() => {
    // Open the parent menu if a child is active
    ADMIN_NAVIGATION.forEach((item) => {
      if (item.children?.some(child => location.pathname === child.path || location.pathname.startsWith(child.path + '/'))) {
        if (!expandedMenus.includes(item.label)) {
          setExpandedMenus(prev => [...prev, item.label]);
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus([label]);
    } else {
      setExpandedMenus(prev => 
        prev.includes(label) 
          ? prev.filter(item => item !== label)
          : [...prev, label]
      );
    }
  };

  const navItems = ADMIN_NAVIGATION.filter(item => item.roles.includes(userRole) || userRole === 'admin' || userRole === 'super_admin');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#3A2418]/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 bg-[#FFFDF8] border-r border-[#E8DCC9] transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E8DCC9] shrink-0">
          <NavLink to="/admin/dashboard" className="flex items-center gap-3 overflow-hidden" onClick={() => setIsOpen(false)}>
            <Logo className="w-[130px]" />
          </NavLink>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-[#5F5A54] hover:bg-[#E8DCC9] rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-colors group",
                        expandedMenus.includes(item.label) 
                          ? "bg-[#FAF5EC] text-[#3A2418]" 
                          : "text-[#5F5A54] hover:bg-[#FAF5EC] hover:text-[#3A2418]"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && <item.icon className={cn(
                          "w-5 h-5 shrink-0 transition-colors",
                          expandedMenus.includes(item.label) ? "text-[#C65A28]" : "text-[#8B857D] group-hover:text-[#C65A28]"
                        )} />}
                        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown className={cn(
                          "w-4 h-4 text-[#8B857D] transition-transform duration-200",
                          expandedMenus.includes(item.label) && "rotate-180"
                        )} />
                      )}
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {expandedMenus.includes(item.label) && !isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-11 pr-3 py-1 space-y-1">
                            {item.children.map((child) => (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) => cn(
                                  "block py-2 px-3 rounded-lg text-sm transition-colors",
                                  isActive 
                                    ? "bg-[#C65A28]/10 text-[#C65A28] font-semibold" 
                                    : "text-[#5F5A54] hover:text-[#3A2418] hover:bg-[#FAF5EC]"
                                )}
                              >
                                {child.label}
                              </NavLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <NavLink
                    to={item.path!}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors group",
                      isActive 
                        ? "bg-[#C65A28] text-white shadow-md shadow-[#C65A28]/20" 
                        : "text-[#5F5A54] hover:bg-[#FAF5EC] hover:text-[#3A2418]"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon && <item.icon className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      location.pathname === item.path ? "text-white" : "text-[#8B857D] group-hover:text-[#C65A28]"
                    )} />}
                    {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Area - Collapse Toggle */}
        <div className="p-4 border-t border-[#E8DCC9] hidden lg:block">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 text-[#5F5A54] hover:bg-[#E8DCC9] hover:text-[#3A2418] rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
             <Menu className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
