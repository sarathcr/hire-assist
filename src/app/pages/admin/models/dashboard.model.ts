export interface Assessment {
  total: number;
  active: number;
  inactive: number;
}

export interface Users {
  total: number;
}

export interface QuestionSet {
  total: number;
}

export interface DashboardSummary {
  assessment: Assessment;
  users: Users;
  questionSet: QuestionSet;
}

export interface DashboardData {
  data: DashboardSummary;
}
