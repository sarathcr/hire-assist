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
  recentActivities?: { message: string; time: string; type: 'primary' | 'success' | 'danger' | 'info'; icon: string }[];
  upcomingInterviews?: { 
    candidate: string; 
    role: string; 
    time: string; 
    interviewer: string; 
    avatar: string;
    assessmentId: number;
    candidateId: string;
    interviewId: number;
  }[];
}

export interface DashboardData {
  data: DashboardSummary;
}
