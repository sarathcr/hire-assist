import { Routes } from '@angular/router';
import { CandidateComponent } from './modules/candidate/candidate.component';
import { setLayout } from './shared/resolvers/set-layout.resolver';
import { PageLayout } from './shared/enum/enum';

export const routes: Routes = [
  {
    path: 'candidate',
    component: CandidateComponent,
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
    },
  },
];
