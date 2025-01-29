import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/components/login/login.component';
import { PageLayout } from './shared/enum/enum';
import { setLayout } from './shared/resolvers/set-layout.resolver';

import { AdminComponent } from './modules/admin/admin.component';
import { AssessmentComponent } from './modules/assessment/assessment.component';
import { ThankYouComponent } from './modules/assessment/components/thank-you/thank-you.component';
import { backButtonGuard } from './modules/assessment/guards/backButton.guard';
import { CandidateComponent } from './modules/candidate/candidate.component';
import { ProfileComponent } from './shared/components/profile/profile.component';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { thankYouGuard } from './shared/guards/thank-you.guard';
import { DeviceWidthGuard } from './shared/guards/device-warning.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'candidate',
    component: CandidateComponent,
    // canActivate: [AuthGuard],
    // data: { roles: [RolesEnum.Candidate] },
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
    },
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'candidate/test',
    component: AssessmentComponent,
    canActivate: [DeviceWidthGuard],
    // canActivate: [AuthGuard, DeviceWidthGuard],
    canDeactivate: [backButtonGuard],
    runGuardsAndResolvers: 'always',
    // data: { roles: [RolesEnum.Candidate] },
    resolve: {
      layout: setLayout(PageLayout.FullScreen),
    },
  },
  {
    path: 'candidate/thank-you',
    component: ThankYouComponent,
    // canActivate: [AuthGuard],
    canDeactivate: [thankYouGuard],
    // data: { roles: [RolesEnum.Candidate] },
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
  {
    path: 'admin',
    component: AdminComponent,
    // canActivate: [AuthGuard],
    // data: { roles: [RolesEnum.SuperAdmin, RolesEnum.Admin] },
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
    },
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'profile',
    component: ProfileComponent,
    // canActivate: [AuthGuard],
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
    },
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    resolve: {
      layout: setLayout(PageLayout.FullScreen),
    },
  },
];
