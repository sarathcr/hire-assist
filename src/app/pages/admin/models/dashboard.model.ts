export interface Assessment {
  total: number;
  active: number;
  inactive: number;
  completed: number;
}

export interface Users {
  total: number;
}

export interface Questions {
  total: number;
}

export interface RecentActivity {
  message: string;
  time: string;
  type: 'primary' | 'success' | 'danger' | 'info' | 'warning';
  icon: string;
  candidateName?: string | null;
  updaterName?: string | null;
  assessmentName?: string | null;
  action?: string | null;
  field?: string | null;
  previousValue?: any;
  currentValue?: any;
  details?: string | null;
}

export interface DashboardSummary {
  assessment: Assessment;
  users: Users;
  questions: Questions;
  recentActivities?: RecentActivity[];
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
  activeRecruitments?: {
    id: number;
    name: string;
    startDateTime?: string;
    activeRoundsPercentage?: number;
  }[];
  userDetails?: {
    name: string;
    profileImage: string;
  };
}

export interface DashboardData {
  data: DashboardSummary;
}
