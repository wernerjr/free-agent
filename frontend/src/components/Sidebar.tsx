import { ChatBubbleLeftIcon, DocumentIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: ChatBubbleLeftIcon, label: 'Chat' },
    { to: '/documents', icon: DocumentIcon, label: 'Documents' },
    { to: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
  ];

  return (
    <aside className="h-full bg-dracula-current border-r border-dracula-comment/20">
      <nav className="h-full flex flex-col p-4 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === to
                ? 'bg-dracula-background text-dracula-pink'
                : 'text-dracula-foreground hover:bg-dracula-background hover:text-dracula-cyan'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 