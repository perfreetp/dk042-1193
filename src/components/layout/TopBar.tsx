import { Bell, Search, ChevronDown, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PRIORITY_CONFIG } from '@/utils/constants';

export default function TopBar() {
  const { currentUser, contracts } = useAppStore();

  const pendingCount = contracts.filter((c) => {
    const inHistory = c.approvalHistory.some((h) => h.approverId === currentUser.id);
    return c.status === 'pending' && !inHistory;
  }).length;

  const urgentCount = contracts.filter(
    (c) => c.status === 'pending' && c.priority === 'urgent'
  ).length;

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm border-b border-gold-100 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索合同编号、名称、申请人..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-cream/60 border border-transparent text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gold-300 focus:ring-2 focus:ring-gold-100 transition-all duration-150"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {urgentCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-medium text-red-600 mr-2">
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG.urgent.dot} animate-pulse`} />
            {urgentCount} 件紧急待办
          </div>
        )}

        <button className="relative p-2.5 rounded-lg text-gray-500 hover:bg-cream hover:text-indigo-700 transition-all duration-150">
          <MessageSquare className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>

        <button className="relative p-2.5 rounded-lg text-gray-500 hover:bg-cream hover:text-indigo-700 transition-all duration-150">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold-500" />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-2" />

        <div className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-lg hover:bg-cream transition-colors cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-indigo flex items-center justify-center text-sm font-bold text-gold-300 shadow-card">
            {currentUser.avatar}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{currentUser.name}</p>
            <p className="text-[11px] text-gray-500 leading-tight">{currentUser.roleName} · {currentUser.department}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </header>
  );
}
