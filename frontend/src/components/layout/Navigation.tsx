import React from 'react';
import { Button } from '../shared/ui/button';
import { navItems } from '../../data/navigation';
import { APP_CONFIG } from '../../utils/config';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { PageType } from '../../lib/useRouter';
import { LogOut, User, ShieldCheck } from 'lucide-react';

interface NavigationProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const { user: authUser, logout: handleLogout } = useAuth();

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

        {/* User Management - Open to all users as requested */}
        <Button
          variant="ghost"
          onClick={() => onNavigate('users')}
          className={cn(
            "w-full justify-start gap-3 px-4 py-6 rounded-xl transition-all duration-200 group relative overflow-hidden",
            currentPage === 'users' || currentPage === 'settings'
              ? "bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
          )}
        >
          {(currentPage === 'users' || currentPage === 'settings') && (
             <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full animate-in slide-in-from-left duration-300 bg-orange-600" />
          )}
          <div className={cn(
            "p-2 rounded-lg transition-colors group-hover:scale-110 duration-200",
            currentPage === 'users' || currentPage === 'settings'
              ? "bg-white dark:bg-slate-800 shadow-sm" 
              : "bg-slate-100/50 dark:bg-slate-800/30"
          )}>
            <ShieldCheck className={cn(
              "w-5 h-5",
              (currentPage === 'users' || currentPage === 'settings') ? "text-orange-600" : "text-slate-500"
            )} />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-sm leading-tight">Admin Portal</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Authority & Control Hub</span>
          </div>
        </Button>
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {authUser?.username || 'Admin User'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Enterprise Access
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};