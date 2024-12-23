import { Routes } from '@angular/router';
import { CandidateComponent } from './modules/candidate/candidate.component';
import { setLayout } from './shared/resolvers/set-layout.resolver';
import { PageLayout } from './shared/enum/enum';
import { AssessmentComponent } from './modules/assessment/assessment.component';

export const routes: Routes = [
  { path: '', redirectTo: 'candidate', pathMatch: 'full' },
  {
    path: 'candidate',
    component: CandidateComponent,
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
    },
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: 'test',
        component: AssessmentComponent,
        resolve: {
          layout: setLayout(PageLayout.FullScreen),
        },
      },
    ],
  },
];
