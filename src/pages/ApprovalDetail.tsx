import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileText, Clock, User, Building2, Banknote, AlertTriangle,
  Download, Eye, MessageSquare, CheckCircle2, XCircle, UserPlus, Share2,
  Paperclip, ChevronDown, ChevronRight, FileSpreadsheet, File, Folder,
  Play, Scale, Landmark, Stamp, Archive, GitBranch, StopCircle,
  Upload, Trash2, Plus, AlertCircle,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import {
  CONTRACT_TYPE_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG, NODE_CONFIG,
  APPROVAL_ACTION_CONFIG, USERS,
} from '@/utils/constants';
import { formatCurrency, formatDate, formatDateTime, formatFileSize, generateId, getRelativeTime } from '@/utils/helpers';
import { ApprovalRecord, WorkflowNode, ContractAttachment } from '@/types';

const NODE_ICON_MAP: Record<string, any> = {
  Play: Play,
  FileText: FileText,
  Building2: Building2,
  Scale: Scale,
  Landmark: Landmark,
  Stamp: Stamp,
  Archive: Archive,
  GitBranch: GitBranch,
  StopCircle: StopCircle,
};

const FILE_ICONS: Record<string, any> = {
  docx: FileText, doc: FileText, pdf: FileText,
  xlsx: FileSpreadsheet, xls: FileSpreadsheet,
  zip: Folder, rar: Folder,
};

