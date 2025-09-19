import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-candidate-detail-previous-assessment-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, TabsModule],
  template: `
    <div class="candidate">
      <p-tabs>
        <p-tabpanels>
          <p-tabpanel>
            <div class="m-0">
              <div class="candidate__details">
                <div class="candidate__card">
                  <div class="candidate__applicationDetails">
                    @for (q of skeletonAssessments; track q) {
                      <div
                        class="candidate__applicationDetails__card-info-item"
                      >
                        <p-skeleton width="10rem" height="1.5rem" />
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styleUrl: './candidate-detail-view.component.scss',
})
export class CandidateDetailPreviousAssessmentSkeletonComponent {
  skeletonAssessments = Array(3);
}
