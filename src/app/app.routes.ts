import { Routes } from '@angular/router';
import { AuthComponent } from './layouts/auth/auth.component';
import { DashboardComponent } from './layouts/dashboard/dashboard.component';
import { AdminDashboardComponent } from './pages/admin/components/admin-dashboard/admin-dashboard.component';
import { AssessmentComponent } from './pages/admin/components/assessment/assessment.component';
import { AssessmentDetailComponent } from './pages/admin/components/assessment/components/assessment-detail/assessment-detail.component';
import { AssessmentListComponent } from './pages/admin/components/assessment/components/assessment-list/assessment-list.component';
import { RolesAccessComponent } from './pages/admin/components/roles-access/roles-access.component';
import { BatchesComponent } from './pages/admin/components/settings/components/batches/batches.component';
import { QuestionsComponent } from './pages/admin/components/settings/components/questions/questions.component';
import { SettingsComponent } from './pages/admin/components/settings/settings.component';
import { LoginComponent } from './pages/auth/components/login/login.component';
import { CandidateComponent } from './pages/candidate/candidate.component';
import { CandidateTestComponent } from './pages/candidate/components/candidate-test/candidate-test.component';
import { CandidateThankyouComponent } from './pages/candidate/components/candidate-thankyou/candidate-thankyou.component';
import { AssessmentsComponent } from './pages/interviewer/components/assessment/assessments.component';
import { InterviewerCandidateAssessmentComponent } from './pages/interviewer/components/assessment/components/interviewer-assessment-details/components/interviewer-candidate-assessment/interviewer-candidate-assessment.component';
import { InterviewerAssessmentDetailsComponent } from './pages/interviewer/components/assessment/components/interviewer-assessment-details/interviewer-assessment-details.component';
import { InterviewerAssessmentComponent } from './pages/interviewer/components/assessment/components/interviewer-assessment/interviewer-assessment.component';
import { InterviewerAsssessmentListComponent } from './pages/interviewer/components/assessment/components/interviewer-asssessment-list/interviewer-asssessment-list.component';
import { InterviewerDashboardComponent } from './pages/interviewer/components/interviewer-dashboard/interviewer-dashboard.component';
import { ProfileComponent } from './shared/components/pages/profile/profile.component';
import { backButtonGuard } from './shared/guards/back-button.guard';
import { DeviceWidthGuard } from './shared/guards/device-width.guard';
import { collectionResolver } from './shared/resolvers/collection.resolver';
import { AssessmentViewComponent } from './pages/admin/components/assessment/components/assessment-view/assessment-view.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: AuthComponent,
    children: [{ path: '', component: LoginComponent }],
  },
  {
    path: 'admin',
    component: DashboardComponent,
    resolve: {
      collection: collectionResolver,
    },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      {
        path: 'assessment',
        component: AssessmentComponent,
        children: [
          {
            path: '',
            component: AssessmentListComponent,
          },
          { path: ':id', component: AssessmentDetailComponent },
          { path: 'schedule/:id', component: AssessmentViewComponent },
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
        path: ':userid/:assessmentId',
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
        path: 'assessment',
        component: AssessmentsComponent,
        children: [
          {
            path: '',
            component: InterviewerAsssessmentListComponent,
          },
          {
            path: ':id',
            component: InterviewerAssessmentComponent,
            children: [
              { path: '', component: InterviewerAssessmentDetailsComponent },
              {
                path: ':email',
                component: InterviewerCandidateAssessmentComponent,
              },
            ],
          },
        ],
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
];
