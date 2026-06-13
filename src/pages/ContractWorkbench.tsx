import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Filter, Search, Clock, User, X, ChevronDown, FileText,
  AlertCircle, CheckCircle2, Download, Megaphone, ArrowUpDown,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import { ContractType, ContractStatus, Priority } from '@/types';
import {
  CONTRACT_TYPE_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG, NODE_CONFIG, DEPARTMENTS, USERS,
} from '@/utils/constants';
import { formatCurrency, formatDate, generateContractCode, generateId, getRelativeTime } from '@/utils/helpers';

type TabType = 'pending' | 'initiated' | 'processed' | 'all';

export default function ContractWorkbench() {
  const navigate = useNavigate();
  const { contracts, currentUser, workflows, addContract } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContractType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (activeTab === 'pending') {
        const processed = c.approvalHistory.some((h) => h.approverId === currentUser.id);
        if (!(c.status === 'pending' && !processed)) return false;
      }
      if (activeTab === 'initiated') {
        if (c.applicantId !== currentUser.id) return false;
      }
      if (activeTab === 'processed') {
        if (!c.approvalHistory.some((h) => h.approverId === currentUser.id)) return false;
      }
      if (searchText && !c.name.includes(searchText) && !c.code.includes(searchText)) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      return true;
    });
  }, [contracts, activeTab, searchText, typeFilter, statusFilter, priorityFilter, currentUser]);

  const tabConfig: { key: TabType; label: string; count: number }[] = [
    {
      key: 'pending',
      label: '待我审批',
      count: contracts.filter((c) => {
        const processed = c.approvalHistory.some((h) => h.approverId === currentUser.id);
        return c.status === 'pending' && !processed;
      }).length,
    },
    { key: 'initiated', label: '我发起的', count: contracts.filter((c) => c.applicantId === currentUser.id).length },
    { key: 'processed', label: '我已处理', count: contracts.filter((c) => c.approvalHistory.some((h) => h.approverId === currentUser.id)).length },
    { key: 'all', label: '全部合同', count: contracts.length },
  ];

  const handleUrge = (contractId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alert('已向审批人发送催办通知！');
  };

  const handleCreateContract = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as ContractType;
    const workflowId = formData.get('workflowId') as string;
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    const firstNode = workflow.nodes[1] || workflow.nodes[0];
    const newContract = {
      id: generateId(),
      code: generateContractCode(type),
      name: formData.get('name') as string,
      type,
      amount: Number(formData.get('amount') || 0),
      status: 'pending' as const,
      priority: formData.get('priority') as Priority,
      workflowId,
      currentNodeId: firstNode.id,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      department: formData.get('department') as string,
      createTime: new Date().toISOString(),
      expectedArchiveTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      approvalHistory: [{
        nodeId: workflow.nodes[0]?.id || firstNode.id,
        nodeName: workflow.nodes[0]?.name || '发起',
        approverId: currentUser.id,
        approverName: currentUser.name,
        action: 'approve' as const,
        opinion: '发起合同审批',
        time: new Date().toISOString(),
      }],
    };
    addContract(newContract);
    setShowCreateModal(false);
    navigate(`/approval/${newContract.id}`);
  };

  return (
    <PageContainer
      title="合同工作台"
      subtitle="管理您的合同审批任务，跟踪流程进度，发起新合同申请"
      actions={
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          发起合同
        </button>
      }
    >
      <div className="mt-2 space-y-4">
        <div className="card-base p-1.5 inline-flex rounded-xl">
          {tabConfig.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                activeTab === t.key
                  ? 'bg-gradient-indigo text-white shadow-card'
                  : 'text-gray-600 hover:text-indigo-800 hover:bg-cream'
              }`}
            >
              {t.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === t.key ? 'bg-white/20' : 'bg-gray-100'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="card-base p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索合同名称、编号..."
                className="input-base pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ContractType | 'all')}
                className="select-base w-36 text-sm"
              >
                <option value="all">全部类型</option>
                {Object.entries(CONTRACT_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
                className="select-base w-36 text-sm"
              >
                <option value="all">全部状态</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                className="select-base w-32 text-sm"
              >
                <option value="all">全部优先级</option>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card-base overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-cream/60 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">合同信息</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">金额</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">当前节点</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">申请人</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    状态 <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">发起时间</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContracts.map((c, idx) => {
                const workflow = workflows.find((w) => w.id === c.workflowId);
                const currentNode = workflow?.nodes.find((n) => n.id === c.currentNodeId);
                const typeCfg = CONTRACT_TYPE_CONFIG[c.type];
                const priorCfg = PRIORITY_CONFIG[c.priority];
                const statusCfg = STATUS_CONFIG[c.status];
                const canUrge = c.status === 'pending' && c.applicantId === currentUser.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/approval/${c.id}`)}
                    className="hover:bg-cream/40 cursor-pointer transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-10 rounded-full bg-gradient-to-b from-indigo-700 to-indigo-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 text-sm truncate max-w-xs">{c.name}</p>
                            <span className={`tag-base border ${priorCfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${priorCfg.dot}`} />
                              {priorCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs text-gray-400">{c.code}</span>
                            <span className={`tag-base border text-[10px] ${typeCfg.color}`}>{typeCfg.label}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-emerald-700 font-serif">{formatCurrency(c.amount)}</p>
                    </td>
                    <td className="px-5 py-4">
                      {currentNode ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: NODE_CONFIG[currentNode.type].color + '15' }}
                          >
                            <Clock className="w-3 h-3" style={{ color: NODE_CONFIG[currentNode.type].color }} />
                          </div>
                          <span className="text-sm text-gray-700">{currentNode.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-indigo flex items-center justify-center text-[10px] font-bold text-gold-300">
                          {c.applicantName.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{c.applicantName}</p>
                          <p className="text-[10px] text-gray-400">{c.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`tag-base border ${statusCfg.color}`}>
                        {c.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {c.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">{formatDate(c.createTime)}</p>
                      <p className="text-[10px] text-gray-400">{getRelativeTime(c.createTime)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canUrge && (
                          <button
                            onClick={(e) => handleUrge(c.id, e)}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                            title="催办"
                          >
                            <Megaphone className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="py-16 text-center">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">暂无符合条件的合同记录</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="section-title">发起新合同审批</h3>
                <p className="text-xs text-gray-500 mt-0.5">请填写合同基本信息并选择对应审批流程</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateContract} className="flex-1 overflow-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-base">合同名称 <span className="text-red-500">*</span></label>
                  <input name="name" required placeholder="请输入合同名称" className="input-base" />
                </div>
                <div>
                  <label className="label-base">合同类型 <span className="text-red-500">*</span></label>
                  <select name="type" defaultValue="purchase" className="select-base">
                    {Object.entries(CONTRACT_TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base">合同金额（元） <span className="text-red-500">*</span></label>
                  <input name="amount" type="number" required min="0" placeholder="0.00" className="input-base" />
                </div>
                <div>
                  <label className="label-base">优先级 <span className="text-red-500">*</span></label>
                  <select name="priority" defaultValue="medium" className="select-base">
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base">发起部门 <span className="text-red-500">*</span></label>
                  <select name="department" defaultValue={currentUser.department} className="select-base">
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label-base">审批流程 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select name="workflowId" required defaultValue={workflows[0]?.id} className="select-base pr-10 appearance-none">
                      {workflows.filter((w) => w.enabled).map((w) => (
                        <option key={w.id} value={w.id}>{w.name} · {w.nodes.length - 2}个节点</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label-base">合同附件</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gold-300 transition-colors cursor-pointer">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">点击或拖拽上传合同文件</p>
                    <p className="text-xs text-gray-400 mt-1">支持 Word、PDF、Excel 等格式，单个文件不超过 50MB</p>
                  </div>
                </div>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                取消
              </button>
              <button type="submit" className="btn-primary">
                <User className="w-4 h-4" />
                提交发起审批
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
