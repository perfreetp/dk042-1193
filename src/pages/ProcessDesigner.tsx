import { useState, useRef } from 'react';
import {
  Plus, Save, Play, FileText, Building2, Scale, Landmark, Stamp,
  Archive, GitBranch, StopCircle, Trash2, Edit3, Settings, ChevronRight,
  TrendingUp, Clock, Users, FilePlus, CheckCircle2, XCircle, Copy,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAppStore } from '@/store/useAppStore';
import { WorkflowNode, NodeType, AssigneeType, TimeUnit } from '@/types';
import { NODE_CONFIG, DEPARTMENTS, USERS } from '@/utils/constants';
import { formatDate, generateId } from '@/utils/helpers';

const NODE_ICONS: Record<NodeType, any> = {
  start: Play, draft: FileText, business_confirm: Building2,
  legal_review: Scale, financial_review: Landmark, stamp: Stamp,
  archive: Archive, condition: GitBranch, end: StopCircle,
};

const PALETTE_NODES: NodeType[] = [
  'draft', 'business_confirm', 'legal_review', 'financial_review', 'stamp', 'archive', 'condition',
];

export default function ProcessDesigner() {
  const {
    workflows, activeWorkflowId, setActiveWorkflowId,
    addWorkflow, updateWorkflow, updateWorkflowNodes, updateWorkflowConnections,
    deleteWorkflow, toggleWorkflowEnabled,
  } = useAppStore();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ fromId: string; startX: number; startY: number } | null>(null);
  const [showNewWfModal, setShowNewWfModal] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [editingMaterialIdx, setEditingMaterialIdx] = useState<number | null>(null);
  const [editingMaterialValue, setEditingMaterialValue] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);
  const selectedNode = activeWorkflow?.nodes.find((n) => n.id === selectedNodeId) || null;

  const handleCreateWorkflow = () => {
    if (!newWfName.trim()) return;
    const startNode: WorkflowNode = {
      id: generateId(), type: 'start', name: '开始', x: 100, y: 240,
      assigneeType: 'auto', assignees: [], timeLimit: 0, timeUnit: 'hour', requiredMaterials: [],
    };
    const endNode: WorkflowNode = {
      id: generateId(), type: 'end', name: '结束', x: 700, y: 240,
      assigneeType: 'auto', assignees: [], timeLimit: 0, timeUnit: 'hour', requiredMaterials: [],
    };
    const newWf = {
      id: generateId(),
      name: newWfName.trim(),
      description: '',
      nodes: [startNode, endNode],
      connections: [],
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addWorkflow(newWf);
    setActiveWorkflowId(newWf.id);
    setNewWfName('');
    setShowNewWfModal(false);
  };

  const handleAddNode = (type: NodeType) => {
    if (!activeWorkflow) return;
    const cfg = NODE_CONFIG[type];
    const lastNode = activeWorkflow.nodes.filter(n => n.type !== 'end').sort((a, b) => b.x - a.x)[0] || activeWorkflow.nodes[0];
    const newNode: WorkflowNode = {
      id: generateId(),
      type,
      name: cfg.defaultName,
      x: lastNode.x + 160,
      y: 240 + (Math.random() - 0.5) * 80,
      assigneeType: type === 'condition' ? 'auto' : 'role',
      assignees: type === 'condition' ? [] : ['法务部'],
      timeLimit: 1,
      timeUnit: 'day',
      requiredMaterials: [],
    };
    updateWorkflowNodes(activeWorkflow.id, [...activeWorkflow.nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleDragNode = (nodeId: string, e: React.MouseEvent) => {
    if (!activeWorkflow || !canvasRef.current) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const node = activeWorkflow.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const origX = node.x;
    const origY = node.y;

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      const newNodes = activeWorkflow.nodes.map(n =>
        n.id === nodeId ? { ...n, x: Math.max(20, origX + dx), y: Math.max(20, origY + dy) } : n
      );
      updateWorkflowNodes(activeWorkflow.id, newNodes);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleDeleteNode = () => {
    if (!activeWorkflow || !selectedNode) return;
    if (selectedNode.type === 'start' || selectedNode.type === 'end') return;
    updateWorkflowNodes(
      activeWorkflow.id,
      activeWorkflow.nodes.filter(n => n.id !== selectedNodeId)
    );
    updateWorkflowConnections(
      activeWorkflow.id,
      activeWorkflow.connections.filter(c => c.from !== selectedNodeId && c.to !== selectedNodeId)
    );
    setSelectedNodeId(null);
  };

  const handleUpdateSelectedNode = (data: Partial<WorkflowNode>) => {
    if (!activeWorkflow || !selectedNode) return;
    updateWorkflowNodes(
      activeWorkflow.id,
      activeWorkflow.nodes.map(n => n.id === selectedNodeId ? { ...n, ...data } : n)
    );
  };

  const handleAddMaterial = () => {
    if (!selectedNode || !newMaterial.trim()) return;
    const materials = [...selectedNode.requiredMaterials, newMaterial.trim()];
    handleUpdateSelectedNode({ requiredMaterials: materials });
    setNewMaterial('');
  };

  const handleDeleteMaterial = (idx: number) => {
    if (!selectedNode) return;
    const materials = selectedNode.requiredMaterials.filter((_, i) => i !== idx);
    handleUpdateSelectedNode({ requiredMaterials: materials });
    if (editingMaterialIdx === idx) {
      setEditingMaterialIdx(null);
    }
  };

  const handleStartEditMaterial = (idx: number, value: string) => {
    setEditingMaterialIdx(idx);
    setEditingMaterialValue(value);
  };

  const handleSaveEditMaterial = () => {
    if (!selectedNode || editingMaterialIdx === null || !editingMaterialValue.trim()) return;
    const materials = [...selectedNode.requiredMaterials];
    materials[editingMaterialIdx] = editingMaterialValue.trim();
    handleUpdateSelectedNode({ requiredMaterials: materials });
    setEditingMaterialIdx(null);
    setEditingMaterialValue('');
  };

  const handleCancelEditMaterial = () => {
    setEditingMaterialIdx(null);
    setEditingMaterialValue('');
  };

  const handleStartConnect = (nodeId: string, e: React.MouseEvent) => {
    if (!activeWorkflow || !canvasRef.current) return;
    e.stopPropagation();
    const node = activeWorkflow.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setConnecting({ fromId: nodeId, startX: node.x + 110, startY: node.y + 32 });
  };

  const handleEndConnect = (targetId: string, e: React.MouseEvent) => {
    if (!connecting || !activeWorkflow) return;
    e.stopPropagation();
    if (connecting.fromId !== targetId) {
      const exists = activeWorkflow.connections.some(
        c => c.from === connecting.fromId && c.to === targetId
      );
      if (!exists) {
        const newConn = { id: generateId(), from: connecting.fromId, to: targetId };
        updateWorkflowConnections(activeWorkflow.id, [...activeWorkflow.connections, newConn]);
      }
    }
    setConnecting(null);
  };

  const renderConnection = (fromNode: WorkflowNode, toNode: WorkflowNode, label?: string) => {
    const x1 = fromNode.x + 110;
    const y1 = fromNode.y + 32;
    const x2 = toNode.x;
    const y2 = toNode.y + 32;
    const mx = (x1 + x2) / 2;
    const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return (
      <g key={`${fromNode.id}-${toNode.id}`}>
        <path d={path} stroke="#C9A962" strokeWidth="2" fill="none" className="transition-all" />
        <circle cx={x2} cy={y2} r="5" fill="#1E3A5F" stroke="white" strokeWidth="2" />
        {label && (
          <g>
            <rect x={mx - 20} y={Math.min(y1, y2) + Math.abs(y2 - y1) / 2 - 10} width="40" height="20" rx="4" fill="#FBF7ED" stroke="#C9A962" strokeWidth="1" />
            <text x={mx} y={Math.min(y1, y2) + Math.abs(y2 - y1) / 2 + 4} textAnchor="middle" fontSize="10" fill="#997534" fontWeight="500">{label}</text>
          </g>
        )}
      </g>
    );
  };

  return (
    <PageContainer
      title="流程设计器"
      subtitle="可视化编排合同审批流程，配置节点规则、办理人、时限和必填材料"
      actions={
        <button onClick={() => setShowNewWfModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          新建流程
        </button>
      }
    >
      <div className="mt-2 grid grid-cols-12 gap-4 h-[calc(100vh-200px)] min-h-[600px]">
        <div className="col-span-2 card-base p-4 overflow-y-auto space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FilePlus className="w-3.5 h-3.5 text-gold-600" />
              节点组件
            </h4>
            <div className="space-y-2">
              {PALETTE_NODES.map((type) => {
                const cfg = NODE_CONFIG[type];
                const Icon = NODE_ICONS[type];
                return (
                  <button
                    key={type}
                    disabled={!activeWorkflow}
                    onClick={() => handleAddNode(type)}
                    className="w-full group flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 hover:border-gold-300 hover:bg-gold-50/50 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ backgroundColor: cfg.color + '15' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 group-hover:text-indigo-800">{cfg.label}</p>
                      <p className="text-[10px] text-gray-400">点击添加</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="gold-divider" />

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-gold-600" />
              流程模板
            </h4>
            <div className="space-y-2">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => { setActiveWorkflowId(wf.id); setSelectedNodeId(null); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
                    wf.id === activeWorkflowId
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
                      : 'border-gray-100 hover:border-gold-200 hover:bg-gold-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-semibold truncate ${wf.id === activeWorkflowId ? 'text-indigo-800' : 'text-gray-700'}`}>
                      {wf.name}
                    </p>
                    <span className={`w-1.5 h-1.5 rounded-full ${wf.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{wf.nodes.length} 节点</span>
                    <span className="text-[10px] text-gray-400">·</span>
                    <span className="text-[10px] text-gray-400">{formatDate(wf.updatedAt)}</span>
                  </div>
                </button>
              ))}
              {workflows.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">暂无流程模板</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-7 card-base overflow-hidden flex flex-col">
          {activeWorkflow ? (
            <>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-cream/40">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-serif font-semibold text-indigo-800 text-sm">{activeWorkflow.name}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                      {activeWorkflow.description || '暂无描述，可在属性面板中编辑'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWorkflowEnabled(activeWorkflow.id)}
                    className={`btn-ghost text-xs ${activeWorkflow.enabled ? 'text-emerald-700' : ''}`}
                  >
                    {activeWorkflow.enabled ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {activeWorkflow.enabled ? '已启用' : '已禁用'}
                  </button>
                  <button
                    onClick={() => updateWorkflow(activeWorkflow.id, { description: '标准审批流程 ' + activeWorkflow.nodes.length + ' 节点' })}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <Save className="w-3.5 h-3.5" />
                    保存
                  </button>
                  <button
                    onClick={() => { if (confirm('确定删除该流程吗？')) { deleteWorkflow(activeWorkflow.id); setSelectedNodeId(null); } }}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                ref={canvasRef}
                className="flex-1 relative overflow-auto bg-gradient-to-br from-ivory via-cream/30 to-parchment/50 cursor-default"
                onClick={() => { setSelectedNodeId(null); setConnecting(null); }}
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(201,169,98,0.08) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '1400px', minHeight: '500px' }}>
                  {activeWorkflow.connections.map((c) => {
                    const from = activeWorkflow.nodes.find(n => n.id === c.from);
                    const to = activeWorkflow.nodes.find(n => n.id === c.to);
                    if (!from || !to) return null;
                    return renderConnection(from, to, c.label);
                  })}
                </svg>

                <div className="relative" style={{ minWidth: '1400px', minHeight: '500px' }}>
                  {activeWorkflow.nodes.map((node) => {
                    const cfg = NODE_CONFIG[node.type];
                    const Icon = NODE_ICONS[node.type];
                    const isSelected = node.id === selectedNodeId;
                    const isStartEnd = node.type === 'start' || node.type === 'end';
                    return (
                      <div
                        key={node.id}
                        className={`absolute select-none transition-all duration-150 ${
                          isSelected ? 'z-20' : 'z-10'
                        }`}
                        style={{ left: node.x, top: node.y }}
                      >
                        <div
                          onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                          onMouseDown={(e) => handleDragNode(node.id, e)}
                          onMouseUp={(e) => connecting && handleEndConnect(node.id, e)}
                          className={`relative w-[110px] rounded-xl p-3 border-2 bg-white cursor-move transition-all duration-150 ${
                            isSelected
                              ? 'shadow-glow border-indigo-500 -translate-y-0.5'
                              : 'shadow-card border-gold-200 hover:border-gold-400 hover:shadow-card-hover'
                          } ${isStartEnd ? 'rounded-full w-20 h-20 flex items-center justify-center p-0' : ''}`}
                        >
                          {isStartEnd ? (
                            <div className="text-center">
                              <div
                                className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-0.5"
                                style={{ backgroundColor: cfg.color + '15' }}
                              >
                                <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                              </div>
                              <p className="text-[10px] font-semibold" style={{ color: cfg.color }}>{node.name}</p>
                            </div>
                          ) : (
                            <>
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                                style={{ backgroundColor: cfg.color + '15' }}
                              >
                                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                              </div>
                              <p className="text-xs font-semibold text-gray-800 leading-tight">{node.name}</p>
                              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{node.timeLimit > 0 ? `${node.timeLimit}${node.timeUnit === 'day' ? '天' : '时'}` : '自动'}</span>
                              </div>
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                  <Edit3 className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </>
                          )}

                          {!isStartEnd && (
                            <>
                              <div
                                onMouseDown={(e) => handleStartConnect(node.id, e)}
                                className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gold-400 border-2 border-white shadow-gold cursor-crosshair hover:scale-110 hover:bg-gold-500 transition-all"
                                title="拖拽创建连接"
                              />
                              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gold-300" />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-gold/10 flex items-center justify-center mb-4">
                <GitBranch className="w-10 h-10 text-gold-500" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-indigo-800 mb-2">开始设计您的审批流程</h3>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                从左侧选择现有流程模板进行编辑，或点击"新建流程"创建一个全新的审批工作流
              </p>
              <button onClick={() => setShowNewWfModal(true)} className="btn-primary">
                <Plus className="w-4 h-4" />
                创建第一个流程
              </button>
            </div>
          )}
        </div>

        <div className="col-span-3 card-base overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-gray-100 bg-cream/40">
            <h4 className="section-title text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-gold-600" />
              属性配置
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {selectedNode ? (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: NODE_CONFIG[selectedNode.type].color + '15' }}
                    >
                      {(() => { const Icon = NODE_ICONS[selectedNode.type]; return <Icon className="w-5 h-5" style={{ color: NODE_CONFIG[selectedNode.type].color }} />; })()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">{NODE_CONFIG[selectedNode.type].label}节点</p>
                      <p className="text-sm font-medium text-indigo-800">{selectedNode.name}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label-base">节点名称</label>
                  <input
                    value={selectedNode.name}
                    onChange={(e) => handleUpdateSelectedNode({ name: e.target.value })}
                    className="input-base text-sm"
                  />
                </div>

                {selectedNode.type !== 'start' && selectedNode.type !== 'end' && selectedNode.type !== 'condition' && (
                  <>
                    <div>
                      <label className="label-base">办理方式</label>
                      <select
                        value={selectedNode.assigneeType}
                        onChange={(e) => handleUpdateSelectedNode({ assigneeType: e.target.value as AssigneeType })}
                        className="select-base text-sm"
                      >
                        <option value="role">指定角色/部门</option>
                        <option value="user">指定人员</option>
                        <option value="supervisor">上级领导</option>
                        <option value="auto">自动执行</option>
                      </select>
                    </div>

                    {(selectedNode.assigneeType === 'role' || selectedNode.assigneeType === 'user') && (
                      <div>
                        <label className="label-base">办理人</label>
                        <select
                          value={selectedNode.assignees[0] || ''}
                          onChange={(e) => handleUpdateSelectedNode({ assignees: [e.target.value] })}
                          className="select-base text-sm"
                        >
                          <option value="">请选择</option>
                          {selectedNode.assigneeType === 'role'
                            ? DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)
                            : USERS.filter(u => u.role === 'approver' || u.role === 'admin').map(u => <option key={u.id} value={u.id}>{u.name} · {u.department}</option>)
                          }
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-base">时限</label>
                        <input
                          type="number"
                          min="0"
                          value={selectedNode.timeLimit}
                          onChange={(e) => handleUpdateSelectedNode({ timeLimit: Number(e.target.value) })}
                          className="input-base text-sm"
                        />
                      </div>
                      <div>
                        <label className="label-base">单位</label>
                        <select
                          value={selectedNode.timeUnit}
                          onChange={(e) => handleUpdateSelectedNode({ timeUnit: e.target.value as TimeUnit })}
                          className="select-base text-sm"
                        >
                          <option value="hour">小时</option>
                          <option value="day">天</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label-base flex items-center justify-between mb-2">
                        <span>必填材料</span>
                      </label>

                      <div className="flex gap-2 mb-3">
                        <input
                          value={newMaterial}
                          onChange={(e) => setNewMaterial(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMaterial())}
                          placeholder="输入材料名称..."
                          className="input-base text-xs flex-1 h-9 py-1"
                        />
                        <button
                          onClick={handleAddMaterial}
                          disabled={!newMaterial.trim()}
                          className="btn-primary text-xs px-3 h-9 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          添加
                        </button>
                      </div>

                      {selectedNode.requiredMaterials.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedNode.requiredMaterials.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cream/60 border border-gold-100 group">
                              <FileText className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                              {editingMaterialIdx === idx ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    autoFocus
                                    value={editingMaterialValue}
                                    onChange={(e) => setEditingMaterialValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') { e.preventDefault(); handleSaveEditMaterial(); }
                                      if (e.key === 'Escape') { e.preventDefault(); handleCancelEditMaterial(); }
                                    }}
                                    className="input-base text-xs flex-1 h-7 py-0.5 px-2 border-gold-300 focus:border-gold-500"
                                  />
                                  <button onClick={handleSaveEditMaterial} className="p-1 rounded hover:bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={handleCancelEditMaterial} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs text-gray-700 flex-1">{m}</span>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleStartEditMaterial(idx, m)}
                                      className="p-1 rounded hover:bg-indigo-100 text-gray-400 hover:text-indigo-600"
                                      title="编辑"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMaterial(idx)}
                                      className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                                      title="删除"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-4 rounded-lg border-2 border-dashed border-gray-200 text-center">
                          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-400">暂无必填材料要求</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">在上方输入框添加材料</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <div>
                    <label className="label-base">条件表达式</label>
                    <textarea
                      rows={3}
                      value={selectedNode.conditionExpression || ''}
                      onChange={(e) => handleUpdateSelectedNode({ conditionExpression: e.target.value })}
                      placeholder="例如: amount > 5000000"
                      className="input-base text-xs font-mono resize-none"
                    />
                    <p className="mt-1.5 text-[10px] text-gray-400">支持 amount (金额)、department (部门) 等变量</p>
                  </div>
                )}

                <div className="gold-divider" />

                {(selectedNode.type !== 'start' && selectedNode.type !== 'end') && (
                  <button
                    onClick={handleDeleteNode}
                    className="w-full btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除此节点
                  </button>
                )}
              </>
            ) : activeWorkflow ? (
              <div className="space-y-5">
                <div>
                  <label className="label-base">流程名称</label>
                  <input
                    value={activeWorkflow.name}
                    onChange={(e) => updateWorkflow(activeWorkflow.id, { name: e.target.value })}
                    className="input-base text-sm"
                  />
                </div>
                <div>
                  <label className="label-base">流程描述</label>
                  <textarea
                    rows={3}
                    value={activeWorkflow.description}
                    onChange={(e) => updateWorkflow(activeWorkflow.id, { description: e.target.value })}
                    placeholder="请输入此流程的适用范围和说明..."
                    className="input-base text-sm resize-none"
                  />
                </div>

                <div className="gold-divider" />

                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/60 to-gold-50/40 border border-gold-100">
                  <h5 className="text-xs font-semibold text-indigo-800 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    流程统计
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-white border border-gold-100">
                      <p className="text-[10px] text-gray-500">节点数量</p>
                      <p className="text-lg font-serif font-bold text-indigo-700">{activeWorkflow.nodes.length}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-gold-100">
                      <p className="text-[10px] text-gray-500">连线数量</p>
                      <p className="text-lg font-serif font-bold text-indigo-700">{activeWorkflow.connections.length}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-gold-100">
                      <p className="text-[10px] text-gray-500">最近更新</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5">{formatDate(activeWorkflow.updatedAt)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-gold-100">
                      <p className="text-[10px] text-gray-500">状态</p>
                      <p className={`text-xs font-semibold mt-0.5 ${activeWorkflow.enabled ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {activeWorkflow.enabled ? '已启用' : '未启用'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                  <h5 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    使用提示
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-amber-700/90">
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      点击左侧组件可快速添加节点
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      拖动节点右侧圆点至目标节点创建连线
                    </li>
                    <li className="flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      选中节点可在面板中配置属性
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Settings className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">请选择一个节点或流程</p>
                <p className="text-xs text-gray-400 mt-1">以查看和编辑属性配置</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewWfModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="section-title">新建审批流程</h3>
                <p className="text-xs text-gray-500 mt-0.5">为合同审批创建一个新的工作流模板</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label-base">流程名称 <span className="text-red-500">*</span></label>
                <input
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  placeholder="例如: 采购合同审批流程 v1.0"
                  className="input-base"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['标准合同', '大额合同', '简易合同'].map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setNewWfName(`${t}审批流程`)}
                    className="p-3 rounded-xl border border-gray-200 hover:border-gold-400 hover:bg-gold-50/30 transition-all text-left group"
                  >
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-gold-600 mb-1.5" />
                    <p className="text-xs font-medium text-gray-700">{t}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">点击使用</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => { setShowNewWfModal(false); setNewWfName(''); }}
                className="btn-secondary text-sm"
              >
                取消
              </button>
              <button
                onClick={handleCreateWorkflow}
                disabled={!newWfName.trim()}
                className="btn-primary text-sm"
              >
                创建流程
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
