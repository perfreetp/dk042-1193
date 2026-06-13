import { create } from 'zustand';
import {
  User, WorkflowTemplate, Contract, ContractTemplate, ApprovalRecord,
  WorkflowNode, WorkflowConnection,
} from '@/types';
import {
  mockCurrentUser, mockWorkflows, mockContracts, mockTemplates,
  mockDepartmentStats, mockNodeEfficiency, mockAmountDistribution,
} from '@/utils/mockData';
import { DepartmentStats, NodeEfficiency, AmountDistribution } from '@/types';

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

  advanceContractNode: (contractId: string) => void;
  rejectContract: (contractId: string, record: ApprovalRecord) => void;
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

  advanceContractNode: (contractId) => {
    const { contracts, workflows } = get();
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;
    const workflow = workflows.find((w) => w.id === contract.workflowId);
    if (!workflow) return;
    const nodesInOrder = workflow.nodes;
    const currentIdx = nodesInOrder.findIndex((n) => n.id === contract.currentNodeId);
    if (currentIdx === -1 || currentIdx >= nodesInOrder.length - 1) return;

    const nextNode = nodesInOrder[currentIdx + 1];
    let newStatus = contract.status;
    let actualArchiveTime = contract.actualArchiveTime;

    if (nextNode.type === 'end') {
      newStatus = 'archived';
      actualArchiveTime = new Date().toISOString();
    } else if (nextNode.type === 'archive') {
      newStatus = 'approved';
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
