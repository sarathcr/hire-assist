import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-candidate-detail-view-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, TabsModule],
  template: `
    <div class="candidate">
      <p-tabs>
        <p-tablist>
          <p-tab>
            <p-skeleton width="12rem" height="2rem" />
          </p-tab>
          <p-tab>
            <p-skeleton width="16rem" height="2rem" />
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel>
            <div class="m-0">
              <h3><p-skeleton width="14rem" /></h3>
              <div class="candidate__details">
                <div class="candidate__card">
                  <div class="candidate__card-content">
                    @for (item of skeletonItems; track item) {
                      <div class="candidate__card-info-item">
                        <p-skeleton width="10rem" height="1.5rem" />
                      </div>
                    }
                  </div>
                </div>
              </div>

              <h3><p-skeleton width="14rem" /></h3>
              <div class="candidate__details">
                <div class="candidate__card">
                  <div class="candidate__applicationDetails">
                    @for (q of skeletonQuestions; track q) {
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
export class CandidateDetailViewSkeletonComponent {
  skeletonItems = Array(5);
  skeletonQuestions = Array(3);
}
