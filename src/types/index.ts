export type NodeType = 'start' | 'draft' | 'business_confirm' | 'legal_review' | 'financial_review' | 'stamp' | 'archive' | 'condition' | 'end';

export type AssigneeType = 'role' | 'user' | 'supervisor' | 'auto';
export type TimeUnit = 'hour' | 'day';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  assigneeType: AssigneeType;
  assignees: string[];
  timeLimit: number;
  timeUnit: TimeUnit;
  requiredMaterials: string[];
  conditionExpression?: string;
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
export type ContractType = 'purchase' | 'sales' | 'service' | 'labor' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface ContractAttachment {
  id: string;
  name: string;
  size: number;
  uploadTime: string;
  uploader: string;
  fileType: string;
}

export type ApprovalAction = 'approve' | 'reject' | 'sign' | 'transfer';

export interface Signatory {
  id: string;
  userId: string;
  userName: string;
  nodeId: string;
  status: 'pending' | 'approved' | 'rejected';
  opinion: string;
  actionTime?: string;
}

export interface ApprovalRecord {
  nodeId: string;
  nodeName: string;
  approverId: string;
  approverName: string;
  action: ApprovalAction;
  opinion: string;
  time: string;
  signatoryId?: string;
}

export interface Contract {
  id: string;
  code: string;
  name: string;
  type: ContractType;
  amount: number;
  status: ContractStatus;
  priority: Priority;
  workflowId: string;
  currentNodeId: string;
  applicantId: string;
  applicantName: string;
  department: string;
  createTime: string;
  expectedArchiveTime: string;
  actualArchiveTime?: string;
  attachments: ContractAttachment[];
  approvalHistory: ApprovalRecord[];
  signatories: Signatory[];
}

export interface ContractTemplate {
  id: string;
  name: string;
  type: ContractType;
  version: string;
  description: string;
  fileName: string;
  fileSize: number;
  usageCount: number;
  lastUpdated: string;
  enabled: boolean;
}

export interface DepartmentStats {
  department: string;
  totalContracts: number;
  avgDuration: number;
  completedCount: number;
  rejectedCount: number;
}

export interface NodeEfficiency {
  nodeName: string;
  avgDuration: number;
  totalCount: number;
  timeoutCount: number;
  rejectionRate: number;
}

export interface AmountDistribution {
  range: string;
  count: number;
  totalAmount: number;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'applicant' | 'approver' | 'manager';
  roleName: string;
  department: string;
  avatar: string;
}
