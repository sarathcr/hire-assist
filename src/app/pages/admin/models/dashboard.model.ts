export interface Assessment {
  total: number;
  active: number;
  inactive: number;
}

export interface Users {
  total: number;
}

export interface Questions {
  total: number;
}

export interface DashboardSummary {
  assessment: Assessment;
  users: Users;
  questions: Questions;
}

export interface DashboardData {
  data: DashboardSummary;
}
