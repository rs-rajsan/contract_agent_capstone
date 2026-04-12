import React from 'react';
import { Button } from '../shared/ui/button';
import { navItems } from '../../data/navigation';
import { APP_CONFIG } from '../../utils/config';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Users } from 'lucide-react';

interface NavigationProps {
  currentPage: 'chat' | 'intelligence' | 'agents' | 'search' | 'analytics' | 'users';
  onNavigate: (page: 'chat' | 'intelligence' | 'agents' | 'search' | 'analytics' | 'users') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-sm transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {APP_CONFIG.TITLE}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
          {APP_CONFIG.SUBTITLE}
        </p>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onNavigate(item.id as any)}
              className={cn(
                "w-full justify-start gap-3 px-4 py-6 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
              )}
            >
              {/* Active Indicator */}
              {isActive && (
                <div 
                  className={cn(
                    "absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full animate-in slide-in-from-left duration-300",
                    item.color === 'blue' && "bg-blue-600",
                    item.color === 'green' && "bg-green-600",
                    item.color === 'teal' && "bg-teal-600",
                    item.color === 'purple' && "bg-purple-600"
                  )} 
                />
              )}

              <div className={cn(
                "p-2 rounded-lg transition-colors group-hover:scale-110 duration-200",
                isActive 
                  ? "bg-white dark:bg-slate-800 shadow-sm" 
                  : "bg-slate-100/50 dark:bg-slate-800/30"
              )}>
                <Icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-500"
                )} />
              </div>
              
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-sm leading-tight">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                  {item.description}
                </span>
              </div>
            </Button>
          );
        })}

        {/* User Management for Admin Only */}
        {user?.role === 'admin' && (
          <Button
            variant="ghost"
            onClick={() => onNavigate('users')}
            className={cn(
              "w-full justify-start gap-3 px-4 py-6 rounded-xl transition-all duration-200 group relative overflow-hidden",
              currentPage === 'users' 
                ? "bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
            )}
          >
            {currentPage === 'users' && (
               <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full animate-in slide-in-from-left duration-300 bg-orange-600" />
            )}
            <div className={cn(
              "p-2 rounded-lg transition-colors group-hover:scale-110 duration-200",
              currentPage === 'users' 
                ? "bg-white dark:bg-slate-800 shadow-sm" 
                : "bg-slate-100/50 dark:bg-slate-800/30"
            )}>
              <Users className={cn(
                "w-5 h-5",
                currentPage === 'users' ? "text-orange-600" : "text-slate-500"
              )} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-semibold text-sm leading-tight">Users</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Access control & roles</span>
            </div>
          </Button>
        )}
      </div>

      {/* Sidebar Footer - User Profile & Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.username}</span>
              <span className="text-[10px] uppercase font-medium text-slate-500 dark:text-slate-400">{user.role}</span>
            </div>
            <Button 
               variant="ghost" 
               size="icon"
               onClick={logout}
               className="ml-auto text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="glass p-3 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          AI Agent System Online
        </div>
      </div>
    </nav>
  );
};