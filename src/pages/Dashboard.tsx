import { useNavigate } from 'react-router-dom';
import {
  FileCheck, Clock, AlertTriangle, CheckCircle2, FileText, ArrowRight,
  TrendingUp, Users, DollarSign, GitBranch, ChevronRight, Bell, Sparkles,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import {
  CONTRACT_TYPE_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG, NODE_CONFIG,
} from '@/utils/constants';
import { formatCurrency, formatDate, getRelativeTime } from '@/utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { contracts, currentUser, templates, workflows } = useAppStore();

  const pendingMine = contracts.filter((c) => {
    const processed = c.approvalHistory.some((h) => h.approverId === currentUser.id);
    return c.status === 'pending' && !processed;
  });

  const initiatedMine = contracts.filter((c) => c.applicantId === currentUser.id);
  const processedMine = contracts.filter((c) =>
    c.approvalHistory.some((h) => h.approverId === currentUser.id)
  );
  const archivedTotal = contracts.filter((c) => c.status === 'archived');
  const urgentPending = pendingMine.filter((c) => c.priority === 'urgent' || c.priority === 'high');

  const statsCards = [
    { label: '待我审批', value: pendingMine.length, icon: FileCheck, gradient: 'from-indigo-800 to-indigo-700', sub: `${urgentPending.length} 件需优先处理` },
    { label: '我发起的', value: initiatedMine.length, icon: FileText, gradient: 'from-gold-500 to-gold-400', sub: '本月新增 8 件' },
    { label: '已处理', value: processedMine.length, icon: CheckCircle2, gradient: 'from-emerald-600 to-emerald-500', sub: '累计处理 156 件' },
    { label: '已归档', value: archivedTotal.length, icon: Clock, gradient: 'from-slate-600 to-slate-500', sub: '本年度 48 件' },
  ];

  const quickActions = [
    { label: '发起合同', desc: '选择模板创建新合同', icon: FileText, onClick: () => navigate('/workbench'), color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
    { label: '流程配置', desc: '配置审批节点和分支', icon: GitBranch, onClick: () => navigate('/designer'), color: 'bg-gold-50 text-gold-700 border-gold-200 hover:bg-gold-100' },
    { label: '模板中心', desc: '下载标准合同模板', icon: FileText, onClick: () => navigate('/templates'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { label: '数据统计', desc: '查看流程效率分析', icon: TrendingUp, onClick: () => navigate('/analytics'), color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  ];

  return (
    <PageContainer
      title={`欢迎回来，${currentUser.name}`}
      subtitle={`${currentUser.roleName} · ${currentUser.department} · 今日有 ${pendingMine.length} 项待办等待处理`}
    >
      <div className="mt-2 space-y-6">
        <div className="grid grid-cols-4 gap-5">
          {statsCards.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10`} />
                <div className="absolute right-4 bottom-4 w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`bg-gradient-to-br ${s.gradient} -m-5 p-5 rounded-2xl`}>
                  <p className="text-xs font-medium text-white/70 tracking-wide">{s.label}</p>
                  <p className="mt-2 font-serif text-3xl font-bold tracking-tight">{s.value}</p>
                  <p className="mt-2 text-xs text-white/60">{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8 space-y-5">
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-700" />
                  </div>
                  <h3 className="section-title">快捷操作</h3>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {quickActions.map((a, idx) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={idx}
                      onClick={a.onClick}
                      className={`group text-left p-4 rounded-xl border transition-all duration-150 hover:-translate-y-0.5 ${a.color}`}
                    >
                      <div className="flex items-start justify-between">
                        <Icon className="w-5 h-5 mb-3" />
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150" />
                      </div>
                      <p className="text-sm font-semibold">{a.label}</p>
                      <p className="mt-0.5 text-[11px] text-current/70">{a.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="section-title">待我审批</h3>
                  <span className="tag-base bg-red-50 text-red-600 border border-red-100">{pendingMine.length} 件</span>
                </div>
                <button onClick={() => navigate('/workbench')} className="text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1">
                  查看全部 <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {pendingMine.slice(0, 4).map((c) => {
                  const workflow = workflows.find((w) => w.id === c.workflowId);
                  const currentNode = workflow?.nodes.find((n) => n.id === c.currentNodeId);
                  const typeCfg = CONTRACT_TYPE_CONFIG[c.type];
                  const priorCfg = PRIORITY_CONFIG[c.priority];
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/approval/${c.id}`)}
                      className="group flex items-center gap-4 p-3.5 rounded-xl hover:bg-cream cursor-pointer transition-all duration-150 border border-transparent hover:border-gold-100"
                    >
                      <div className="w-1 h-12 rounded-full bg-gradient-to-b from-indigo-700 to-indigo-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-800 text-sm truncate group-hover:text-indigo-800">{c.name}</p>
                          <span className={`tag-base border ${typeCfg.color}`}>{typeCfg.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="font-mono text-gray-400">{c.code}</span>
                          <span>·</span>
                          <span>{c.applicantName} · {c.department}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">{formatCurrency(c.amount)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`tag-base ${priorCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorCfg.dot}`} />
                          {priorCfg.label}
                        </span>
                        <p className="text-[11px] text-gray-400">{getRelativeTime(c.createTime)}</p>
                      </div>
                      <div className="w-32 flex-shrink-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: currentNode ? NODE_CONFIG[currentNode.type].color + '15' : '#f0f0f0' }}>
                            <Clock className="w-3 h-3" style={{ color: currentNode ? NODE_CONFIG[currentNode.type].color : '#999' }} />
                          </div>
                          <span className="text-xs font-medium text-gray-700 truncate">{currentNode?.name || '待分配'}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 pl-6.5">截止 {formatDate(c.expectedArchiveTime)}</p>
                      </div>
                    </div>
                  );
                })}
                {pendingMine.length === 0 && (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">暂无待办事项，工作处理完毕！</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-5">
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-gold-600" />
                  </div>
                  <h3 className="section-title">数据概览</h3>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">合同总数</p>
                      <p className="text-sm font-semibold text-gray-800">{contracts.length} 件</p>
                    </div>
                  </div>
                  <p className="text-lg font-serif font-bold text-indigo-800">{contracts.length}</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">审批通过率</p>
                      <p className="text-sm font-semibold text-gray-800">近 30 天</p>
                    </div>
                  </div>
                  <p className="text-lg font-serif font-bold text-emerald-700">92.3%</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gold-50/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-gold-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-gold-700" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">累计合同金额</p>
                      <p className="text-sm font-semibold text-gray-800">本年度</p>
                    </div>
                  </div>
                  <p className="text-lg font-serif font-bold text-gold-700">¥6.3千万</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">异常流程</p>
                      <p className="text-sm font-semibold text-gray-800">超时或驳回</p>
                    </div>
                  </div>
                  <p className="text-lg font-serif font-bold text-amber-700">5 件</p>
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="section-title">动态更新</h3>
                </div>
              </div>
              <div className="space-y-4">
                {contracts.slice(0, 5).map((c, idx) => {
                  const lastRecord = c.approvalHistory[c.approvalHistory.length - 1];
                  const statusCfg = STATUS_CONFIG[c.status];
                  return (
                    <div key={c.id} className="flex gap-3 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-gold-500 mt-1.5" />
                        {idx < 4 && <div className="w-px flex-1 bg-gold-200/60 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-gray-700 truncate">{c.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {lastRecord
                            ? `${lastRecord.approverName} · ${lastRecord.action === 'approve' ? '已同意' : '已驳回'}`
                            : `${c.applicantName} 发起`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`tag-base border text-[10px] ${statusCfg.color}`}>{statusCfg.label}</span>
                          <span className="text-[10px] text-gray-400">{getRelativeTime(lastRecord?.time || c.createTime)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-600" />
                  </div>
                  <h3 className="section-title">热门模板</h3>
                </div>
                <button onClick={() => navigate('/templates')} className="text-xs text-indigo-700 hover:text-indigo-900 font-medium">
                  更多
                </button>
              </div>
              <div className="space-y-2">
                {templates.slice(0, 4).map((t, idx) => {
                  const typeCfg = CONTRACT_TYPE_CONFIG[t.type];
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate('/templates')}
                      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-cream cursor-pointer transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-gold-100 flex items-center justify-center flex-shrink-0 relative">
                        <FileText className="w-4 h-4 text-gold-600" />
                        {idx === 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">HOT</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate group-hover:text-indigo-800">{t.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400">{t.version}</span>
                          <span className={`tag-base border text-[9px] ${typeCfg.color}`}>{typeCfg.label}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 flex-shrink-0">{t.usageCount} 次</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
