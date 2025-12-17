import { Routes } from '@angular/router';
import { AuthComponent } from './layouts/auth/auth.component';
import { DashboardComponent } from './layouts/dashboard/dashboard.component';
import { AdminDashboardComponent } from './pages/admin/components/admin-dashboard/admin-dashboard.component';
import { AssessmentComponent } from './pages/admin/components/assessment/assessment.component';
import { AssessmentDetailComponent } from './pages/admin/components/assessment/components/assessment-detail/assessment-detail.component';
import { AssessmentListComponent } from './pages/admin/components/assessment/components/assessment-list/assessment-list.component';

import { AssessmentViewComponent } from './pages/admin/components/assessment/components/assessment-view/assessment-view.component';
import { CandidateDetailViewComponent } from './pages/admin/components/assessment/components/assessment-view/components/candidate-detail-view/candidate-detail-view.component';
import { AssessmentSummaryComponent } from './pages/admin/components/interviews/components/assessment-summary/assessment-summary.component';
import { InterviewCandidateListComponent } from './pages/admin/components/interviews/components/interview-candidate-list/interview-candidate-list.component';
import { InterviewDetailComponent } from './pages/admin/components/interviews/components/interview-detail/interview-detail.component';
import { InterviewsComponent } from './pages/admin/components/interviews/interviews.component';
import { RolesAccessComponent } from './pages/admin/components/roles-access/roles-access.component';
import { BatchesComponent } from './pages/admin/components/settings/components/batches/batches.component';
import { DepartmentsComponent } from './pages/admin/components/settings/components/departments/departments.component';
import { InterviewerPanelAssignmentComponent } from './pages/admin/components/settings/components/interviewer-panel-assignment/interviewer-panel-assignment.component';
import { PanelsComponent } from './pages/admin/components/settings/components/panels/panels.component';
import { QuestionsComponent } from './pages/admin/components/settings/components/questions/questions.component';
import { SettingsComponent } from './pages/admin/components/settings/settings.component';
import { LoginComponent } from './pages/auth/components/login/login.component';
import { ResetPasswordChangeComponent } from './pages/auth/components/reset-password-change/reset-password-change.component';
import { ResetPasswordComponent } from './pages/auth/components/reset-password/reset-password.component';
import { CandidateComponent } from './pages/candidate/candidate.component';
import { CandidateTestComponent } from './pages/candidate/components/candidate-test/candidate-test.component';
import { CandidateThankyouComponent } from './pages/candidate/components/candidate-thankyou/candidate-thankyou.component';
import { CoordinatorAssignmentComponent } from './pages/coordinator/component/coordinator-assessment/components/coordinator-assignment/coordinator-assignment.component';
import { CoordinatorDetailsComponent } from './pages/coordinator/component/coordinator-assessment/components/coordinator-details/coordinator-details.component';
import { CoordinatorAssessmentComponent } from './pages/coordinator/component/coordinator-assessment/coordinator-assessment.component';
import { CoordinatorDashboardComponent } from './pages/coordinator/component/coordinator-dashboard/coordinator-dashboard.component';
import { FrontdeskBatchAssignmentComponent } from './pages/frontdesk/components/frontdesk-assessment-rounds/components/frontdesk-batch-assignment/frontdesk-batch-assignment.component';
import { FrontdeskAssessmentRoundsComponent } from './pages/frontdesk/components/frontdesk-assessment-rounds/frontdesk-assessment-rounds.component';
import { FrontdeskDashboardComponent } from './pages/frontdesk/components/frontdesk-dashboard/frontdesk-dashboard.component';
import { InterviewerCandidateListComponent } from './pages/interviewer/components/Interviewer-list/components/interviewer-candidate-list/interviewer-candidate-list.component';
import { InterviewerFeedbackComponent } from './pages/interviewer/components/Interviewer-list/components/interviewer-feedback/interviewer-feedback.component';
import { InterviewerDashboardComponent } from './pages/interviewer/components/interviewer-dashboard/interviewer-dashboard.component';
import { ProfileComponent } from './shared/components/pages/profile/profile.component';
import { backButtonGuard } from './shared/guards/back-button.guard';
import { DeviceWidthGuard } from './shared/guards/device-width.guard';

