import { Home, Settings, Building2, Users, FileText, BarChart3 } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'main', label: 'מסך ראשי', icon: Home },
    { id: 'customers', label: 'לקוחות', icon: Users },
    { id: 'prescriptions', label: 'מרשמים', icon: FileText },
    { id: 'management', label: 'ניהול', icon: Settings },
    { id: 'branches', label: 'סניפים', icon: Building2 },
    { id: 'reports', label: 'גרפים ודוחות', icon: BarChart3 },
  ];

  return (
    <nav className="flex items-center gap-2" dir="rtl">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

