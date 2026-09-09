export interface InstructionRuleItem {
  id?: string;
  text: string;
}

export interface InstructionSection {
  title: string;
  severity: 'danger' | 'info' | 'success' | 'warn' | 'primary';
  icon: string;
  rules: string[];
  collapsed?: boolean;
}

export interface AptitudeInstruction {
  id: number;
  title: string;
  description?: string;
  version: string;
  parentId?: number;
  content: string; // JSON encoded string of InstructionSection[]
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  hasCompletedRecruitmentReferences?: boolean;
}

export interface AptitudeInstructionSummary {
  id: number;
  title: string;
  description?: string;
  version: string;
  parentId?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAptitudeInstructionRequest {
  title: string;
  description?: string;
  version?: string;
  content: string;
  isDefault: boolean;
}

export interface UpdateAptitudeInstructionRequest {
  id: number;
  title: string;
  description?: string;
  version?: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface SaveAsNewVersionRequest {
  sourceInstructionId?: number;
  title: string;
  description?: string;
  version: string;
  content: string;
  isDefault: boolean;
}

export interface AssignInstructionToRoundRequest {
  assessmentRoundId: number;
  instructionId?: number | null;
}