export default function ApprovalDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    contracts, workflows, currentUser,
    addApprovalRecord, advanceContractNode, rejectContract,
    addAttachment, addSignatory, handleSignatoryApproval,
  } = useAppStore();

  const contract = contracts.find(c => c.id === id);
  const workflow = workflows.find(w => w.id === contract?.workflowId);
  const [opinion, setOpinion] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signUser, setSignUser] = useState('');

  if (!contract || !workflow) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="font-serif text-xl font-semibold text-gray-600 mb-2">合同不存在</h3>
          <button onClick={() => navigate('/workbench')} className="btn-secondary mt-4">
            <ArrowLeft className="w-4 h-4" />
            返回工作台
          </button>
        </div>
      </PageContainer>
    );
  }

  const typeCfg = CONTRACT_TYPE_CONFIG[contract.type];
  const priorCfg = PRIORITY_CONFIG[contract.priority];
  const statusCfg = STATUS_CONFIG[contract.status];
  const currentNode = workflow.nodes.find(n => n.id === contract.currentNodeId);
  const currentNodeIdx = workflow.nodes.findIndex(n => n.id === contract.currentNodeId);

  const pendingSignatory = contract.signatories.find(
    (s) => s.userId === currentUser.id && s.status === 'pending'
  );
  const hasApprovedThisNode = contract.approvalHistory.some(
    (h) => h.approverId === currentUser.id && h.nodeId === contract.currentNodeId && !h.signatoryId
  );
  const isMyTurn = contract.status === 'pending' && !hasApprovedThisNode && !pendingSignatory;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      addAttachment(contract.id, {
        name: file.name,
        size: file.size,
        uploadTime: new Date().toISOString(),
        uploader: currentUser.name,
        fileType: ext,
      });
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApprove = () => {
    if (!currentNode) return;
    const record: ApprovalRecord = {
      nodeId: currentNode.id,
      nodeName: currentNode.name,
      approverId: currentUser.id,
      approverName: currentUser.name,
      action: 'approve',
      opinion: opinion || '同意，无异议。',
      time: new Date().toISOString(),
    };
    addApprovalRecord(contract.id, record);
    advanceContractNode(contract.id);
    setOpinion('');
  };

  const handleReject = () => {
    if (!currentNode) return;
    if (!opinion.trim()) { alert('请填写驳回理由'); return; }
    const record: ApprovalRecord = {
      nodeId: currentNode.id,
      nodeName: currentNode.name,
      approverId: currentUser.id,
      approverName: currentUser.name,
      action: 'reject',
      opinion,
      time: new Date().toISOString(),
    };
    rejectContract(contract.id, record);
    setOpinion('');
  };

  const handleSign = () => {
    const user = USERS.find(u => u.id === signUser);
    if (!user || !currentNode) return;

    addSignatory(contract.id, {
      userId: user.id,
      userName: user.name,
      nodeId: currentNode.id,
    });

    const record: ApprovalRecord = {
      nodeId: currentNode.id,
      nodeName: currentNode.name,
      approverId: currentUser.id,
      approverName: currentUser.name,
      action: 'sign',
      opinion: `加签给 ${user.name}(${user.department}) 审核：${opinion}`,
      time: new Date().toISOString(),
    };
    addApprovalRecord(contract.id, record);
    setShowSignModal(false);
    setOpinion('');
    setSignUser('');
  };

  const handleSignatoryApprove = (approved: boolean) => {
    if (!pendingSignatory) return;
    handleSignatoryApproval(contract.id, pendingSignatory.id, approved, opinion || (approved ? '同意（加签审批）' : '驳回（加签审批）'));
    setOpinion('');
  };

  const allNodes: Array<{ node: WorkflowNode; isCondition: boolean; conditionMet?: boolean }> = [];
  let lastId: string | null = null;
  const startNode = workflow.nodes.find((n) => n.type === 'start');
  if (startNode) {
    const collectNodes = (nodeId: string) => {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      if (lastId && node.type === 'condition') {
        const conn = workflow.connections.find((c) => c.from === lastId && c.to === nodeId);
        if (conn?.condition) {
          allNodes.push({
            node,
            isCondition: true,
            conditionMet: useAppStore.getState().evaluateCondition(conn.condition, contract),
          });
        } else {
          allNodes.push({ node, isCondition: true, conditionMet: false });
        }
      } else {
        allNodes.push({ node, isCondition: false });
      }
      lastId = nodeId;
      const outConns = workflow.connections.filter((c) => c.from === nodeId);
      if (outConns.length === 0) return;

      if (node.type === 'condition') {
        for (const conn of outConns) {
          if (conn.condition && useAppStore.getState().evaluateCondition(conn.condition, contract)) {
            collectNodes(conn.to);
            return;
          }
        }
        const elseConn = outConns.find((c) => !c.condition);
        if (elseConn) {
          collectNodes(elseConn.to);
        }
      } else {
        if (outConns[0]) {
          collectNodes(outConns[0].to);
        }
      }
    };
    collectNodes(startNode.id);
  }

  const displayNodes = allNodes.filter((n) => !n.isCondition);
  const actualCurrentIdx = displayNodes.findIndex((n) => n.node.id === contract.currentNodeId);

  const sortedHistory = [...contract.approvalHistory].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const allSignatories = contract.signatories.filter(
    (s) => s.nodeId === contract.currentNodeId
  );

  return (
    <PageContainer
      title="合同审批详情"
      subtitle={contract.code}
      actions={
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm py-2">
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept=".doc,.docx,.pdf,.xls,.xlsx,.zip,.jpg,.jpeg,.png"
      />

      <div className="mt-2 grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-5">
          <div className="card-base p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h2 className="font-serif text-xl font-bold text-gray-900 truncate">{contract.name}</h2>
                  <span className={`tag-base border ${typeCfg.color}`}>{typeCfg.label}</span>
                  <span className={`tag-base ${priorCfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${priorCfg.dot}`} />
                    {priorCfg.label}
                  </span>
                  <span className={`tag-base border ${statusCfg.color}`}>{statusCfg.label}</span>
                </div>
                <p className="text-sm text-gray-500 font-mono">{contract.code} · 发起于 {formatDate(contract.createTime)}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-6">
                <p className="font-serif text-3xl font-bold text-emerald-700 leading-none">{formatCurrency(contract.amount)}</p>
                <p className="text-xs text-gray-400 mt-1">合同金额</p>
              </div>
            </div>

            <div className="gold-divider mb-5" />

            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: User, label: '申请人', value: contract.applicantName, sub: contract.department },
                { icon: Building2, label: '发起部门', value: contract.department, sub: '已确认' },
                { icon: Clock, label: '当前节点', value: currentNode?.name || '—', sub: currentNode ? `${NODE_CONFIG[currentNode.type].label}环节` : '' },
                { icon: Banknote, label: '预计完成', value: formatDate(contract.expectedArchiveTime), sub: contract.actualArchiveTime ? `已归档 ${formatDate(contract.actualArchiveTime)}` : '预计日期' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-gradient-to-br from-ivory to-cream/60 border border-gold-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-gold-600" />
                      <span className="text-[11px] font-medium text-gray-500">{item.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-base p-6">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-indigo-700" />
              </span>
              审批流程进度
              {contract.amount >= 5000000 && (
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  大额合同 · 已按金额分支流转
                </span>
              )}
            </h3>
            <div className="relative py-4">
              <div className="flex items-start justify-between gap-2">
                {displayNodes.map((item, idx) => {
                  const node = item.node;
                  const isCompleted = idx < actualCurrentIdx;
                  const isCurrent = idx === actualCurrentIdx;
                  const nodeCfg = NODE_CONFIG[node.type];
                  const historyForNode = sortedHistory.filter((h) => h.nodeId === node.id);
                  return (
                    <div key={node.id} className="flex-1 flex flex-col items-center min-w-0 relative">
                      {idx < displayNodes.length - 1 && (
                        <div
                          className={`absolute top-5 left-[60%] right-[-40%] h-0.5 z-0 ${
                            isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-300' : 'bg-gray-200'
                          }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-glow'
                            : isCurrent
                            ? `bg-white border-2 shadow-glow animate-pulse-slow`
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                        style={isCurrent ? { borderColor: nodeCfg.color, boxShadow: `0 0 16px ${nodeCfg.color}40` } : {}}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: `${nodeCfg.color}15`, color: isCurrent ? nodeCfg.color : undefined }}
                          >
                            <Clock className="w-3.5 h-3.5" style={!isCurrent ? { color: nodeCfg.color } : undefined} />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-center px-1 w-full">
                        <p className={`text-xs font-semibold leading-tight ${isCurrent ? 'text-indigo-800' : isCompleted ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {node.name}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                          {historyForNode.length > 0
                            ? historyForNode[historyForNode.length - 1].approverName
                            : node.assigneeType === 'role' && node.assignees.length > 0 ? node.assignees[0]
                            : nodeCfg.label}
                        </p>
                        {historyForNode.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {getRelativeTime(historyForNode[historyForNode.length - 1].time)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {allSignatories.length > 0 && (
            <div className="card-base p-6 border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </span>
                加签审批
                <span className="ml-auto text-xs font-normal text-gray-500">
                  {allSignatories.filter((s) => s.status === 'approved').length} / {allSignatories.length} 已处理
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {allSignatories.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-white border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-indigo flex items-center justify-center text-[10px] font-bold text-gold-300">
                          {s.userName.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{s.userName}</p>
                          <p className="text-[10px] text-gray-500">加签审批人</p>
                        </div>
                      </div>
                      <span className={`tag-base text-[10px] ${
                        s.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        s.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {s.status === 'approved' ? '已同意' : s.status === 'rejected' ? '已驳回' : '待处理'}
                      </span>
                    </div>
                    {s.opinion && (
                      <p className="text-[11px] text-gray-600 bg-cream/50 rounded-lg p-2 mt-1">
                        {s.opinion}
                      </p>
                    )}
                    {s.actionTime && (
                      <p className="text-[10px] text-gray-400 mt-1.5">{formatDateTime(s.actionTime)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-base p-6">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gold-50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-gold-600" />
              </span>
              审批意见记录
            </h3>
            <div className="space-y-1 relative">
              {sortedHistory.length === 0 && (
                <p className="text-sm text-gray-400 py-8 text-center">暂无审批记录</p>
              )}
              {sortedHistory.map((record, idx) => {
                const actionCfg = APPROVAL_ACTION_CONFIG[record.action];
                return (
                  <div key={idx} className="flex gap-4 py-4 relative animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    {idx < sortedHistory.length - 1 && (
                      <div className="absolute left-4 top-12 bottom-0 w-px bg-gradient-to-b from-gold-200 to-transparent" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-gradient-indigo flex items-center justify-center text-[11px] font-bold text-gold-300 flex-shrink-0 relative z-10 shadow-card">
                      {record.approverName.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-semibold text-gray-800">{record.approverName}</span>
                        <span className="text-[11px] text-gray-400">· {record.nodeName}</span>
                        {record.signatoryId && (
                          <span className="tag-base bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                            <UserPlus className="w-2.5 h-2.5" />
                            加签
                          </span>
                        )}
                        <span className={`tag-base ${actionCfg.color}`}>
                          {record.action === 'approve' && <CheckCircle2 className="w-3 h-3" />}
                          {record.action === 'reject' && <XCircle className="w-3 h-3" />}
                          {record.action === 'sign' && <UserPlus className="w-3 h-3" />}
                          {actionCfg.label}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-auto">{formatDateTime(record.time)}</span>
                      </div>
                      {record.opinion && (
                        <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                          record.action === 'reject'
                            ? 'bg-red-50/70 border border-red-100 text-red-800'
                            : 'bg-cream/50 border border-gold-100 text-gray-700'
                        }`}>
                          {record.opinion}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(isMyTurn || pendingSignatory) && (
            <div className={`card-base p-6 border-2 ${
              pendingSignatory ? 'border-amber-200 bg-gradient-to-br from-amber-50/30 to-white' : 'border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white'
            }`}>
              <h3 className="section-title mb-4 flex items-center gap-2">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  pendingSignatory ? 'bg-amber-500' : 'bg-indigo-600'
                }`}>
                  {pendingSignatory ? <UserPlus className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-white" />}
                </span>
                {pendingSignatory ? '加签审批操作' : '当前审批操作'}
                {currentNode && (
                  <span className="ml-auto text-xs font-normal text-gray-500">
                    正在处理：<span className="font-semibold text-indigo-800">{currentNode.name}</span>
                  </span>
                )}
              </h3>

              <div className="mb-4">
                <label className="label-base">审批意见</label>
                <textarea
                  rows={3}
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder={pendingSignatory ? '请输入加签审批意见...' : '请输入审批意见（驳回时必填）...'}
                  className="input-base resize-none"
                />
                <div className="flex gap-2 mt-2">
                  {['同意，条款合规。', '同意，请财务重点复核预算项。', '建议完善保密条款后通过。'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setOpinion(t)}
                      className="text-xs px-3 py-1 rounded-full bg-cream border border-gold-100 text-gray-600 hover:border-gold-300 hover:text-indigo-800 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => pendingSignatory ? handleSignatoryApprove(true) : handleApprove()}
                  className="btn-success flex-1 py-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  同意通过
                </button>
                {!pendingSignatory && (
                  <button onClick={() => setShowSignModal(true)} className="btn-secondary flex-1 py-3">
                    <UserPlus className="w-5 h-5" />
                    加签转办
                  </button>
                )}
                <button
                  onClick={() => pendingSignatory ? handleSignatoryApprove(false) : handleReject()}
                  className="btn-danger flex-1 py-3"
                >
                  <XCircle className="w-5 h-5" />
                  {pendingSignatory ? '驳回加签' : '驳回到修改'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-5">
          <div className="card-base p-5">
            <h3 className="section-title text-base mb-4 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gold-600" />
              合同附件
              <span className="ml-auto text-xs font-normal text-gray-400">{contract.attachments.length} 个文件</span>
            </h3>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {contract.attachments.length === 0 && (
                <div className="py-8 text-center">
                  <Folder className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">暂无附件</p>
                </div>
              )}
              {contract.attachments.map((att, idx) => {
                const FileIcon = FILE_ICONS[att.fileType] || File;
                return (
                  <div
                    key={att.id}
                    className="group p-3 rounded-xl border border-gray-100 hover:border-gold-200 hover:bg-gold-50/30 transition-all duration-150 animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-gold-100 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-gold-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate group-hover:text-indigo-800">{att.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">{formatFileSize(att.size)}</span>
                          <span className="text-[10px] text-gray-400">·</span>
                          <span className="text-[10px] text-gray-400">{att.uploader}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-white text-gray-500 hover:text-indigo-700" title="预览">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white text-gray-500 hover:text-gold-700" title="下载">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-gold-400 hover:bg-gold-50/30 transition-all text-xs text-gray-500 hover:text-gold-700 font-medium flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              上传新附件
            </button>
          </div>

          <div className="card-base p-5">
            <h3 className="section-title text-base mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              流程信息
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-500">使用流程</span>
                <span className="text-xs font-medium text-indigo-800">{workflow.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-500">已完成节点</span>
                <span className="text-xs font-semibold text-emerald-700">{sortedHistory.filter((h) => !h.signatoryId).length} / {displayNodes.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-500">发起时间</span>
                <span className="text-xs text-gray-700">{formatDateTime(contract.createTime)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-500">流程耗时</span>
                <span className="text-xs font-medium text-gray-700">
                  {Math.ceil((Date.now() - new Date(contract.createTime).getTime()) / (1000 * 60 * 60 * 24))} 天
                </span>
              </div>
              {currentNode && currentNode.timeLimit > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">当前节点时限</span>
                  </div>
                  <p className="text-sm font-bold text-amber-900 mt-0.5">
                    {currentNode.timeLimit} {currentNode.timeUnit === 'day' ? '个工作日' : '小时'}
                  </p>
                  {currentNode.requiredMaterials.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200/60">
                      <p className="text-[11px] text-amber-700 mb-1">本节点需审核材料：</p>
                      <ul className="space-y-0.5">
                        {currentNode.requiredMaterials.map((m, i) => (
                          <li key={i} className="text-[10px] text-amber-600 flex items-center gap-1">
                            <ChevronDown className="w-2.5 h-2.5 -rotate-90" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="section-title flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                  加签审批
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">将此节点转交其他人员进行审批</p>
              </div>
              <button onClick={() => setShowSignModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <XCircle className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label-base">加签人员 <span className="text-red-500">*</span></label>
                <select
                  value={signUser}
                  onChange={(e) => setSignUser(e.target.value)}
                  className="select-base"
                >
                  <option value="">请选择加签人员</option>
                  {USERS.filter((u) => u.id !== currentUser.id).map((u) => (
                    <option key={u.id} value={u.id}>{u.name} · {u.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">加签说明</label>
                <textarea
                  rows={3}
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder="请输入加签说明或审核要求..."
                  className="input-base resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => { setShowSignModal(false); setOpinion(''); setSignUser(''); }}
                className="btn-secondary text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSign}
                disabled={!signUser}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" />
                确认加签
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
