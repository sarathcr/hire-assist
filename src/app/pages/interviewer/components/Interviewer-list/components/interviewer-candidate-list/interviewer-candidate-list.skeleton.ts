import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-interviewer-candidate-list-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, TableModule],
  template: `
    <div class="interview-candidate">
      <h2>Today's Interviews</h2>
      <div class="card table_skeleton">
        <p-table [value]="products">
          <ng-template #header>
            <tr>
              <th><p-skeleton /></th>
              <th><p-skeleton /></th>
              <th><p-skeleton /></th>
              <th><p-skeleton /></th>
            </tr>
          </ng-template>
          <ng-template #body let-product>
            <tr>
              <td><p-skeleton /></td>
              <td><p-skeleton /></td>
              <td><p-skeleton /></td>
              <td><p-skeleton /></td>
            </tr>
          </ng-template>
        </p-table>
      </div>
      <h2>Previous Interviews</h2>

      <h2>UpComing Interviews</h2>
    </div>
  `,
  styleUrl: './interviewer-candidate-list.component.scss',
})
export class InterviewerCandidateListSkeletonComponent {
  public products = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
}
