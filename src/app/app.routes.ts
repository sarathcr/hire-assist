import { Routes } from '@angular/router';
import { CandidateComponent } from './modules/candidate/candidate.component';
import { setLayout } from './shared/resolvers/set-layout.resolver';
import { PageLayout } from './shared/enum/enum';
import { AuthComponent } from './modules/auth/auth.component';

export const routes: Routes = [
  { path: '', redirectTo: 'candidate', pathMatch: 'full' },
  {
    path: 'candidate',
    component: CandidateComponent,
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
    },
  },
  {
    path: 'auth',
    component: AuthComponent,
    resolve: {
      layout: setLayout(PageLayout.AuthLayout),
    },
  },
];
