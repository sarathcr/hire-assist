import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/components/login/login.component';
import { CandidateComponent } from './modules/candidate/candidate.component';
import { PageLayout } from './shared/enum/enum';
import { setLayout } from './shared/resolvers/set-layout.resolver';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'candidate',
    component: CandidateComponent,
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
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