export const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'forgot-password', component: ResetPasswordComponent },
      {
        path: 'reset-password',
        component: ResetPasswordChangeComponent,
      },
    ],
  },
  {
    path: 'admin',
    component: DashboardComponent,

    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      {
        path: 'recruitments',
        component: AssessmentComponent,
        children: [
          {
            path: '',
            component: AssessmentListComponent,
          },
          { path: ':id', component: AssessmentDetailComponent },
          {
            path: 'schedule/:id',
            component: AssessmentViewComponent,
          },
          {
            path: 'candidateDetail/:recruitmentId/:candidateId',
            component: CandidateDetailViewComponent,
          },
        ],
      },
      {
        path: 'interviews',
        component: InterviewsComponent,
        children: [
          {
            path: '',
            component: AssessmentSummaryComponent,
          },
          {
            path: ':id/:panel',
            component: InterviewCandidateListComponent,
          },
          {
            path: ':recruitmentId/:assessmentRoundId/:interviewId/:email',
            component: InterviewDetailComponent,
          },
        ],
      },
      {
        // Route for admin users accessing coordinator features
        // Full path: /admin/coordinator
        path: 'coordinator',
        component: CoordinatorDashboardComponent,
        children: [
          { path: ':id', component: CoordinatorAssessmentComponent },
          {
            path: ':recruitmentId/:assessmentRoundId',
            component: CoordinatorAssignmentComponent,
          },
        ],
      },
      {
        path: 'roles-access',
        component: RolesAccessComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
        children: [
          { path: 'questions', component: QuestionsComponent },
          {
            path: 'batches',
            component: BatchesComponent,
          },
          { path: 'departments', component: DepartmentsComponent },
          { path: 'panels', component: PanelsComponent },
          {
            path: 'panel-assignment',
            component: InterviewerPanelAssignmentComponent,
          },
        ],
      },
    ],
  },
  {
    path: 'profile',
    component: DashboardComponent,
    children: [
      {
        path: '',
        component: ProfileComponent,
      },
      {
        path: ':userid/:recruitmentId',
        component: ProfileComponent,
      },
    ],
  },
  {
    path: 'interviewer',
    component: DashboardComponent,

    children: [
      { path: '', component: InterviewerDashboardComponent },
      {
        path: ':id/:panel',
        component: InterviewerCandidateListComponent,
      },
      {
        path: ':recruitmentId/:assessmentRoundId/:interviewId/:email',
        component: InterviewerFeedbackComponent,
      },
    ],
  },

  {
    path: 'candidate',
    component: DashboardComponent,
    children: [
      { path: '', component: CandidateComponent },

      {
        path: 'thank-you',
        component: CandidateThankyouComponent,
      },
    ],
  },
  {
    path: 'candidate/test',
    component: CandidateTestComponent,
    canActivate: [DeviceWidthGuard],
    canDeactivate: [backButtonGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    // Route for coordinator role users (top-level)
    // Full path: /coordinator
    // Note: This is different from /admin/coordinator above - both routes are needed
    path: 'coordinator',
    component: DashboardComponent,
    children: [
      { path: '', component: CoordinatorDashboardComponent },
      {
        path: 'recruitments',
        component: CoordinatorDetailsComponent,
        children: [
          { path: ':id', component: CoordinatorAssessmentComponent },
          {
            path: ':recruitmentId/:assessmentRoundId',
            component: CoordinatorAssignmentComponent,
          },
        ],
      },
    ],
  },
  {
    path: 'frontdesk',
    component: DashboardComponent,

    children: [
      { path: '', component: FrontdeskDashboardComponent },
      {
        path: 'recruitments',
        children: [
          { path: ':id', component: FrontdeskAssessmentRoundsComponent },
          {
            path: ':recruitmentId/round',
            children: [
              { path: ':id', component: FrontdeskBatchAssignmentComponent },
            ],
          },
        ],
      },
    ],
  },
];
