import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlaneTakeoff, FolderArchive, Settings } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'דשבורד' },
  { path: '/plan', icon: PlaneTakeoff, label: 'הוצאות' },
  { path: '/trips', icon: FolderArchive, label: 'טיולים' },
  { path: '/settings', icon: Settings, label: 'הגדרות' },
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border"
      style={{
        boxShadow: '0 -2px 16px rgba(10,31,68,0.06), 0 -1px 4px rgba(10,31,68,0.04)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pt-2 pb-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} className="flex flex-col items-center py-1 px-1 rounded-xl transition-all duration-150">
              <div
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-[#0A1F44]/8' : 'bg-transparent'}`}
                style={active ? { boxShadow: '0 0 0 1px rgba(10,31,68,0.08), inset 0 1px 2px rgba(255,255,255,0.6)' } : {}}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-150 ${active ? 'text-[#0A1F44]' : 'text-[#50535A]/60'}`}
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className={`text-[10px] tracking-wide transition-colors duration-150 ${active ? 'text-[#0A1F44] font-medium' : 'text-[#50535A]/50 font-light'}`}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
