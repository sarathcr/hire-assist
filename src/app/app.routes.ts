import { Routes } from '@angular/router';
//import { CandidateComponent } from './modules/candidate/candidate.component';
import { setLayout } from './shared/resolvers/set-layout.resolver';
import { PageLayout } from './shared/enum/enum';
import { AssessmentComponent } from './modules/candidate/pages/assessment/assessment.component';

export const routes: Routes = [
  { path: '', redirectTo: 'assessment', pathMatch: 'full' },
  {
    path: 'assessment',
    component: AssessmentComponent,
    resolve: {
      layout: setLayout(PageLayout.DashBoard),
    },
  },
];
