import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/components/login/login.component';
import { PageLayout } from './shared/enum/enum';
import { setLayout } from './shared/resolvers/set-layout.resolver';

import { AssessmentComponent } from './modules/assessment/assessment.component';
import { ThankYouComponent } from './modules/assessment/components/thank-you/thank-you.component';
import { backButtonGuard } from './modules/assessment/guards/backButton.guard';
import { CandidateComponent } from './modules/candidate/candidate.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'candidate',
    component: CandidateComponent,
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
    },
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'candidate/test',
    component: AssessmentComponent,
    canDeactivate: [backButtonGuard],
    runGuardsAndResolvers: 'always',
    resolve: {
      layout: setLayout(PageLayout.FullScreen),
    },
  },
  {
    path: 'candidate/thank-you',
    component: ThankYouComponent,
    resolve: {
      layout: setLayout(PageLayout.FullScreen),
    },
  },
  {
    path: 'login',
    component: LoginComponent,
    resolve: {
      layout: setLayout(PageLayout.AuthLayout),
    },
  },
];
