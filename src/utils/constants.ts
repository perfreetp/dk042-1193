import { NodeType, ContractType, Priority, ContractStatus, ApprovalAction } from '@/types';

export const NODE_CONFIG: Record<NodeType, { label: string; color: string; icon: string; defaultName: string }> = {
  start: { label: '开始', color: '#10B981', icon: 'Play', defaultName: '开始' },
  draft: { label: '起草', color: '#3B82F6', icon: 'FileText', defaultName: '合同起草' },
  business_confirm: { label: '业务确认', color: '#8B5CF6', icon: 'Building2', defaultName: '业务部门确认' },
  legal_review: { label: '法务审核', color: '#1E3A5F', icon: 'Scale', defaultName: '法务合规审核' },
  financial_review: { label: '财务复核', color: '#F59E0B', icon: 'Landmark', defaultName: '财务预算复核' },
  stamp: { label: '盖章', color: '#EF4444', icon: 'Stamp', defaultName: '合同盖章' },
  archive: { label: '归档', color: '#06B6D4', icon: 'Archive', defaultName: '合同归档' },
  condition: { label: '条件分支', color: '#C9A962', icon: 'GitBranch', defaultName: '条件判断' },
  end: { label: '结束', color: '#6B7280', icon: 'StopCircle', defaultName: '结束' },
};

export const CONTRACT_TYPE_CONFIG: Record<ContractType, { label: string; color: string }> = {
  purchase: { label: '采购合同', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  sales: { label: '销售合同', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  service: { label: '服务合同', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  labor: { label: '劳动合同', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  other: { label: '其他合同', color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  low: { label: '普通', color: 'bg-gray-50 text-gray-600', dot: 'bg-gray-400' },
  medium: { label: '一般', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  high: { label: '重要', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  urgent: { label: '紧急', color: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

export const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  pending: { label: '审批中', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: '已通过', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: '已驳回', color: 'bg-red-50 text-red-700 border-red-200' },
  archived: { label: '已归档', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const APPROVAL_ACTION_CONFIG: Record<ApprovalAction, { label: string; color: string; icon: string }> = {
  approve: { label: '同意', color: 'text-emerald-600 bg-emerald-50', icon: 'CheckCircle2' },
  reject: { label: '驳回', color: 'text-red-600 bg-red-50', icon: 'XCircle' },
  sign: { label: '加签', color: 'text-amber-600 bg-amber-50', icon: 'UserPlus' },
  transfer: { label: '转办', color: 'text-blue-600 bg-blue-50', icon: 'Share2' },
};

export const DEPARTMENTS = [
  '市场销售部', '采购供应部', '技术研发部', '人力资源部', '财务部', '法务部', '行政管理部',
];

export const USERS = [
  { id: 'u1', name: '张明远', role: 'applicant' as const, department: '市场销售部' },
  { id: 'u2', name: '李思琪', role: 'applicant' as const, department: '采购供应部' },
  { id: 'u3', name: '王建国', role: 'approver' as const, department: '市场销售部' },
  { id: 'u4', name: '赵敏', role: 'approver' as const, department: '采购供应部' },
  { id: 'u5', name: '陈剑锋', role: 'approver' as const, department: '法务部' },
  { id: 'u6', name: '周雪梅', role: 'approver' as const, department: '财务部' },
  { id: 'u7', name: '刘德华', role: 'approver' as const, department: '行政管理部' },
  { id: 'u8', name: '孙文涛', role: 'admin' as const, department: '法务部' },
  { id: 'u9', name: '吴雅琴', role: 'manager' as const, department: '法务部' },
];
