import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileCheck, GitBranch, FileText, Archive, BarChart3, Settings, Scale,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '工作台首页', end: true },
  { to: '/workbench', icon: FileCheck, label: '合同工作台' },
  { to: '/designer', icon: GitBranch, label: '流程设计器' },
  { to: '/templates', icon: FileText, label: '模板中心' },
  { to: '/archive', icon: Archive, label: '归档查询' },
  { to: '/analytics', icon: BarChart3, label: '统计分析' },
];

export default function Sidebar() {
  const { currentUser } = useAppStore();
  const isAdmin = currentUser.role === 'admin';

  return (
    <aside className="h-full w-64 flex flex-col bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white border-r border-gold-500/20">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow">
          <Scale className="w-5 h-5 text-indigo-900" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold tracking-wide text-gold-300">法信云</h1>
          <p className="text-[10px] text-white/50 tracking-widest">CONTRACT FLOW</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isDesigner = item.to === '/designer';
          if (isDesigner && !isAdmin) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-gold-500/15 text-gold-300 shadow-inner border border-gold-500/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>版本信息</span>
          </div>
          <p className="text-xs text-white/40">v1.0.0 · 专业版</p>
          <p className="text-[10px] text-white/30 mt-1">© 2026 法信云法务科技</p>
        </div>
      </div>
    </aside>
  );
}
