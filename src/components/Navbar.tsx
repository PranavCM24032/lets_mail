import React, { useState } from 'react';
import {
  Mail,
  Send,
  Upload,
  FileText,
  Clock,
  BarChart3,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { OrganizerUser } from '../types';

export type NavTab =
  | 'dashboard'
  | 'upload'
  | 'composer'
  | 'form-automation'
  | 'scheduled'
  | 'quota'
  | 'history'
  | 'account'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  organizer: OrganizerUser;
  quotaRemaining: number;
  quotaLimit: number;
  onLogout: () => void;
  onSwitchOrganizer: (name: string, email: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  organizer,
  quotaRemaining,
  quotaLimit,
  onLogout,
  onSwitchOrganizer
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload CSV/Excel', icon: <Upload className="w-4 h-4" /> },
    { id: 'composer', label: 'Email Composer', icon: <Send className="w-4 h-4" /> },
    { id: 'form-automation', label: 'Google Forms', icon: <FileText className="w-4 h-4" /> },
    { id: 'scheduled', label: 'Scheduled', icon: <Clock className="w-4 h-4" /> },
    { id: 'quota', label: 'Quota (500/day)', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'account', label: 'Connected Gmail', icon: <Mail className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const quotaPercent = Math.min(100, Math.round((quotaRemaining / quotaLimit) * 100));

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Let's Mail</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  100% Free
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Multi-Organizer College Platform</p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.slice(0, 7).map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center gap-3">
            {/* Quota Badge */}
            <button
              onClick={() => handleNavClick('quota')}
              className="hidden sm:flex items-center gap-2 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200 transition"
              title="Daily Gmail allowance remaining"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">{quotaRemaining}</span>
              <span className="text-slate-400">/ {quotaLimit} left</span>
            </button>

            {/* Organizer User Chip */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg p-1.5 pr-2.5 transition text-left"
              >
                {organizer.photoURL ? (
                  <img
                    src={organizer.photoURL}
                    alt={organizer.displayName}
                    className="w-7 h-7 rounded-md object-cover border border-slate-600"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                    {organizer.displayName ? organizer.displayName[0].toUpperCase() : 'O'}
                  </div>
                )}
                <div className="hidden md:block max-w-[130px]">
                  <p className="text-xs font-medium text-white truncate">{organizer.displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{organizer.email}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">Active Organizer</p>
                    <p className="font-semibold text-white truncate">{organizer.displayName}</p>
                    <p className="text-slate-400 truncate font-mono text-[11px]">{organizer.email}</p>
                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Isolated Organizer Workspace
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNavClick('account');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-blue-400" />
                      Connected Gmail &amp; Scopes
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNavClick('settings');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Organizer Settings
                    </button>
                  </div>

                  {/* Switch Organizer Demo Section */}
                  <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/40">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5">
                      Multi-Organizer Sandbox
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSwitchOrganizer('Prof. Sarah Chen (Tech Fest)', 'techfest.lead@sbjit.edu.in');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-[11px] text-slate-300 truncate"
                      >
                        Switch: Tech Fest Lead
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSwitchOrganizer('Rohan Verma (Cultural Club)', 'cultural.coord@sbjit.edu.in');
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-[11px] text-slate-300 truncate"
                      >
                        Switch: Cultural Coordinator
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect Account
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          <div className="p-2 mb-2 bg-slate-800 rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-300">Daily Quota</span>
            <span className="text-xs font-bold text-emerald-400">{quotaRemaining} / {quotaLimit} left</span>
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
