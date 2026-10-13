import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, LogOut, User as UserIcon, Menu, X, Code2 } from 'lucide-react';

export type NavTab = 'overview' | 'expenses' | 'monthly' | 'trends' | 'springboot';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenAuth,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: NavTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'monthly', label: 'Monthly Reports' },
    { id: 'trends', label: 'Visual Trends' },
    { id: 'springboot', label: 'Spring Boot & MySQL' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark (Single text element wordmark in display face) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('overview')}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-indigo-600 transition-colors text-left"
            >
              SpendFlow
            </button>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              JWT · MySQL
            </span>
          </div>

          {/* Zone 2: Clean single-line navigation links with hover states */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <button
                  onClick={onOpenAddExpense}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Expense
                </button>

                <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-600">
                  <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="max-w-[100px] truncate font-medium text-slate-900">
                    {user?.username}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            )}

            {/* Mobile hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onTabChange(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium ${
                activeTab === link.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          {isAuthenticated && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onOpenAddExpense();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
