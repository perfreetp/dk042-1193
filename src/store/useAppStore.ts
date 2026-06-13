import { create } from 'zustand';
import {
  User, WorkflowTemplate, Contract, ContractTemplate, ApprovalRecord,
  WorkflowNode, WorkflowConnection, ContractAttachment, Signatory,
} from '@/types';
import {
  mockCurrentUser, mockWorkflows, mockContracts, mockTemplates,
  mockDepartmentStats, mockNodeEfficiency, mockAmountDistribution,
} from '@/utils/mockData';
import { DepartmentStats, NodeEfficiency, AmountDistribution } from '@/types';
import { generateId } from '@/utils/helpers';

interface AppState {
  currentUser: User;
  workflows: WorkflowTemplate[];
  contracts: Contract[];
  templates: ContractTemplate[];
  departmentStats: DepartmentStats[];
  nodeEfficiency: NodeEfficiency[];
  amountDistribution: AmountDistribution[];

  activeWorkflowId: string | null;
  setActiveWorkflowId: (id: string | null) => void;

  addWorkflow: (wf: WorkflowTemplate) => void;
  updateWorkflow: (id: string, data: Partial<WorkflowTemplate>) => void;
  deleteWorkflow: (id: string) => void;
  toggleWorkflowEnabled: (id: string) => void;
  updateWorkflowNodes: (id: string, nodes: WorkflowNode[]) => void;
  updateWorkflowConnections: (id: string, connections: WorkflowConnection[]) => void;

  addContract: (contract: Contract) => void;
  updateContract: (id: string, data: Partial<Contract>) => void;
  addApprovalRecord: (contractId: string, record: ApprovalRecord) => void;
  addAttachment: (contractId: string, attachment: Omit<ContractAttachment, 'id'>) => void;

  addSignatory: (contractId: string, signatory: Omit<Signatory, 'id' | 'status' | 'opinion'>) => void;
  handleSignatoryApproval: (contractId: string, signatoryId: string, approved: boolean, opinion: string) => void;

  advanceContractNode: (contractId: string) => void;
  rejectContract: (contractId: string, record: ApprovalRecord) => void;

  evaluateCondition: (expression: string, contract: Contract) => boolean;
  findNextNode: (workflow: WorkflowTemplate, currentNodeId: string, contract: Contract) => WorkflowNode | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockCurrentUser,
  workflows: mockWorkflows,
  contracts: mockContracts,
  templates: mockTemplates,
  departmentStats: mockDepartmentStats,
  nodeEfficiency: mockNodeEfficiency,
  amountDistribution: mockAmountDistribution,

  activeWorkflowId: null,
  setActiveWorkflowId: (id) => set({ activeWorkflowId: id }),

  addWorkflow: (wf) => set((s) => ({ workflows: [...s.workflows, wf] })),

  updateWorkflow: (id, data) => set((s) => ({
    workflows: s.workflows.map((w) => (w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w)),
  })),

  deleteWorkflow: (id) => set((s) => ({
    workflows: s.workflows.filter((w) => w.id !== id),
    activeWorkflowId: s.activeWorkflowId === id ? null : s.activeWorkflowId,
  })),

  toggleWorkflowEnabled: (id) => set((s) => ({
    workflows: s.workflows.map((w) => (w.id === id ? { ...w, enabled: !w.enabled, updatedAt: new Date().toISOString() } : w)),
  })),

  updateWorkflowNodes: (id, nodes) => set((s) => ({
    workflows: s.workflows.map((w) => (w.id === id ? { ...w, nodes, updatedAt: new Date().toISOString() } : w)),
  })),

  updateWorkflowConnections: (id, connections) => set((s) => ({
    workflows: s.workflows.map((w) => (w.id === id ? { ...w, connections, updatedAt: new Date().toISOString() } : w)),
  })),

  addContract: (contract) => set((s) => ({ contracts: [contract, ...s.contracts] })),

