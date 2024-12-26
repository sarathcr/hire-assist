import { Routes } from '@angular/router';
//import { CandidateComponent } from './modules/candidate/candidate.component';
import { AssessmentComponent } from './modules/assessment/assessment.component';
import { backButtonGuard } from './modules/assessment/guards/backButton.guard';
import { CandidateComponent } from './modules/candidate/candidate.component';
import { PageLayout } from './shared/enum/enum';
import { setLayout } from './shared/resolvers/set-layout.resolver';
import { ThankYouComponent } from './modules/assessment/components/thank-you/thank-you.component';

export const routes: Routes = [
  { path: '', redirectTo: 'candidate', pathMatch: 'full' },
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
];
