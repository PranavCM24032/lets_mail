import React from 'react';
import {
  LayoutDashboard,
  Mail,
  PlusCircle,
  FileText,
  CalendarClock,
  Users,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { NavigationTab, OrganizerUser } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  organizer: OrganizerUser;
  quotaRemaining: number;
  quotaLimit: number;
  onLogout: () => void;
  onSwitchOrganizer: (name: string, email: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  organizer,
  quotaRemaining,
  quotaLimit,
  onLogout,
  onSwitchOrganizer,
  isMobileOpen,
  onCloseMobile
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Mail className="w-4 h-4" /> },
    { id: 'create-campaign', label: 'Create Campaign', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'form-automation', label: 'Google Forms', icon: <FileText className="w-4 h-4" /> },
    { id: 'scheduled', label: 'Scheduled', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contacts', icon: <Users className="w-4 h-4" /> },
    { id: 'activity', label: 'Email Activity', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const handleNav = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNav('overview')}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-slate-900">Let's Mail</span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                Free
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">College Event Dispatch</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.id === 'create-campaign' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
                  New
                </span>
              )}
            </button>
          );
        })}

        {/* Quota Gauge Summary in Sidebar */}
        <div className="pt-5 pb-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-600">Daily Allowance</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {quotaRemaining} / {quotaLimit}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((quotaRemaining / quotaLimit) * 100))}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Direct from <span className="font-mono text-slate-600 truncate inline-block max-w-[140px] align-bottom">{organizer.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* User Profile & Account Footer */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            {organizer.photoURL ? (
              <img
                src={organizer.photoURL}
                alt={organizer.displayName}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center justify-center">
                {organizer.displayName ? organizer.displayName[0].toUpperCase() : 'O'}
              </div>
            )}
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-slate-900 truncate">{organizer.displayName}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{organizer.email}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Disconnect account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