  updateContract: (id, data) => set((s) => ({
    contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)),
  })),

  addApprovalRecord: (contractId, record) => set((s) => ({
    contracts: s.contracts.map((c) => (
      c.id === contractId ? { ...c, approvalHistory: [...c.approvalHistory, record] } : c
    )),
  })),

  addAttachment: (contractId, attachment) => set((s) => ({
    contracts: s.contracts.map((c) => (
      c.id === contractId
        ? {
            ...c,
            attachments: [...c.attachments, { ...attachment, id: generateId() }],
          }
        : c
    )),
  })),

  addSignatory: (contractId, signatory) => set((s) => ({
    contracts: s.contracts.map((c) => (
      c.id === contractId
        ? {
            ...c,
            signatories: [...c.signatories, {
              ...signatory,
              id: generateId(),
              status: 'pending',
              opinion: '',
            }],
          }
        : c
    )),
  })),

  handleSignatoryApproval: (contractId, signatoryId, approved, opinion) => {
    const { contracts, currentUser } = get();
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const signatory = contract.signatories.find((s) => s.id === signatoryId);
    if (!signatory || signatory.status !== 'pending') return;

    const node = contract.signatories.filter(
      (s) => s.nodeId === signatory.nodeId && s.status === 'pending'
    ).length === 1;

    const newStatus: 'approved' | 'rejected' = approved ? 'approved' : 'rejected';
    const updatedSignatories = contract.signatories.map((s) =>
      s.id === signatoryId
        ? { ...s, status: newStatus, opinion, actionTime: new Date().toISOString() }
        : s
    );

    const record: ApprovalRecord = {
      nodeId: signatory.nodeId,
      nodeName: '加签审批',
      approverId: currentUser.id,
      approverName: currentUser.name,
      action: approved ? 'approve' : 'reject',
      opinion,
      time: new Date().toISOString(),
      signatoryId,
    };

    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const pendingCount = updatedSignatories.filter(
          (s) => s.nodeId === signatory.nodeId && s.status === 'pending'
        ).length;

        const allSignatoriesApproved = updatedSignatories
          .filter((s) => s.nodeId === signatory.nodeId)
          .every((s) => s.status === 'approved');

        let newStatus = c.status;
        if (approved && pendingCount === 0 && allSignatoriesApproved) {
          newStatus = 'pending';
        }

        return {
          ...c,
          signatories: updatedSignatories,
          approvalHistory: [...c.approvalHistory, record],
          status: newStatus,
        };
      }),
    }));

    const contractAfterUpdate = get().contracts.find((c) => c.id === contractId);
    const allDone = contractAfterUpdate?.signatories
      .filter((s) => s.nodeId === signatory.nodeId)
      .every((s) => s.status === 'approved');

    if (approved && allDone && node) {
      setTimeout(() => {
        get().advanceContractNode(contractId);
      }, 300);
    }
  },

  evaluateCondition: (expression, contract) => {
    try {
      const { amount, department, type, priority, applicantName } = contract;
      const fn = new Function('amount', 'department', 'type', 'priority', 'applicantName', `return ${expression}`);
      return !!fn(amount, department, type, priority, applicantName);
    } catch (e) {
      console.warn('Condition evaluation failed:', expression, e);
      return false;
    }
  },

  findNextNode: (workflow, currentNodeId, contract) => {
    const currentNode = workflow.nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) return null;

    const outConnections = workflow.connections.filter((c) => c.from === currentNodeId);

    if (currentNode.type === 'condition') {
      for (const conn of outConnections) {
        if (conn.condition) {
          if (get().evaluateCondition(conn.condition, contract)) {
            return workflow.nodes.find((n) => n.id === conn.to) || null;
          }
        }
      }
      const elseConn = outConnections.find((c) => !c.condition);
      if (elseConn) {
        return workflow.nodes.find((n) => n.id === elseConn.to) || null;
      }
      return null;
    }

    if (outConnections.length === 0) return null;

    const normalConn = outConnections[0];
    const nextNode = workflow.nodes.find((n) => n.id === normalConn.to);
    if (nextNode && nextNode.type === 'condition') {
      return get().findNextNode(workflow, nextNode.id, contract);
    }
    return nextNode || null;
  },

  advanceContractNode: (contractId) => {
    const { contracts, workflows, findNextNode } = get();
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;
    const workflow = workflows.find((w) => w.id === contract.workflowId);
    if (!workflow) return;

    const pendingSignatories = contract.signatories.filter(
      (s) => s.nodeId === contract.currentNodeId && s.status === 'pending'
    );
    if (pendingSignatories.length > 0) return;

    const nextNode = findNextNode(workflow, contract.currentNodeId, contract);
    if (!nextNode) return;

    let newStatus = contract.status;
    let actualArchiveTime = contract.actualArchiveTime;

    if (nextNode.type === 'end') {
      newStatus = 'archived';
      actualArchiveTime = new Date().toISOString();
    } else if (nextNode.type === 'archive') {
      newStatus = 'approved';
    } else if (nextNode.type === 'condition') {
      const finalNode = findNextNode(workflow, nextNode.id, contract);
      if (finalNode && finalNode.type === 'end') {
        newStatus = 'archived';
        actualArchiveTime = new Date().toISOString();
      } else if (finalNode && finalNode.type === 'archive') {
        newStatus = 'approved';
      } else {
        newStatus = 'pending';
      }
      if (finalNode) {
        set((s) => ({
          contracts: s.contracts.map((c) => (
            c.id === contractId
              ? { ...c, currentNodeId: finalNode.id, status: newStatus, actualArchiveTime }
              : c
          )),
        }));
        return;
      }
    } else {
      newStatus = 'pending';
    }

    set((s) => ({
      contracts: s.contracts.map((c) => (
        c.id === contractId
          ? { ...c, currentNodeId: nextNode.id, status: newStatus, actualArchiveTime }
          : c
      )),
    }));
  },

  rejectContract: (contractId, record) => {
    set((s) => ({
      contracts: s.contracts.map((c) => (
        c.id === contractId
          ? { ...c, status: 'rejected', approvalHistory: [...c.approvalHistory, record] }
          : c
      )),
    }));
  },
}));
