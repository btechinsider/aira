import React from 'react';
import { AlertTriangle, BarChart3, Plug, BookOpen, Wrench, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: null },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: null },
    { id: 'ecommerce-demo', label: 'E-Commerce Demo', icon: ShoppingCart, badge: null },
    { id: 'api-docs', label: 'API Docs', icon: Plug, badge: null },
    { id: 'user-guide', label: 'User Guide', icon: BookOpen, badge: null },
    { id: 'diagnosis-guide', label: 'Diagnosis', icon: Wrench, badge: null },
  ];

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <img src="/aira.svg" alt="AIRA Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold gradient-text">AIRA</h1>
          </div>
        ) : (
          <img src="/aira.svg" alt="AIRA Logo" className="w-8 h-8 object-contain mx-auto" />
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="btn-icon"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={
                currentView === item.id ? 'nav-item-active w-full' : 'nav-item w-full'
              }
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <IconComponent size={20} aria-hidden="true" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="badge badge-primary">{item.badge}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* App Info Section */}
      <div className="p-4 border-t border-slate-700">
        {!isCollapsed && (
          <div className="px-3 py-2 bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-400">AIRA v1.0.0</p>
            <p className="text-xs text-slate-500">Open Access Mode</p>
          </div>
        )}
      </div>
    </aside>
  );
};

// Made with Bob